var express = require('express');
var router = express.Router();
var service = require('../services/oauth');

/* GET home page. */
router.get('/', function(req, res, next) {
    var sess=req.session;
    if (sess.username) {
        res.redirect('/patients');
    } else {
        res.render('login', {title: 'IDM'});
    }
});

/* POST for log in*/

router.post('/', function(req, res, next) {
    //console.log(req.body.username + ":" + req.body.password);
    var opt = {
        "key": req.body.username + ":" + req.body.password,
        "sess": req.session,
        "username": req.body.username,
        "res":res
    };
    service.oauth(opt,function(username, token, sess) {
        sess.username = username;
        sess.token = token;
        console.log('OAuth2 token: ', token);
        res.redirect('/patients');
    });
});

module.exports = router;
