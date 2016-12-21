var express = require('express');
var router = express.Router();
var service = require('../services/subjects');
var config = require('../utils.js');
var isodate = require('isodate');


router.get('/api/:page/:perpage/:ordercol/:orderdir', function(req, res, next) {
    var sess = req.session;
    if (sess.token) {
        var opt = req.params;
        opt.token = sess.token;
        opt.sess = sess;
        opt.status = req.query.status;
        opt.res = res;
        
        service.getSubjects(opt, function(data, opt) {
            if (data.data) {
                opt.res.json(data);
            }
            else {
                if (data.statusCode == 401) {
                    opt.sess.destroy(function (err) {
                        if (err) {
                            console.error("Failed to destroy session", err);
                        }
                    });
                }
                opt.res.json(data);
            }
        });
    }
    else {
        res.status(401).json({
            errorMessage: "Unauthorized",
            statusCode: 401,
        });
    }
});


/**
 *  GET single subject. 
 */
router.get('/:id', function(req, res, next) {
    var sess = req.session;
    var token = sess.token;
    if (sess.token) {
        var opt = {
            token: token,
            sssid: req.params.id,
            sess: sess,
            res: res,
        };
        var callback = function(json, opt) {
            if (json.data) {
                opt.res.render('subject', {
                    sssid: opt.sssid,
                    subject: json.data,
                });
            }
            else if (json.statusCode == 401) {
                forceLogin(opt.sess, opt.res, '/subjects/'+req.params.id);
            }
            else {
                opt.res.render('error', {
                    errorMessage: json.errorMessage || "Error retrieving subject",
                    statusCode: json.statusCode,
                    destination: '/subjects',
                });
            }
        };
        
        // we use "0" to indicate that we want to create a new subject
        if ('0' !== req.params.id) {
            service.getSubject(opt, callback);
        }
        else {
            callback({data: {}}, opt);
        }
    }
    else {
        res.redirect('/login?dest=/subjects/'+req.params.id);
    }
});



/**
 *  Update subject.
 */
router.post('/:id', function(req, res, next) {
    if (req.session.token) {
        var subject = {
            sssid: req.body.sssid,
            name: req.body.name,
            bday: req.body.bday,
            email: req.body.email,
        };
        var opt = {
            token: req.session.token,
            sssid: req.params.id,
            sess: req.session,
            res: res,
        };
        var callback = function(json, opt) {
            console.log('---- routes/subjects/(update|new)Subject:', json);
            if (json.data) {
                opt.res.render('msg', {
                    message: (opt.sssid == 0) ? "Subject Created" : "Data Updated",
                    okref: '/subjects'
                })
            }
            else if (json.statusCode == 401) {
                forceLogin(opt.sess, opt.res, '/subjects/'+opt.sssid);
            }
            else {    // Validation problem, render what we had plus an error message
                opt.res.render('subject', {
                    sssid: opt.sssid,
                    subject: subject,
                    errorMessage: json.errorMessage || "Failed to store data, please try again",
                });
            }
        };
        
        // again, subject id of "0" means new subject
        if (0 == opt.sssid || '0' == opt.sssid) {
            service.newSubject(opt, subject, callback);
        }
        else {
            service.updateSubject(opt, subject, callback);
        }
    }
    else {
        res.redirect('/login?dest=/subjects/'+req.params.id);
    }
});


/**
 *  Mark the subject consented as of right now (JSON response).
 */
router.get('/:id/didConsent', function(req, res, next) {
    var sess = req.session;
    var token = sess.token;
    if (sess.token) {
        var opt = {
            token: token,
            sssid: req.params.id,
            sess: sess,
            res: res,
        };
        service.markSubjectConsented(opt, function(data, opt) {
            opt.res.json(data);
        });
    }
    else {
        res.status(401).json({
            errorMessage: "Unauthorized",
            statusCode: 401,
        });
    }
})


/**
 *  GET one QR code for a subject; picks an existing one if it hasn't expired
 *  yet, if there is none creates a new one (JSON response).
 */
router.get('/:id/qrcode', function(req, res, next) {
    var sess = req.session;
    var token = sess.token;
    if (sess.token) {
        var opt = {
            token: token,
            sssid: req.params.id,
            sess: sess,
            res: res,
        };
        service.getSubjectQRCode(opt, function(json, opt) {
            opt.res.json(json);
        });
    }
    else {
        res.status(401).json({
            errorMessage: "Unauthorized",
            statusCode: 401,
        });
    }
});


/**
 *  GET home page - redirect to 'subjects'
 */
router.get('/', function(req, res, next) {
    if (req.session.token) {
        res.render('subjects');
    }
    else {
        res.redirect('/login?dest=/subjects');
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

module.exports = router;
