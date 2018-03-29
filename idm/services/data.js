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
var semver = require('semver');
var querystring = require('querystring');
var config = require('../utils.js');
var subjects = require('../services/subjects');
var exports = module.exports = {};

var accessHeaders = {};
var addResearchDataContext = {};

/**
Takes an `opt` dictionary, which must contain `sssid`, will query all links for
this SSSID and will, for every unique and active link, issue a POST after
filling the respective data template for all data items in `opt.data`.

`opt.data` comes from `config.data` and is filled/replaced by user input.
*/
exports.addResearchData = function(opt, func) {
	if (!config.data || !config.data.base || !config.data.items || 0 == config.data.items) {
		func({errorMessage: "Not configured to add research data"}, opt);
		return;
	}
	if (!opt.data || 0 == opt.data.length) {
		func({statusCode: 204}, opt);
		return;
	}
	if (!opt.sssid) {
		func({errorMessage: "No SSSID given, cannot send data"}, opt);
		return;
	}
	
	subjects.getSubjectLinks(opt, function(json, opt) {
		if (json.data) {
			//console.log('services/data/addResearchData() body.data', opt.data);
			//console.log('services/data/addResearchData() subject links', json.data);
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
						
						var endpoint = lnk.linked_system;
						ensureHasAccessToken(contextId, endpoint, function(oaContextId, headers, error) {
							try {
								if (!headers) {
									throw "Failed to be granted access to "+endpoint+': '+error;
								}
								
								// found a system to send data to: create resources for all data points that were supplied
								var resources = resourcesForData(lnk.linked_to, opt.data);
								submitResources(oaContextId, endpoint, headers, resources, function(rsrcContextId, errors) {
									
									// when all resources are done the context will call `func(json, opt)`;
									var error = null;
									if (errors != null && errors.length > 0) {
										console.error('services/data/addResearchData() errors sending resources:', errors);
										error = errors.join("\n");
									}
									dequeueResearchDataFromContext(rsrcContextId, error);
								});
							}
							catch (exc) {
								console.error('services/data/addResearchData() has access token exception:', exc);
								dequeueResearchDataFromContext(oaContextId, exc);
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
			func(json, opt);
		}
		else {
			console.error('adding research data errored', json);
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
	
	ctx.awaiting = (ctx.awaiting || 0) - 1;
	if (ctx.awaiting < 0) {
		console.warn("dequeueResearchDataFromContext from context that is not awaiting a dequeue", contextId);
	}
	if (ctx.awaiting <= 0) {
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
			msg = {errorMessage: ctx.errors.join("\n")};
		} else {
			msg = {statusCode: 201};
		}
		ctx.func(msg, ctx.opt);
	}
	delete addResearchDataContext[contextId];
}


/**

- parameter contextId: The context ID to pass through
- parameter endpoint: Against which endpoint to authorize
- parameter callback: A function to call, returns contextId for first arg,
					  contains either a dictionary with all final headers
					  (possibly an empty dict) or null (failed to get token) for
					  second arg and an error string (if any) for thirg arg
*/
function ensureHasAccessToken(contextId, endpoint, callback) {
	if (endpoint in accessHeaders) {
		console.log('services/data/ensureHasAccessToken() using cached token');
		callback(contextId, accessHeaders[endpoint], null);
	}
	else {
		var host = url.parse(endpoint).hostname;
		console.log('services/data/ensureHasAccessToken(): need token for endpoint '+endpoint+' (host:', host, ')');
		if (config.data && config.data.oauth2 && host in config.data.oauth2) {
			obtainAccessToken(contextId, host, config.data.oauth2[host], endpoint, callback);
		}
		else {
			console.error('services/data/ensureHasAccessToken(): '+endpoint+' is not configured for OAuth2');
			callback(contextId, null, endpoint+' is not configured for OAuth2');
		}
	}
}

function obtainAccessToken(contextId, host, config, endpoint, callback) {
	var tokenURL = url.resolve('https://'+host, ('endpoint' in config) ? config.endpoint : null);
	console.log('services/data/obtainAccessToken() tokenURL', tokenURL);
	
	// compose request
	var client_id = oauth2FormEncode(config.client_id);
	var client_secret = oauth2FormEncode(config.client_secret);
	var auth = null;
	if (semver.gte(process.version, '4.5.0')) {
		auth = Buffer.from(client_id+':'+client_secret).toString('base64');
	} else {
		auth = new Buffer(client_id+':'+client_secret).toString('base64');
	}
	
	var body = querystring.stringify({
		'grant_type': 'client_credentials',
		'scope': ('scope' in config) ? config.scope : 'user/*.*',
		'aud': endpoint,
	});
	
	var options = {
		uri: tokenURL,
		method : 'POST',
		headers: {
			'Accept': 'application/json',
			'Authorization': 'Basic '+auth,
			'Content-type': 'application/x-www-form-urlencoded; charset=utf-8',
		},
		body: body,
	};
	if (config.antispam) {
		options.headers['Antispam'] = config.antispam;
		options.headers['X-Antispam'] = config.antispam;
	}
	
	request(options, function(error, response, body) {
		try {
			if (error) {
				throw error;
			}
			var parsed = body ? JSON.parse(body) : {};
			if (response.statusCode >= 400) {
				if (parsed != null && 'error' in parsed) {
					throw parsed.error;
				}
				throw (response.statusMessage || "Error "+response.statusCode);
			}
			if ('access_token' in parsed) {
				var token = parsed.access_token;
				var headers = {'Authorization': 'Bearer '+token};
				if (config.antispam) {
					headers['Antispam'] = config.antispam;
					headers['X-Antispam'] = config.antispam;
				}
				accessHeaders[endpoint] = headers;
				callback(contextId, headers, null);
			} else {
				throw "No access token received despite successful OAuth2 request";
			}
		} catch (exc) {
			console.error('services/data/obtainAccessToken() error in token request: «', exc, '», response: ', response);
			callback(contextId, null, "Failed retrieving access token: "+exc);
		}
	});
}

/** Encodes client-id/password for use in the "Authorization: Basic" header for
OAuth2 calls. See https://tools.ietf.org/html/rfc6749#appendix-B.
*/
function oauth2FormEncode(value) {
	return encodeURIComponent(value).replace('%20', '+');
}


/**
Finds the template suitable for the given data "templateType", fills and returns
it.

Must at least have "templateType" and "value", and should be appropriate for the
template to be used – this is not checked in code!

Will throw, e.g. if the format for `datetime` is invalid.

- parameter element: The dictionary to use to fill the template
- parameter version: FHIR version of the resource
- parameter base:    The base name of the directory the template is in, will be
					 appended to "template-"
*/
function resourceForData(element, version, base) {
	if (!('templateType' in element) || !element.templateType || !('value' in element) || !element.value) {
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
	var mst = fs.readFileSync(path.join(__dirname, '../templates-'+base+'/data-'+element.templateType+'.json'))
	var resource = mustache.render(mst.toString(), element);
	var resourceType = ('resourceType' in element) ? element.resourceType : null;
	
	return [(resourceType || 'Observation'), version, resource];
}

/**
Returns resources for all data elements found in the input array. Return is an
array of tuples containing (resourceType, FHIRVersion, resourceJSONString).

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
			var resource = resourceForData(elem, config.data.version, config.data.base);
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

/**
- parameter contextId: The context id to pass through
- parameter endpoint:  The endpoint base URL to send the FHIR resource to
- parameter headers:   The request header to use (should contain auth info)
- parameter resources: An array of arrays of form ('resourceType', FHIR version,
                       resourceObj)
- parameter callback:  The callback to call once when all resources have been
                       submitted or errored. Returns contextId and an array of
                       errors (which may be null)
*/
function submitResources(contextId, endpoint, headers, resources, callback) {
	console.log('services/data/submitResources() submitting', resources.length, 'resources to', endpoint);
	
	var awaiting = 0;		// primitive dispatch grouping, please do better!
	var errors = [];
	for (var i = 0; i < resources.length; i++) {
		awaiting += 1;
		submitResource(endpoint, headers, resources[i], function(error) {
			awaiting -= 1;
			
			if (error != null) {
				errors.push(error);
			}
			
			if (awaiting < 1) {
				callback(contextId, errors);
			}
		})
	}
}

function submitResource(endpoint, headers, resource, callback) {
	var resourceType = resource[0];
	var FHIRVersion = resource[1];
	var resourceBody = resource[2];	// already a JSON string
	
	var url = endpoint+(('/' == endpoint.slice(-1)) ? '' : '/')+resourceType;
	var ourHeaders = headers || {};
	if (semver.gte(FHIRVersion, '4.0.0')) {
		ourHeaders['Content-type'] = 'application/fhir+json';	// supported since 3.0.0, but not all servers support it yet but should support the old one
	} else {
		ourHeaders['Content-type'] = 'application/json+fhir';
	}
	postData(url, ourHeaders, resourceBody, callback);
}

function postData(url, headers, body, callback) {
	var options = {
		uri: url,
		method : 'POST',
		headers: headers,
		body: body,
	};
	
	console.log('services/data/postData() submitting to', url);
	request(options, function(error, response, body) {
		if (error != null || response.statusCode >= 400) {
			console.error('services/data/postData() response error', error, 'body', body);
			callback(error || response.statusMessage || "Error submitting resource: "+response.statusCode);
		} else {
			callback(null);
		}
	});
}

