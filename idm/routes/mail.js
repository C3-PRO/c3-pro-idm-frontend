var express = require('express');
var router = express.Router();
var service = require('../services/mail');
var servicePat = require('../services/subjects');

router.get('/:id', function(req, res, next) {
    var sess=req.session;
    if (sess.username) {
        var token = sess.token;
        var sssid = req.params.id;

        var opt = {
            "token": token,
            "sssid": sssid,
            "sess": sess,
            "res": res
        };
        service.mail(opt, function (data, opt) {
            if (data.statusCode >= 400) {
                opt.error = data.error;

                servicePat.getSubjects(opt, function(data, opt){
                    var errmsg = "";
                    if (opt.error!=null)  {
                        errmsg = ": " + opt.error;
                    }
                    if (data.statusCode >= 400) {
                        var err = 'Invitation Mail has NOT been sent successfully' + errmsg + ".";
                        if (data.error != null) {
                            err = err + " Moreover, we got the following error when retrieving " +
                                "the list of subjects: " + data.error.message;
                        } else {
                            err = "Moreover, we got an unspecified HTTP error getting subjects list"
                        }
                        var x = {
                            message:err,
                            error: {
                                "status": data.statusCode,
                                "stack": err
                            }
                        };
                        opt.res.render('error', x);
                    } else {
                        opt.res.render('subjects', {
                            "subjects": JSON.parse(data.body).subjects,
                            "errMessage": "Error sending the Invitation mail" + errmsg
                        });
                    }
                });
            } else {
                servicePat.getSubjects(opt, function(data, opt){
                    if (data.statusCode >= 400) {
                        var err = 'Mail has been sent successfully.';
                        if (data.error != null) {
                            err = err + " However, we got the following error when retrieving " +
                                "the list of subjects: " + data.error.message;
                        } else {
                            err = "However, we got an unspecified HTTP error getting subjects list"
                        }
                        var x = {
                            message:err,
                            error: {
                                "status": data.statusCode,
                                "stack": err
                            }
                        };
                        opt.res.render('error', x);
                    } else {
                        opt.res.render('subjects', {
                            "subjects": JSON.parse(data.body).subjects,
                            "okMessage": "Invitation mail sent successfully"
                        });
                    }
                });
            }
        });
    } else {
        res.redirect('/login');
    }
});

module.exports = router;