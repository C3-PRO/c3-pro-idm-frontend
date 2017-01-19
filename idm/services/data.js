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


exports.addResearchData = function(opt, func) {
	if (!config.data || !config.data.base || !config.data.items || 0 == config.data.items) {
		func({'errorMessage': "Not configured to add research data"});
		return;
	}
	if (!opt.data || 0 == opt.data.length) {
		func({'statusCode': 204}, opt);
		return;
	}
	if (!opt.sssid) {
		func({errorMessage: 'No SSSID given, cannot send data'});
		return;
	}
	
    subjects.getSubjectLinks(opt, function(json, opt) {
        if (json.data) {
        	//console.log('body.data', opt.data);
            //console.log('subject links', json.data);
            if (json.data.length > 0) {
            	
            	// create resources for all data points that were supplied
            	var resources = resourcesForData(opt.sssid, opt.data);
            	console.log(resources);
            	
            	// send to all active links
            	var systems_completed = [];
            	for (var i = 0; i < json.data.length; i++) {
            		var lnk = json.data[i];
            		if (lnk.linked_to && lnk.linked_system && !lnk.withdrawn_on && systems_completed.indexOf(lnk.linked_system) < 0) {
            			
            			// found a system to send data to
            		}
            	}
            }
            func(json, opt);
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
*/
function resourceForData(element, base) {
	if (!('type' in element) || !element.type || !('value' in element) || !element.value) {
		return null;
	}
	if (!element.date) {
		element.date = moment().format();
	}
	var mst = fs.readFileSync(path.join(__dirname, '../templates-'+base+'/data-'+element.type+'.json'))
	var resource = mustache.render(mst.toString(), element);
	return resource;
}

/**
Returns resources for all data elements found in the input array.
*/
function resourcesForData(sssid, data) {
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
			elem.sssid = sssid;
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

