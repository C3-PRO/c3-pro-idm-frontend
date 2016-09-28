var express = require('express');
var request = require('request');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();



exports.getJWTForLink = function(opt, func) {
	if (!('jti' in opt)) {
		var data = {error: "No `jti` provided on `opt` parameter passed into `getQRCode()`"};
		func(data, opt);
		return;
	}
    var options = setBaseOptions(opt, config.links.endpoint+'/'+opt.jti+'/jwt', 'GET');
    options.headers['Accept'] = "application/jwt";
    request(options, function(error, response, body) {
    	var data = config.dataBodyOrErrorFromJSONResponse(error, response, null);
    	if (!('error' in data)) {
    		data.body = body;
        }
    	func(data, opt);
    });
};

exports.getQRCode = function(opt, func) {
	exports.getJWTForLink(opt, function(data, opt) {
		if ('body' in data) {
			data.body = qrCodeForJWT(data.body);
		}
		func(data, opt);
	});
};

function qrCodeForJWT(jwt) {
	// TODO: return actual QR-code, either temp image or base64'd data
	return 'img:'+jwt;
}

function setBaseOptions(opt, endpoint, method) {
    var options = {
        uri: config.links.protocol + '://' + config.links.host + ':' + config.links.port + endpoint,
        method : method,
        headers: {
            'Authorization': config.links.token_type + ' ' + opt.token,
        }
    }
    return options;
}

