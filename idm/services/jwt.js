/*
 API wrapper to get enrolled subjects
 */
var express = require('express');
var request = require('request');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();

exports.jwt = function(opt, func) {
    var support = config.app && config.app.support ? (': ' + config.app.support) : '';
    var login_title = config.app ? config.app.login_title : null;
    if (!('jwt' in config) || !config.jwt.host || !config.jwt.endpoint) {
        opt.res.render('login', {
            title: login_title,
            username: opt.username,
            errmessage: "The JWT login process has not been configured appropriately, please contact an admin" + support + '.',
        });
        return;
    }
    var options = {
        uri: (config.jwt.protocol || 'https') + "://" + config.jwt.host + (config.jwt.port ? ':' + config.jwt.port : '') + config.jwt.endpoint,
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
                opt.res.render('login', {
                    title: login_title,
                    username: opt.username,
                    errmessage: "Wrong credentials. Please, try again."
                });
                return;
            }
            if (response.statusCode >= 400) {
                opt.res.render('login', {
                    title: login_title,
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
        opt.res.render('login', {
            title: login_title,
            username: opt.username,
            errmessage: "No response from authorization server, please contact an admin" + support + '.',
        });
    });
}

