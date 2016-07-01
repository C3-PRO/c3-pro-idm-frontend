var express = require('express');
var router = express.Router();
var service = require('../services/patients');
var config = require('../utils.js');


router.get('/api/:page/:perpage', function(req, res, next) {
    var sess = req.session;
    if (sess.token) {
        var opt = {
            token: sess.token,
            sess: sess,
            page: req.params.page,
            perpage: req.params.perpage,
            state: req.query.state,
            res: res,
        };
        service.getPatients(opt, function(data, opt) {
            if (data.body) {
                opt.res.json({'data': data.body});
            }
            else {
                if (data.statusCode == 401) {
                    opt.sess.destroy(function (err) {
                        if (err) {
                            console.error("Failed to destroy session", err);
                        }
                    });
                }
                if (!data.error) {
                    data.error = {
                        'message': "HTTP Error getting patients lists"
                    };
                }
                data.error.status = data.statusCode;
                opt.res.json({
                    error: data.error
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
 *  GET home page - redirect to 'patients'
 */
router.get('/', function(req, res, next) {
    if (req.session.token) {
        res.render('patients');
    }
    else {
        res.redirect('/');
    }
});

module.exports = router;
