var express = require('express');
var router = express.Router();
//var service = require('../services/oauth');
var service = require('../services/jwt');

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
    var opt = {
        "username": req.body.username,
        "password": req.body.password,
        "sess": req.session,
        "res": res,
    };
    // TODO: check config to decide between OAuth2 or JWT
    //service.oauth(opt, function(username, token, sess) {
    service.jwt(opt, function(username, token, sess) {
        sess.username = username;
        sess.token = token;
        console.log('token: ', token);
        res.redirect('/patients');
    });
});

module.exports = router;
