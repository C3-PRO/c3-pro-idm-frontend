/*
 *  API wrapper for research data to be sent to the data backend, based on
 *  subject links.
 */
var request = require('request');
var moment = require('moment');
var fs = require('fs');
var url = require('url');
var path = require('path');
var mustache = require('mustache');
var config = require('../utils.js');
var subjects = require('../services/subjects');
var exports = module.exports = {};

var accessTokens = null;
var addResearchDataContext = null;

/**
Takes an `opt` dictionary, which must contain `sssid`, will query all links for
this SSSID and will, for every unique and active link, issue a POST after
filling the respective data template for all data items in `opt.data`.

`opt.data` comes from `config.data` and is filled/replaced by user input.
*/
exports.addResearchData = function(opt, func) {
	if (!config.data || !config.data.base || !config.data.items || 0 == config.data.items) {
		func({'errorMessage': "Not configured to add research data"}, opt);
		return;
	}
	if (!opt.data || 0 == opt.data.length) {
		func({'statusCode': 204}, opt);
		return;
	}
	if (!opt.sssid) {
		func({errorMessage: "No SSSID given, cannot send data"}, opt);
		return;
	}
	
	subjects.getSubjectLinks(opt, function(json, opt) {
		if (json.data) {
			//console.log('services/data/addResearchData() body.data', opt.data);
			console.log('services/data/addResearchData() subject links', json.data);
			if (json.data.length > 0) {
				var enqueued = 0;
				var contextId = newResearchDataContext(func, opt);
				
				// send to all active links (has `linked_to` and `linked_system` and not `withdrawn_on` and is not dupe)
				var systems_completed = [];
				for (var i = 0; i < json.data.length; i++) {
					var lnk = json.data[i];
					if (lnk.linked_to && lnk.linked_system && !lnk.withdrawn_on && systems_completed.indexOf(lnk.linked_system) < 0) {
						enqueueResearchDataForContext(contextId);
						systems_completed.push(lnk.linked_system);
						enqueued += 1;
						
						var endpoint = (lnk.linked_system+'/oauth').replace(/([^:]\/)\/+/g, $1)
						ensureHasAccessToken(endpoint, function(token, error) {
							try {
								if (!token) {
									throw "Failed to be granted access to "+endpoint+': '+error;
								}
								
								// found a system to send data to: create resources for all data points that were supplied
								var resources = resourcesForData(lnk.linked_to, opt.data);
								console.log('token', token, 'resources', resources);
								
								// TODO: working here
								dequeueResearchDataFromContext(contextId);
								// when done must call: func(json, opt);
							}
							catch (exc) {
								console.error('services/data/addResearchData() subject links', exc);
								dequeueResearchDataFromContext(contextId, exc);
							}
						});
					}
				}
				
				// we're either waiting for access token calls to come back, or don't have active links and can call back already
				if (0 == enqueued) {
					endResearchDataContext(contextId, "This subject has no active links at this time, must enroll and link before research data can be added");
				}
			}
			else {
				func({errorMessage: "Nothing to add, please provide values"}, opt);
			}
		}
		else if (!opt.isRetry) {
			console.log('adding research data failed, retrying', json);
			opt.isRetry = true;
			
		}
		else {
			console.log('adding research data errored', json);
			func(json, opt);
		}
	});
}

function newResearchDataContext(func, opt) {
	var contextId = Math.floor((1 + Math.random()) * 1000000).toString(16);
	addResearchDataContext[contextId] = {
		awaiting: 0,
		func: func,
		opt: opt,
		errors: [],
	};
	return contextId;
}

function enqueueResearchDataForContext(contextId) {
	if (!(contextId in addResearchDataContext)) {
		console.error("enqueueResearchDataForContext for invalid contextId", contextId);
		return;
	}
	var ctx = addResearchDataContext[contextId];
	ctx.awaiting = (ctx.awaiting || 0) + 1;
}

function dequeueResearchDataFromContext(contextId, error) {
	if (!(contextId in addResearchDataContext)) {
		console.error("dequeueResearchDataFromContext from invalid contextId", contextId);
		return;
	}
	var ctx = addResearchDataContext[contextId];
	if (error) {
		ctx.errors.push(error);
	}
	
	var awaiting = (ctx.awaiting || 0) - 1;
	if (awaiting < 0) {
		console.warn("dequeueResearchDataFromContext from context that is not awaiting a dequeue", contextId);
	}
	if (awaiting <= 0) {
		endResearchDataContext(contextId);
	}
}

function endResearchDataContext(contextId, error) {
	if (!(contextId in addResearchDataContext)) {
		console.error("endResearchDataContext on invalid contextId", contextId);
		return;
	}
	var ctx = addResearchDataContext[contextId];
	if (error) {
		ctx.errors.push(error);
	}
	if (ctx.func) {
		var msg = null;
		if (ctx.errors.length > 0) {
			msg = {errorMessage: errors.join("\n")};
		}
		ctx.func(msg, ctx.opt);
	}
	delete addResearchDataContext[contextId];
}


/**

- parameter endpoint: Against which endpoint to authorize
- parameter callback: A function to call, either contains a string (token), true
                      meaning no token needed) or null (failed to get token) for
                      first arg and an error string (if any) as second arg
*/
function ensureHasAccessToken(endpoint, callback) {
	console.log('services/data/ensureHasAccessToken(): endpoint '+endpoint+', host:', url.parse(endpoint).hostname, url.parse(endpoint));
	if (endpoint in accessTokens) {
		console.log('services/data/ensureHasAccessToken() using cached token');
		callback(accessTokens[endpoint], null);
	}
	else {
		var host = url.parse(endpoint).hostname;
		if (config.data && config.data.oauth2 && host in config.data.oauth2) {
			obtainAccessToken(endpoint, config.data.oauth2[host], callback);
		}
		else {
			console.log('services/data/ensureHasAccessToken(): '+host+' is not configured for OAuth2');
			callback(null, null);
		}
	}
}

function obtainAccessToken(endpoint, credentials, callback) {
	console.log('services/data/obtainAccessToken() for', endpoint);
	var client_id = oauth2FormEncode(credentials.client_id);
	var client_secret = oauth2FormEncode(credentials.client_secret);
	var auth = Buffer.from(client_id+':'+client_secret).toString('base64')
	var options = {
        uri: endpoint,
        method : 'POST',
        headers: {
            'Authorization': 'Basic '+auth,
        },
        body: 'grant_type=client_credentials',
    }
    if (credentials.antispam) {
    	options.headers['Antispam'] = credentials.antispam;
    	options.headers['X-Antispam'] = credentials.antispam;
    }
	request(options, function(error, response, body) {
		console.log('services/data/obtainAccessToken() response for', endpoint, 'error', error, 'response', response, 'body', body);
		
		// accessTokens[endpoint] = token
		callback("access-token-abcdef", null);
	});
}

/** Encodes client-id/password for use in the "Authorization: Basic" header for
OAuth2 calls. See https://tools.ietf.org/html/rfc6749#appendix-B.
*/
function oauth2FormEncode(value) {
	return encodeURIComponent(value).replace('%20', '+');
}


/**
Finds the template suitable for the given data "type", fills and returns it.

Must at least have "type" and "value", and should be appropriate for the
template to be used – this is not checked in code!

Will throw, e.g. if the format for `datetime` is invalid.

- parameter element: The dictionary to use to fill the template
- parameter base:    The base name of the directory the template is in, will be
					 appended to "template-"
*/
function resourceForData(element, base) {
	if (!('type' in element) || !element.type || !('value' in element) || !element.value) {
		return null;
	}
	if (element.datetime) {
		var iso = moment(element.datetime);
		if (!iso.isValid() || iso.year() < 1900 || iso.year() > 2100) {
			throw "The date and time \""+element.datetime+"\" is not valid, please provide the date in a common format, for example \"YYYY-MM-DD HH:mm\"";
		}
		element.datetime = iso.format();
	}
	else {
		element.datetime = moment().format();
	}
	var mst = fs.readFileSync(path.join(__dirname, '../templates-'+base+'/data-'+element.type+'.json'))
	var resource = mustache.render(mst.toString(), element);
	return resource;
}

/**
Returns resources for all data elements found in the input array.

Forwards to `resourceForData()`, hence may re-throw.
*/
function resourcesForData(uuid, data) {
	var templates = {};
	for (var i = 0; i < config.data.items.length; i++) {
		var tpl = config.data.items[i];
		if (tpl.id) {
			templates[tpl.id] = tpl;
		}
	}
	
	var resources = [];
	for (var i = 0; i < data.length; i++) {
		var dat = data[i];
		if (dat.id && templates[dat.id]) {
			var elem = templates[dat.id];
			for (var p in dat) {
				elem[p] = dat[p];
			}
			elem.uuid = uuid;
			var resource = resourceForData(elem, config.data.base);
			if (resource) {
				resources.push(resource);
			}
		}
		else {
			console.error("data.resourcesForData(): cannot determine research data for the following input, skipping", dat);
		}
	}
	return resources;
}

