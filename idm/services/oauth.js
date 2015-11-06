/*
 API wrapper to get entolled patients
 */
var express = require('express');
var request = require('request');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();

exports.oauth = function (opt, func) {
    var options = setBaseOptions(opt, config.oauth.endpoint+"?grant_type=client_credentials", 'POST');
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        if (response.statusCode == 401) {
            res.render('login', {
                title: 'IDM',
                errMessage:"Wrong credentials. Please, try again."
            });
        } else if (response.statusCode >= 400) {
            res.render('login', {
                title: 'IDM',
                errMessage:"HTTP error code:" + response.statusCode
            });
        } else {
            func(opt.username, body.access_token, opt.sess);
        }
    });
}

function setBaseOptions(opt, endpoint, method) {
    var key = new Buffer(opt.key).toString('base64');
    var options = {
        uri: config.oauth.protocol + "://" + config.oauth.host + ":" + config.oauth.port + endpoint,
        method : method,
        headers: {
            'Authentication': 'Basic ' + key
        }
    }
    return options;
}

/* For testing purposes only */

if (app.get('env') === 'test') {
    exports.oauth = function (opt, func) {
        func(opt.username, "aVeryRandomTestToken", opt.sess);
    }
}