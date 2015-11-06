var express = require('express');
var router = express.Router();
var service = require('../services/patients');

/* GET for updating patient. */
router.get('/:id', function(req, res, next) {
    var sess=req.session;
    if (sess.username) {
        var token = sess.token;
        var patientId = req.params.id;

        var opt = {
            "token": token,
            "patientId": patientId,
            "sess": sess,
            "res": res
        };
        service.getPatient(opt, function (data, opt) {
            if (data.statusCode >= 400) {
                var err = '';
                if (data.error != null) {
                    err = data.error.message
                } else {
                    err = "HTTP Error getting patient"
                }
                var x = {
                    message: err,
                    error: {
                        "status": data.statusCode,
                        "stack": err
                    }
                };
                opt.res.render('error', x);
            } else {
                opt.res.render('subject', data.body);
            }
        });
    } else {
        res.redirect('/login');
    }
});

/* GET for new patient patient. */
router.get('/', function(req, res, next) {
    var sess=req.session;
    if (sess.username) {
        res.render('subjectNew');
    } else {
        res.redirect('/login');
    }
});

/* New & Update patient */
router.post('/', function(req, res, next) {
    var sess=req.session;
    if (sess.username) {
        if (req.body.id) {
            // This is a post with a new patient
            updatePatient(req, res);
        } else {
            // Update patient info
            newPatient(req, res);
        }

    } else {
        res.redirect('/login');
    }
});

function updatePatient(req,res) {
    var sess=req.session;
    var patient = {
        "patient": {
            "sssid": req.body.sssid,
            "email": req.body.email,
            "id": req.body.id
        }
    };
    var opt = {
        "token": sess.token,
        "sess": sess,
        "res": res
    };
    service.updatePatient(opt, patient, function (data, patient, opt) {
        if (data.statusCode == 403) {
            /* Valudation problem. So, we render the same that we had, showing an error message */
            opt.res.render('subject', {
                "patient": patient.patient,
                "errMessage": data.body.error
            });
        }

        else if (data.statusCode >= 400) {
            opt.res.render('subject', {
                "patient": patient.patient,
                "errMessage": data.statusCode
            });
        } else {
            opt.res.render('msg', {
                "message": "Patient updated succesfully",
                "okref:": "/subjects"
            })
        }
    });
}

function newPatient(req,res) {
    var sess=req.session;
    var patient = {
        "patient": {
            "sssid": req.body.sssid,
            "email": req.body.email
        }
    };
    var opt = {
        "token": sess.token,
        "sess":sess,
        "res": res
    };
    service.updatePatient(opt, patient, function (data, patient, opt) {
        if (data.statusCode == 403) {
            /* Valudation problem. So, we render the same that we had, showing an error message */
            opt.res.render('subjectNew', {
                "patient": patient.patient,
                "errMessage": data.body.error
            });
        }

        else if (data.statusCode >= 400) {
            opt.res.render('subject', {
                "patient": patient.patient,
                "errMessage": data.statusCode
            });
        } else {
            opt.res.render('msg', {
                "message": "Patient created succesfully",
                "okref:": "/subjects"
            })
        }
    });
}

module.exports = router;