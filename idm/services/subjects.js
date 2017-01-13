/*
API wrapper to get enrolled subjects
 */
var express = require('express');
var request = require('request');
var async = require('async');
var moment = require('moment');
var config = require('../utils.js');
var links_service = require('../services/links');
var exports = module.exports = {};
var app = express();


// verify subjects endpoint config
if (!config || !config.subjects || !config.subjects.host || !config.subjects.endpoint) {
    throw Error('config.subjects is incomplete, need at least `host` and `endpoint`');
}


exports.getSubjects = function(opt, func) {
    var sssid = opt.sssid;
    var fullEndPoint = config.subjects.endpoint + '?page='+opt.page+'&perpage='+opt.perpage+'&ordercol='+opt.ordercol+'&orderdir='+opt.orderdir;
    if (typeof opt.status != 'undefined') {
        fullEndPoint = fullEndPoint + '&status=' + opt.status;
    }
    var options = setBaseOptions(opt, fullEndPoint, 'GET');
    
    request(options, function(error, response, body) {
        var data = config.dataOrErrorFromJSONResponse(error, response, body, function(parsed) {
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
        var data = config.dataOrErrorFromJSONResponse(error, response, body, function(parsed) {
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
    
    request(options, function(error, response, body) {
        //console.log('services/subjects/newSubject:', body);
        var json = config.dataOrErrorFromJSONResponse(error, response, body);
        func(json, opt);
    });
}

exports.updateSubject = function(opt, subject, func) {
    var options = setBaseOptions(opt, config.subjects.endpoint+'/'+opt.sssid, 'PUT');
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(subject);
    
    request(options, function(error, response, body) {
        //console.log('services/subjects/updateSubject:', body);
        var json = config.dataOrErrorFromJSONResponse(error, response, body);
        func(json, opt);
    });
}

exports.markSubjectConsented = function(opt, func) {
    var options = setBaseOptions(opt, config.subjects.endpoint+'/'+opt.sssid+'/didConsent', 'PUT');
    options.headers["Content-Type"] = "application/json";
    
    request(options, function(error, response, body) {
        //console.log('services/subjects/markSubjectConsented:', body);
        var json = config.dataOrErrorFromJSONResponse(error, response, body);
        if ('data' in json && json.data) {
            manipulateSubjectData(json.data);
        }
        func(json, opt);
    });
}

exports.getSubjectLinks = function(opt, func) {
    var options = setBaseOptions(opt, config.subjects.endpoint+'/'+opt.sssid+'/links', 'GET');
    options.headers["Accept"] = "application/json";
    
    request(options, function(error, response, body) {
        console.log('services/subjects/getSubjectLinks:', body);
        var json = config.dataOrErrorFromJSONResponse(error, response, body);
        func(json, opt);
    });
}

exports.createSubjectLink = function(opt, func) {
    var options = setBaseOptions(opt, config.subjects.endpoint+'/'+opt.sssid+'/links', 'POST');
    options.headers["Accept"] = "application/json";
    
    request(options, function(error, response, body) {
        //console.log('services/subjects/createSubjectLink:', body);
        var json = config.dataOrErrorFromJSONResponse(error, response, body);
        func(json, opt);
    });
}

exports.getSubjectQRCode = function(opt, func) {
    
    // get all Links for this subject and pick the first without `exp` expiration date, if any
    exports.getSubjectLinks(opt, function(json, opt) {
        if (json.data) {
            var useLink = null;
            var now = Date();
            for (var i = 0; i < json.data.length; i++) {
                var exp = json.data[i].exp ? isodate(json.data[i].exp) : null;
                if (!exp || exp > now) {
                    useLink = json.data[i];
                    break;
                }
            }
            var callback = function(opt, jti) {
                opt.jti = jti;
                links_service.getQRCode(opt, function(sjson, opt) {
                    console.log('services/subjects/getSubjectQRCode()/links_service.getQRCode()', sjson);
                    opt.res.json(sjson);
                });
            };
            
            // request QR code for existing link or create a new one
            if (useLink) {
                console.log('services/subjects/getSubjectQRCode(): reusing QR code for', useLink);
                callback(opt, useLink._id);
            }
            else {
                console.log('services/subjects/getSubjectQRCode(): creating new QR code')
                exports.createSubjectLink(opt, function(cjson, opt) {
                    console.log('services/subjects/getSubjectQRCode().createSubjectLink()', cjson);
                    if (cjson.data) {
                        callback(opt, cjson.data._id);
                    }
                    else if (cjson.statusCode == 401) {
                        forceLogin(opt.sess, opt.res, '/subjects/'+opt.sssid);
                    }
                    else {
                        opt.res.json(cjson);
                    }
                });
            }
        }
        else {
            opt.res.json(json);
        }
    });
}


/****************
 Helper functions
 ***************/

function setBaseOptions(opt, endpoint, method) {
    var options = {
        uri: (config.subjects.protocol || 'https') + "://" + config.subjects.host + (config.subjects.port ? ':'+config.subjects.port  :'') + endpoint,
        method : method,
        headers: {
            'Authorization': config.subjects.token_type + ' ' + opt.token,
        }
    }
    return options;
}

function manipulateSubjectData(subject) {
    setSubjectStatusString(subject);
    formatSubjectDates(subject);
}

function setSubjectStatusString(subject) {
    if (subject.date_withdrawn) {
        subject.status = 3;
        subject.human_status = "Withdrawn";
    }
    else if (subject.date_enrolled) {
        subject.status = 2;
        subject.human_status = "Enrolled";
    }
    else if (subject.date_consented) {
        subject.status = 1;
        subject.human_status = "Consented";
    }
    else if (subject.date_invited) {
        subject.status = 1;
        subject.human_status = "Invited";
    }
    else {
        subject.status = 0;
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
    if (subject.date_invited) {
        subject.invitedDate = moment(subject.date_invited).calendar();
    }
    if (subject.date_consented) {
        subject.consentedDate = moment(subject.date_consented).calendar();
    }
    if (subject.date_enrolled) {
        subject.enrolledDate = moment(subject.date_enrolled).calendar();
    }
    if (subject.date_withdrawn) {
        subject.withdrawnDate = moment(subject.date_withdrawn).calendar();
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
