/*
 API wrapper to get entolled patients
 */
var express = require('express');
var request = require('request');
var async = require('async');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();



exports.mail = function (opt, func) {
    var options = setBaseOptions(opt, config.mail.endpoint + "/" + opt.patientId, 'POST');
    options.headers["Content-Type"] = "application/json";
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        data = {
            statusCode: response.statusCode,
            body: body,
            error: error
        };
        if (data.statusCode == 401) {
            opt.sess.destroy(function (err) {
                if (err) {
                    console.log(err);
                } else {
                    opt.res.redirect('/');
                }
            });
        } else {
            func(data, opt);
        }
    });
}

function setBaseOptions(opt, endpoint, method) {
    var options = {
        uri: config.mail.protocol + "://" + config.mail.host + ":" + config.mail.port + endpoint,
        method : method,
        headers: {
            'Authorization': 'Bearer ' + opt.token
        }
    }
    return options;
}

// For testing purposes only
if (app.get('env') === 'test') {
    var exports = module.exports = {};
    exports.mail = function (opt, func) {
        var data = {
            statusCode: 200,
            body:'',
            error:''
        };
        func(data, opt);
    }
}