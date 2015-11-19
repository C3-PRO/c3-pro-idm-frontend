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
                opt.res.render('subject', JSON.parse(data.body));
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
        if (req.body.idef) {
            // This is a post for an update
            updatePatient(req, res);
        } else {
            // This is a port for a new patient
            newPatient(req, res);
        }

    } else {
        res.redirect('/login');
    }
});

function updatePatient(req,res) {
    console.log("update:" + req.body.idef);
    var sess=req.session;
    var patient = {
        "patient": {
            "sssid": req.body.sssid,
            "email": req.body.email,
            "id": req.body.idef
        }
    };
    var opt = {
        "token": sess.token,
        "sess": sess,
        "res": res
    };
    service.updatePatient(opt, patient, function (data, patient, opt) {
        if (data.statusCode == 400) {
            /* Validation problem. So, we render the same that we had, showing an error message */
            var resp = JSON.parse( data.body );
            opt.res.render('subject', {
                "patient": patient.patient,
                "errMessage": resp.error
            });
        }

        else if (data.statusCode > 400) {
            opt.res.render('subject', {
                "patient": patient.patient,
                "errMessage": data.statusCode
            });
        } else {
            opt.res.render('msg', {
                "message": "Patient updated successfully",
                "okref": "/patients"
            })
        }
    });
}

function newPatient(req,res) {
    console.log("new");
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
    service.newPatient(opt, patient, function (data, patient, opt) {
        if (data.statusCode == 400) {
            /* Validation problem. So, we render the same that we had, showing an error message */
            var resp = JSON.parse( data.body );
            opt.res.render('subjectNew', {
                "patient": patient.patient,
                "errMessage": resp.error
            });
        }

        else if (data.statusCode > 400) {
            opt.res.render('subject', {
                "patient": patient.patient,
                "errMessage": data.statusCode
            });
        } else {
            opt.res.render('msg', {
                "message": "Patient created successfully",
                "okref": "/patients"
            })
        }
    });
}

module.exports = router;