/*
 *  API wrapper for research data to be sent to the data backend, based on
 *  subject links.
 */
var request = require('request');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var mustache = require('mustache');
var config = require('../utils.js');
var subjects = require('../services/subjects');
var exports = module.exports = {};


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
				var num = 0;
				
				// send to all active links (has `linked_to` and `linked_system` and not `withdrawn_on` and is not dupe)
				var systems_completed = [];
				for (var i = 0; i < json.data.length; i++) {
					var lnk = json.data[i];
					if (lnk.linked_to && lnk.linked_system && !lnk.withdrawn_on && systems_completed.indexOf(lnk.linked_system) < 0) {
						
						// found a system to send data to, create resources for all data points that were supplied
						try {
							var resources = resourcesForData(lnk.linked_to, opt.data);
							console.log(resources);
							num += 1;
						}
						catch (exc) {
							console.error('services/data/addResearchData() subject links', exc);
							func({errorMessage: exc}, opt);
							return;
						}
					}
				}
				if (num > 0) {
					func(json, opt);
				}
				else {
					func({errorMessage: "This subject has no active links at this time, must enroll and link before research data can be added"}, opt);
				}
			}
			else {
				func({errorMessage: "Nothing to add, please provide values"}, opt);
			}
		}
		else {
			console.log('subject links errored', json.data);
			func(json, opt);
		}
	});
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

