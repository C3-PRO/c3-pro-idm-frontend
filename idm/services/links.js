var request = require('request');
var config = require('../utils.js');
var QRCode = require('qrcode');
var exports = module.exports = {};


// verify service endpoint config
if (!config || !config.service || !config.service.host) {
    throw Error('config.service is incomplete, need at least `host`');
}


exports.getJWTForLink = function(opt, func) {
	if (!('jti' in opt) || !opt.jti) {
		var data = {errorMessage: "No `jti` provided on `opt` parameter passed into `getJWTForLink()`"};
		func(data, opt);
		return;
	}
    var options = setBaseOptions(opt, '/'+opt.jti+'/jwt', 'GET');
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

function setBaseOptions(opt, pathQuery, method) {
    var ep = (config.service.endpoint ? config.service.endpoint : '') + '/link' + (pathQuery ? pathQuery : '');
    var options = {
        uri: (config.service.protocol || 'https') + "://" + config.service.host + (config.service.port ? ':'+config.service.port  :'') + ep,
        method : method,
        headers: {
            'Authorization': (config.service.token_type || 'Bearer') + ' ' + opt.token,
        }
    }
    return options;
}

