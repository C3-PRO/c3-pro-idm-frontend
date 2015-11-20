var express = require('express');
var router = express.Router();
var service = require('../services/mail');
var servicePat = require('../services/patients');

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
        service.mail(opt, function (data, opt) {
            if (data.statusCode >= 400) {
                var err = '';
                if (data.error != null) {
                    err = data.error.message
                } else {
                    err = "HTTP Error getting patient"
                }
                opt.res.render('subjects', {
                    "errMessage": err
                });
            } else {
                opt.res.render('subjects', {
                    "okMessage": "Invitation sent successfully"
                });
            }
        });
    } else {
        res.redirect('/login');
    }
});

module.exports = router;