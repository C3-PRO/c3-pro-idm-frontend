

/*
API wrapper to get entolled patients
 */
var express = require('express');
var request = require('request');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();

exports.getPatients = function (opt) {
    var options = setBaseOptions(opt, config.patients.endpoint, 'GET');

    var ret = {};
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        ret.statusCode = response.statusCode;
        ret.body = body;
        ret.error = error;

    });
    return ret;
}

exports.newPatient = function (opt, patient) {
    var options = setBaseOptions(opt, config.patient.endpoint, 'POST');
    options.headers["Content-Type"] = "application/json";
    options.body = patient;
    var ret = {};
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        ret.statusCode = response.statusCode;
        ret.body = body;
        ret.error = error;

    });
    return ret;
}

exports.updatePatient = function (opt, patient) {
    var options = setBaseOptions(opt, config.patient.endpoint, 'PUT');
    options.headers["Content-Type"] = "application/json";
    options.body = patient;
    var ret = {};
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        ret.statusCode = response.statusCode;
        ret.body = body;
        ret.error = error;
    });
    return ret;
}

function setBaseOptions(opt, endpoint, method) {
    var key = new Buffer(opt.accessKey).toString('base64');
    var options = {
        uri: config.patients.protocol + "://" + config.patients.host + ":" + config.patients.port + endpoint,
        method : method,
        headers: {
            'Authentication': 'Basic ' + key ,
        }
    }
    return options;
}

// Testing purposes only

if (app.get('env') === 'test') {
    var exports = module.exports = {};
    exports.getPatients = function (opt) {
        var testPatients = require('./testPatients.json');
        var ret = {
            statusCode: 200,
            body:testPatients,
            error:''
        }
        return ret;
    }

    exports.newPatient = function (opt, patient) {
        var ret = {
            statusCode: 201
        }

        return ret;
    }

    exports.updatePatient = function (opt, patient) {
        var ret = {
            statusCode: 201
        }
        return ret;
    }
}
