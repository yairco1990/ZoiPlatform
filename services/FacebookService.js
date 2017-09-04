const FacebookLogic = require('../logic/FacebookLogic');
const zoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const router = require('express').Router();

const PREFIX_LOG = "Facebook Request -> ";

//integrate with facebook
router.post('/auth', function (req, res) {
    MyLog.log(PREFIX_LOG + "integrateWithFacebook. userId = " + req.query.userId);
    let authResponse = JSON.parse(req.query.authResponse);
    FacebookLogic.addFacebookIntegration(req.query.userId, authResponse, function (status, data) {
        res.writeHead(status, data);
        res.send();
    });
});

module.exports = router;