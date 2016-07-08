var express = require('express');
var router = express.Router();
var service = require('../services/patients');
var config = require('../utils.js');


router.get('/api/:page/:perpage', function(req, res, next) {
    var sess = req.session;
    if (sess.token) {
        var opt = {
            token: sess.token,
            sess: sess,
            page: req.params.page,
            perpage: req.params.perpage,
            status: req.query.status,
            res: res,
        };
        service.getPatients(opt, function(data, opt) {
            if (data.body) {
                opt.res.json({data: data.body});
            }
            else {
                if (data.statusCode == 401) {
                    opt.sess.destroy(function (err) {
                        if (err) {
                            console.error("Failed to destroy session", err);
                        }
                    });
                }
                opt.res.json({
                    error: responseError(data.error || "error getting patients", data.statusCode),
                });
            }
        });
    }
    else {
        res.status(401).json({
            error: {status: 401},
        });
    }
});


/**
 *  GET single patient. 
 */
router.get('/:id', function(req, res, next) {
    var sess = req.session;
    var token = sess.token;
    if (sess.token) {
        var opt = {
            token: token,
            patientId: req.params.id,
            sess: sess,
            res: res,
        };
        var callback = function (data, opt) {
            if (data.body) {
                opt.res.render('patient', {
                    patientId: opt.patientId,
                    patient: data.body,
                });
            }
            else if (data.statusCode == 401) {
                forceLogin(opt.sess, opt.res, '/patients/'+req.params.id);
            }
            else {
                var err = data.error || "Error retrieving patient";
                opt.res.render('error', {
                    errorMessage: err,
                    status: data.statusCode,
                    destination: '/patients',
                });
            }
        };
        
        // we use "0" to indicate that we want to create a new patient
        if (req.params.id > 0) {
            service.getPatient(opt, callback);
        }
        else {
            callback({body: {}}, opt);
        }
    }
    else {
        res.redirect('/login?dest=/patients/'+req.params.id);
    }
});



/**
 *  Update patient
 */
router.post('/:id', function(req, res, next) {
    if (req.session.token) {
        var patient = {
            sssid: req.body.sssid,
            name: req.body.name,
            email: req.body.email,
        };
        var opt = {
            token: req.session.token,
            patientId: req.params.id,
            sess: req.session,
            res: res,
        };
        var callback = function(data, opt) {
            console.log('routes/patients/(update|new)Patient:', data);
            if (data.body) {
                opt.res.render('msg', {
                    "message": (opt.patientId == 0) ? "Subject Created" : "Data Updated",
                    "okref": "/patients"
                })
            }
            else if (data.statusCode == 401) {
                forceLogin(opt.sess, opt.res, '/patients/'+opt.patientId);
            }
            else {    // Validation problem, render what we had plus an error message
                opt.res.render('patient', {
                    patientId: opt.patientId,
                    patient: patient,
                    errorMessage: data.error || "Failed to store data, please try again",
                });
            }
        };
        
        // again, patient id of "0" means new patient
        if (opt.patientId > 0) {
            service.updatePatient(opt, patient, callback);
        }
        else {
            service.newPatient(opt, patient, callback);
        }
    }
    else {
        res.redirect('/login?dest=/patients/'+req.params.id);
    }
});


/**
 *  GET home page - redirect to 'patients'
 */
router.get('/', function(req, res, next) {
    if (req.session.token) {
        res.render('patients');
    }
    else {
        res.redirect('/login?dest=/patients');
    }
});


// MARK: - Utility Functions

function forceLogin(session, response, destination) {
    session.destroy(function (err) {
        if (err) {
            console.warn(err);
        }
        response.redirect('/login' + (destination ? '?dest='+destination : ''));
    });
}

function responseError(errorMessage, statusCode) {
    return {
        "status": statusCode,
        "message": errorMessage,
    }
}

module.exports = router;
