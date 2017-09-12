const MyLog = require('../interfaces/MyLog');
const router = require('express').Router();
const ChatLogic = require('../logic/ChatLogic');

const PREFIX_LOG = "Chat Request -> ";

//get link by id
router.post('/postFacebookContent', async function (req, res) {
	MyLog.log(PREFIX_LOG + "postFacebookContent");

	ChatLogic.postFacebookContent(req.query);

	res.writeHead(200, {message: "Facebook content sent successfully"});
	res.send();
});

module.exports = router;