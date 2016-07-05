

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
    if (typeof opt.status != 'undefined') {
        fullEndPoint = fullEndPoint + '&status=' + opt.status;
    }
    var options = setBaseOptions(opt, fullEndPoint, 'GET');
    
    request(options, function (error, response, body) {
        var data = {
            statusCode: response.statusCode,
        };
        if (response.statusCode < 400) {
            var res = JSON.parse(body);
            var patients = res.data || res.patients;
            for (var i = 0; i < patients.length; i++) {
                setPatientStatusString(patients[i]);
                formatPatientDates(patients[i]);
            }
            data.body = patients;
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
    var options = setBaseOptions(opt, config.patient.endpoint + '/' + patient.patient.id, 'PUT');
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
            'Authorization': config.patients.token_type + ' ' + opt.token,
        }
    }
    return options;
}

function setPatientStatusString(patient) {
    if (!patient.status) {
        patient.status = 0;
    }
    if (1 == patient.status) {
        patient.human_status = "Invited";
    }
    else if (2 == patient.status) {
        patient.human_status = "Enrolled";
    }
    else if (3 == patient.status) {
        patient.human_status = "Withdrawn";
    }
    else {
        patient.human_status = "Pending";
    }
}

function formatPatientDates(patient) {
    if (patient.created) {
        patient.createdDate = niceDate(patient.created);
    }
    if (patient.changed) {
        patient.changedDate = niceDate(patient.changed);
    }
}

function niceDate(epoch) {
    var date = new Date(epoch*1000);
    var today = new Date();
    var time = date.getHours() + ':' + date.getMinutes();
    if (date.setHours(0,0,0,0) == today.setHours(0,0,0,0)) {
        return "Today, " + time;
    }
    return date.toLocaleDateString() + ', ' + time
}


/*********************
 Testing purposes only
 ********************/

if (app.get('env') === 'testDISABLED') {
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
