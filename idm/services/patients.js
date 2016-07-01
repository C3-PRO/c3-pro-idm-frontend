

/*
API wrapper to get enrolled patients
 */
var express = require('express');
var request = require('request');
var async = require('async');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();

exports.getPatients = function (opt, func) {
    var patientId = opt.patientId;
    var fullEndPoint = config.patients.endpoint + '?page='+opt.page+'&perpage='+opt.perpage;
    if (typeof opt.state != 'undefined') {
        fullEndPoint = fullEndPoint + '&state=' + opt.state;
    }
    var options = setBaseOptions(opt, fullEndPoint, 'GET');

    request(options, function (error, response, body) {
        var data = {
            statusCode: response.statusCode,
        };
        if (response.statusCode < 400) {
            var patients = JSON.parse(data.body);
            // TODO: prepare data for mustache
            data.body = patients.patients;
        }
        else {
            data.error = error;
        }
        func(data, opt);
    });
}

exports.getPatient = function (opt, func) {
    var patientId = opt.patientId;
    var options = setBaseOptions(opt, config.patients.endpoint+'/'+patientId, 'GET');

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

exports.newPatient = function (opt, patient, func) {
    var options = setBaseOptions(opt, config.patient.endpoint, 'POST');
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(patient);
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        data = {
            statusCode: parseInt(response.statusCode,10),
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
            func(data,patient, opt);
        }
    });
}

exports.updatePatient = function (opt, patient, func) {
    var options = setBaseOptions(opt, config.patient.endpoint+"/"+patient.patient.id, 'PUT');
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(patient);
    request(options, function (error, response, body) {
        console.log(response.statusCode)
        data = {
            statusCode: parseInt(response.statusCode, 10),
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
            func(data,patient, opt);
        }
    });

}

function setBaseOptions(opt, endpoint, method) {
    var options = {
        uri: config.patients.protocol + "://" + config.patients.host + ":" + config.patients.port + endpoint,
        method : method,
        headers: {
            'Authorization': 'Bearer ' + opt.token
        }
    }
    return options;
}


/*********************
 Testing purposes only
 ********************/

if (app.get('env') === 'test') {
    var exports = module.exports = {};
    exports.getPatients = function (opt, func) {
        var testPatients = require('./testPatients.json');
        var data = {
            statusCode: 200,
            body: testPatients.patients,
        };
        func(data, opt);
    }

    exports.getPatient = function (opt, func) {
        var testPatient = require('./testPatient.json');
        var data = {
            statusCode: 200,
            body: testPatient,
        };
        func(data, opt);
    }

    exports.newPatient = function (opt, patient, func) {
        var data = {
            statusCode: 201,
        };
        func(data, patient, opt);
    }

    exports.updatePatient = function (opt, patient, func) {
        var data = {
            statusCode: 201,
        };
        func(data, patient, opt);
    }
}
