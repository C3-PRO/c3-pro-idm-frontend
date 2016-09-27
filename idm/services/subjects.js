

/*
API wrapper to get enrolled subjects
 */
var express = require('express');
var request = require('request');
var async = require('async');
var moment = require('moment');
var config = require('../utils.js');
var exports = module.exports = {};
var app = express();

exports.getSubjects = function(opt, func) {
    var sssid = opt.sssid;
    var fullEndPoint = config.subjects.endpoint + '?page='+opt.page+'&perpage='+opt.perpage;
    if (typeof opt.status != 'undefined') {
        fullEndPoint = fullEndPoint + '&status=' + opt.status;
    }
    var options = setBaseOptions(opt, fullEndPoint, 'GET');
    
    request(options, function(error, response, body) {
        var data = dataOnJSONResponse(error, response, body, function(parsed) {
            var subjects = parsed.data || parsed.subjects;
            for (var i = 0; i < subjects.length; i++) {
                manipulateSubjectData(subjects[i]);
            }
            return subjects;
        });
        func(data, opt);
    });
}

exports.getSubject = function(opt, func) {
    var options = setBaseOptions(opt, config.subjects.endpoint+'/'+opt.sssid, 'GET');
    request(options, function(error, response, body) {
        var data = dataOnJSONResponse(error, response, body, function(parsed) {
            var subject = parsed.data || parsed.subject;
            manipulateSubjectData(subject);
            return subject;
        });
        func(data, opt);
    });
}

exports.newSubject = function(opt, subject, func) {
    var options = setBaseOptions(opt, config.subjects.endpoint, 'POST');
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(subject);
    //console.log('-->', options.body);
    
    request(options, function(error, response, body) {
        console.log('services/subjects/newSubject:', body);
        var data = dataOnJSONResponse(error, response, body);
        func(data, opt);
    });
}

exports.updateSubject = function(opt, subject, func) {
    var options = setBaseOptions(opt, config.subjects.endpoint+'/'+opt.sssid, 'PUT');
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(subject);
    
    request(options, function(error, response, body) {
        //console.log('services/subjects/updateSubject:', body);
        var data = dataOnJSONResponse(error, response, body);
        func(data, opt);
    });

}

function setBaseOptions(opt, endpoint, method) {
    var options = {
        uri: config.subjects.protocol + "://" + config.subjects.host + ":" + config.subjects.port + endpoint,
        method : method,
        headers: {
            'Authorization': config.subjects.token_type + ' ' + opt.token,
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

function manipulateSubjectData(subject) {
    setSubjectStatusString(subject);
    formatSubjectDates(subject);
}

function setSubjectStatusString(subject) {
    if (undefined === subject.status) {
        subject.status = 0;
    }
    if (1 == subject.status) {
        subject.human_status = "Invited";
    }
    else if (2 == subject.status) {
        subject.human_status = "Enrolled";
    }
    else if (3 == subject.status) {
        subject.human_status = "Withdrawn";
    }
    else {
        subject.human_status = "Pending";
    }
}

function formatSubjectDates(subject) {
    if (subject.created) {
        subject.createdDate = moment(subject.created * 1000).calendar();
    }
    if (subject.changed) {
        subject.changedDate = moment(subject.changed * 1000).calendar();
    }
}


/*********************
 Testing purposes only
 ********************/

if (app.get('env') === 'testDISABLED') {
    var exports = module.exports = {};
    exports.getSubjects = function(opt, func) {
        var subjects = require('./testSubjects.json').subjects;
        for (var i = 0; i < subjects.length; i++) {
            manipulateSubjectData(subjects[i]);
        }
        var data = {
            statusCode: 200,
            body: subjects,
        };
        func(data, opt);
    }

    exports.getSubject = function(opt, func) {
        var testSubject = require('./testSubject.json');
        var data = {
            statusCode: 200,
            body: testSubject,
        };
        func(data, opt);
    }

    exports.newSubject = function(opt, subject, func) {
        var data = {
            statusCode: 201,
        };
        func(data, subject, opt);
    }

    exports.updateSubject = function(opt, subject, func) {
        var data = {
            statusCode: 201,
        };
        func(data, subject, opt);
    }
}
