var express = require('express');
var router = express.Router();
var service = require('../services/patients');
var config = require('../utils.js');
/* GET home page. */

router.get('/:page/:perpage', function(req, res, next) {
    var sess=req.session;
    console.log(sess.token);
    req.query.state
    if (sess.username) {
        var opt = {
            "token": sess.token,
            "sess": sess,
            "page": req.params.page,
            "perpage": req.params.perpage,
            "state": req.query.state,
            "res": res
        };
        service.getPatients(opt, function(data, opt){
            if (data.statusCode >= 400) {
                var err = '';
                if (data.error != null) {
                    err = data.error.message
                } else {
                    err = "HTTP Error getting patients lists"
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
                opt.res.render('subjects', JSON.parse(data.body));
            }
        });
    } else {
        res.redirect('/login');
    }
});

router.get('/', function(req, res, next) {
    res.redirect('/patients/0/'+config.app.perpage);

});

module.exports = router;