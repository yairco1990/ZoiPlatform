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

//get link by id 2
router.get('/link/:linkId', async function (req, res) {
	MyLog.log(PREFIX_LOG + "get link by id");

	const result = await LinkShortnerLogic.getLink(req.params.linkId, false);

	res.status(result.status).send(result.data);
});

module.exports = router;