var express = require('express');
var router = express.Router();
var service = require('../services/subjects');
var links_service = require('../services/links');
var config = require('../utils.js');
var isodate = require('isodate');


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
        service.getSubjects(opt, function(data, opt) {
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
                    error: responseError(data.error || "error getting subjects", data.statusCode),
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
        var callback = function(data, opt) {
            if (data.body) {
                opt.res.render('subject', {
                    sssid: opt.sssid,
                    subject: data.body,
                });
            }
            else if (data.statusCode == 401) {
                forceLogin(opt.sess, opt.res, '/subjects/'+req.params.id);
            }
            else {
                var err = data.error || "Error retrieving subject";
                opt.res.render('error', {
                    errorMessage: err,
                    status: data.statusCode,
                    destination: '/subjects',
                });
            }
        };
        
        // we use "0" to indicate that we want to create a new subject
        if (0 !== req.params.id) {
            service.getSubject(opt, callback);
        }
        else {
            callback({body: {}}, opt);
        }
    }
    else {
        res.redirect('/login?dest=/subjects/'+req.params.id);
    }
});



/**
 *  Update subject
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
        var callback = function(data, opt) {
            //console.log('---- routes/subjects/(update|new)Subject:', data);
            if (data.body) {
                opt.res.render('msg', {
                    message: (opt.sssid == 0) ? "Subject Created" : "Data Updated",
                    okref: '/subjects'
                })
            }
            else if (data.statusCode == 401) {
                forceLogin(opt.sess, opt.res, '/subjects/'+opt.sssid);
            }
            else {    // Validation problem, render what we had plus an error message
                opt.res.render('subject', {
                    sssid: opt.sssid,
                    subject: subject,
                    errorMessage: data.error || "Failed to store data, please try again",
                });
            }
        };
        
        // again, subject id of "0" means new subject
        if (opt.sssid > 0) {
            service.updateSubject(opt, subject, callback);
        }
        else {
            service.newSubject(opt, subject, callback);
        }
    }
    else {
        res.redirect('/login?dest=/subjects/'+req.params.id);
    }
});


/**
 *  GET one QR code for a subject; picks an existing one if it hasn't expired
 *  yet, if there is none creates a new one.
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
        
        // get all Links for this subject and pick the first without `exp` expiration date, if any
        service.getSubjectLinks(opt, function(data, opt) {
            if (data.body && 'data' in data.body) {
                var useLink = null;
                var now = Date();
                for (var i = 0; i < data.body.data.length; i++) {
                    var exp = data.body.data[i].exp ? isodate(data.body.data[i].exp) : null;
                    if (!exp || exp > now) {
                        useLink = data.body.data[i];
                        break;
                    }
                }
                var callback = function(opt, jti) {
                    opt.jti = jti;
                    links_service.getQRCode(opt, function(data, opt) {
                        console.log('---- links_service.getQRCode()', data);
                        opt.res.json(data);
                    });
                };
                
                // request QR code for existing link or create a new one
                if (useLink) {
                    console.log('---- reusing QR code for', useLink);
                    callback(opt, useLink._id);
                }
                else {
                    console.log('---- creating new QR code')
                    service.createSubjectLink(opt, function(data, opt) {
                        console.log('---- service.createSubjectQRCode()', data);
                        // TODO: check for error
                        callback(opt, data.body._id);
                    });
                }
            }
            else {
                var err = data.error || "Error retrieving subject";
                opt.res.json({
                    errorMessage: err,
                    status: data.statusCode,
                    destination: '/subjects',
                });
            }
        });
    }
    else {
        res.status(401).json({
            errorMessage: "Unauthorized",
            status: 401,
            destination: '/subjects',
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

function responseError(errorMessage, statusCode) {
    return {
        "status": statusCode,
        "message": errorMessage,
    }
}

module.exports = router;
