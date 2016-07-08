

/*
API wrapper to get enrolled patients
 */
var express = require('express');
var request = require('request');
var async = require('async');
var moment = require('moment');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();

exports.getPatients = function(opt, func) {
    var patientId = opt.patientId;
    var fullEndPoint = config.patients.endpoint + '?page='+opt.page+'&perpage='+opt.perpage;
    if (typeof opt.status != 'undefined') {
        fullEndPoint = fullEndPoint + '&status=' + opt.status;
    }
    var options = setBaseOptions(opt, fullEndPoint, 'GET');
    
    request(options, function(error, response, body) {
        var data = dataOnJSONResponse(error, response, body, function(parsed) {
            var patients = parsed.data || parsed.patients;
            for (var i = 0; i < patients.length; i++) {
                manipulatePatientData(patients[i]);
            }
            return patients;
        });
        func(data, opt);
    });
}

exports.getPatient = function(opt, func) {
    var options = setBaseOptions(opt, config.patients.endpoint+'/'+opt.patientId, 'GET');
    request(options, function(error, response, body) {
        var data = dataOnJSONResponse(error, response, body, function(parsed) {
            var patient = parsed.data || parsed.patient;
            manipulatePatientData(patient);
            return patient;
        });
        func(data, opt);
    });
}

exports.newPatient = function(opt, patient, func) {
    var options = setBaseOptions(opt, config.patients.endpoint+'/', 'POST');
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(patient);
    //console.log('-->', options.body);
    
    request(options, function(error, response, body) {
        console.log('services/patients/newPatient:', body);
        var data = dataOnJSONResponse(error, response, body);
        func(data, opt);
    });
}

exports.updatePatient = function(opt, patient, func) {
    var options = setBaseOptions(opt, config.patients.endpoint+'/'+opt.patientId, 'PUT');
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(patient);
    
    request(options, function(error, response, body) {
        //console.log('services/patients/updatePatient:', body);
        var data = dataOnJSONResponse(error, response, body);
        func(data, opt);
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

function dataOnJSONResponse(error, response, body, manipulateFuncOnSuccess) {
    var data = {
        statusCode: response.statusCode,
    };
    var parsed = body ? JSON.parse(body) : {};
    if (response.statusCode < 400) {
        data.body = manipulateFuncOnSuccess ? manipulateFuncOnSuccess(parsed) : parsed;
    }
    else {
        data.error = (parsed.error && parsed.error.message) ? parsed.error.message : error;
    }
    return data;
}

function manipulatePatientData(patient) {
    setPatientStatusString(patient);
    formatPatientDates(patient);
}

function setPatientStatusString(patient) {
    if (undefined === patient.status) {
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
        patient.createdDate = moment(patient.created * 1000).calendar();
    }
    if (patient.changed) {
        patient.changedDate = moment(patient.changed * 1000).calendar();
    }
}


/*********************
 Testing purposes only
 ********************/

if (app.get('env') === 'testDISABLED') {
    var exports = module.exports = {};
    exports.getPatients = function(opt, func) {
        var patients = require('./testPatients.json').patients;
        for (var i = 0; i < patients.length; i++) {
            manipulatePatientData(patients[i]);
        }
        var data = {
            statusCode: 200,
            body: patients,
        };
        func(data, opt);
    }

    exports.getPatient = function(opt, func) {
        var testPatient = require('./testPatient.json');
        var data = {
            statusCode: 200,
            body: testPatient,
        };
        func(data, opt);
    }

    exports.newPatient = function(opt, patient, func) {
        var data = {
            statusCode: 201,
        };
        func(data, patient, opt);
    }

    exports.updatePatient = function(opt, patient, func) {
        var data = {
            statusCode: 201,
        };
        func(data, patient, opt);
    }
}
