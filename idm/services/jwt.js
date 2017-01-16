/*
 API wrapper to get enrolled subjects
 */
var express = require('express');
var request = require('request');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();


/**
Attempts to retrieve a token by querying a JWT endpoint.

The return function has 4 optional parameters, filled according to outcome:
- username
- token
- session
- error
*/
exports.jwt = function(opt, func) {
    var support = config.app && config.app.support ? (': ' + config.app.support) : '';
    if (!('jwt' in config) || !config.jwt.host || !config.jwt.endpoint) {
        func(opt.username, null, opt.sess, "The JWT login process has not been configured, please contact an admin" + support + '.');
        return;
    }
    var base = (config.jwt.protocol || 'https') + "://" + config.jwt.host + (config.jwt.port ? ':' + config.jwt.port : '');
    var options = {
        uri: base + config.jwt.endpoint,
        method: 'POST',
        json: true,
        body: {
            username: opt.username,
            password: opt.password,
        },
    }
    console.log('JWT request:  ', options.uri);
    request(options, function(error, response, body) {
        console.log('JWT response: ', response ? response.statusCode : null);
        if (response) {
            if (response.statusCode == 401) {
                func(opt.username, null, opt.sess, "Wrong credentials. Please, try again.");
                return;
            }
            if (response.statusCode >= 400) {
                func(opt.username, null, opt.sess, "HTTP error code:" + response.statusCode);
                return;
            }
            if (body && 'access_token' in body) {
                func(opt.username, body.access_token, opt.sess);
                return;
            }
        }
        func(opt.username, null, opt.sess, "No response from authorization server, please contact an admin" + support + '.');
    });
}

