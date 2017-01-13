var express = require('express');
var request = require('request');
var config = require('../utils.js');
var QRCode = require('qrcode');
var exports = module.exports = {};
var app = express();


// verify links endpoint config
if (!config || !config.links || !config.links.host || !config.links.endpoint) {
    throw Error('config.links is incomplete, need at least `host` and `endpoint`');
}


exports.getJWTForLink = function(opt, func) {
	if (!('jti' in opt) || !opt.jti) {
		var data = {errorMessage: "No `jti` provided on `opt` parameter passed into `getJWTForLink()`"};
		func(data, opt);
		return;
	}
    var options = setBaseOptions(opt, config.links.endpoint+'/'+opt.jti+'/jwt', 'GET');
    options.headers['Accept'] = "application/jwt";
    request(options, function(error, response, body) {
        //console.log('services/links/getJWTForLink:', body);
        if (response.statusCode < 400) {
            func({'data': body, 'statusCode': response.statusCode}, opt);
        }
        else {
        	var json = config.dataOrErrorFromJSONResponse(error, response, body);
        	func(json, opt);
        }
    });
};

exports.getQRCode = function(opt, func) {
	exports.getJWTForLink(opt, function(json, opt) {
		if (json.data) {
			qrCodeForJWT(json.data, function(path, error) {
                json.data = path;
                if (error) {
                    json.errorMessage = error;
                }
                func(json, opt);
            });
		}
        else {
    		func(json, opt);
        }
	});
};

function qrCodeForJWT(jwt, callback) {
    var path = 'tmp/qrcode_'+((new Date()).getTime())+'.png';
    QRCode.save('public/'+path, jwt, function (error, written) {
        if (error) {
            console.error('qrCodeForJWT() error:', error);
            callback(null, "Failed to write QR code image");
        }
        else {
            callback(path, null);
        }
    });
}

function setBaseOptions(opt, endpoint, method) {
    var options = {
        uri: config.links.protocol + '://' + config.links.host + ':' + config.links.port + endpoint,
        method : method,
        headers: {
            'Authorization': (config.links.token_type || 'Bearer') + ' ' + opt.token,
        }
    }
    return options;
}

