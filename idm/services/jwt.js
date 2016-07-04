/*
 API wrapper to get enrolled patients
 */
var express = require('express');
var request = require('request');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();

exports.jwt = function(opt, func) {
    var options = setBaseOptions(opt, config.jwt.endpoint, 'POST');
    console.log('JWT request:  ', options.uri);
    request(options, function(error, response, body) {
        console.log('JWT response: ', response ? response.statusCode : null);
        if (response) {
            if (response.statusCode == 401) {
                opt.res.render('login', {
                    title: 'IDM',
                    username: opt.username,
                    errmessage: "Wrong credentials. Please, try again."
                });
                return;
            }
            if (response.statusCode >= 400) {
                opt.res.render('login', {
                    title: 'IDM',
                    username: opt.username,
                    errmessage: "HTTP error code:" + response.statusCode
                });
                return;
            }
            if (body && 'access_token' in body) {
                var token = body.access_token;
                func(opt.username, token, opt.sess);
                return;
            }
        }
        var support = 'support' in config.app ? ('at ' + config.app.support) : null;
        opt.res.render('login', {
            title: 'IDM',
            username: opt.username,
            errmessage: "No response from authorization server, please contact an admin " + support + '.',
        });
    });
}

function setBaseOptions(opt, endpoint, method) {
    var options = {
        uri: config.jwt.protocol + "://" + config.jwt.host + ":" + config.jwt.port + endpoint,
        method: method,
        json: true,
        body: {
            username: opt.username,
            password: opt.password,
        },
    }
    return options;
}

