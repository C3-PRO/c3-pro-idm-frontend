var express = require('express');
var router = express.Router();
var service = require('../services/patients');
/* GET home page. */
router.get('/', function(req, res, next) {
    var sess=req.session;
    if (sess.username) {
        var key = sess.username + ":" + sess.password;
        var opt = {"key":key};
        var data = service.getPatients(opt);
        if (data.statusCode === 401) {
            req.session.destroy(function(err){
                if(err) {
                    console.log(err);
                } else {
                    res.redirect('/');
                }
            });
        } else if (data.statusCode >= 400) {
            var data = {
                message:data.error.message,
                error: error
            };
            res.render('error', data);
        } else {
            res.render('subjects', data.body);
        }

    } else {
        res.redirect('/login');
    }
});

module.exports = router;