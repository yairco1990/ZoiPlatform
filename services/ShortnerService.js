const MyLog = require('../interfaces/MyLog');
const router = require('express').Router();
const LinkShortnerLogic = require('../logic/LinkShortnerLogic');

const PREFIX_LOG = "Shortner Request -> ";

//get link by id
router.get('/:linkId', async function (req, res) {
	MyLog.log(PREFIX_LOG + "get link by id");

	const result = await LinkShortnerLogic.getLink(req.params.linkId);

	res.writeHead(result.status, result.data);
	res.send();
});

module.exports = router;