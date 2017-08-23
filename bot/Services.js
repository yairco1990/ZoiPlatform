/**
 * Created by Yair on 7/3/2017.
 */
const ListenLogic = require('../logic/Listeners/ListenLogic');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const PostbackLogic = require('../logic/Listeners/PostbackLogic');
const speechToText = require('../interfaces/SpeechToText');
const facebookResponses = require('../interfaces/FacebookResponse');
const zoiBot = require('../bot/ZoiBot');

/**
 * on message arrived
 * @param payload
 * @param reply
 */
async function onMessageArrived(payload, reply) {

	const onTextReady = function (profile, speechToTextResult) {
		// user information
		const display_name = profile.first_name + ' ' + profile.last_name;
		const sender_id = payload.sender.id;

		const listenLogic = new ListenLogic();

		//if it's sound message - set it in the text key
		if (speechToTextResult) {
			payload.message.text = speechToTextResult;
		}

		//get functions
		const setTypingFunction = zoiBot.getBotWritingFunction({_id: sender_id});
		const replyFunction = zoiBot.getBotReplyFunction({_id: sender_id, fullname: display_name});

		const textMessage = payload.message.text;

		//process the input and return an answer to the sender
		listenLogic.processInput(textMessage, payload, setTypingFunction, zoiBot, replyFunction);
	};

	try {
		// get profile info
		const profile = await zoiBot.getProfile(payload.sender.id);

		const display_name = profile.first_name + ' ' + profile.last_name;
		MyLog.log("Got message from " + display_name);

		//check if this is a voice message
		if (payload.message.attachments &&
			payload.message.attachments[0] &&
			payload.message.attachments[0].payload &&
			payload.message.attachments[0].payload.url) {
			speechToText(payload.message.attachments[0].payload.url).then(function (text) {
				if (text) {
					onTextReady(profile, text);
				} else {
					reply(facebookResponses.getTextMessage("I can't hear what you say.."), (err) => {
						if (err) throw err;
						// console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
					});
				}
			}).catch(function (err) {
				MyLog.error("Error: failed to convert the payload audio to text");
				reply(facebookResponses.getTextMessage("I can't hear what you say.."), (err) => {
					if (err) throw err;
					// console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
				});
			});
		} else { //if it's a regular message
			onTextReady(profile);
		}
	} catch (err) {
		MyLog.error("Failed on onMessageArrived", err);
	}
}

/**
 * on postback arrived
 * @param payload
 * @param reply
 */
async function onPostbackArrived(payload, reply) {
	try {
		// get profile info
		const profile = await zoiBot.getProfile(payload.sender.id);

		// user information
		const display_name = profile.first_name + ' ' + profile.last_name;
		const sender_id = payload.sender.id;

		//get functions
		const setTypingFunction = zoiBot.getBotWritingFunction({_id: sender_id});
		const replyFunction = zoiBot.getBotReplyFunction({_id: sender_id, fullname: display_name});

		const postbackPayload = payload.postback.payload;

		if (postbackPayload.includes("ACTION") || postbackPayload.includes("MENU")) {
			const postbackLogic = new PostbackLogic();
			postbackLogic.processAction(postbackPayload, payload, setTypingFunction, zoiBot, replyFunction);
		} else {
			const listenLogic = new ListenLogic();
			listenLogic.processInput(postbackPayload, payload, setTypingFunction, zoiBot, replyFunction);
		}
	} catch (err) {
		MyLog.error("Failed on onPostbackArrived", err);
	}
}

module.exports = {
	//set server routing
	setRouting: function (app) {

		//ping request
		app.get('/ping', function (req, res) {
			MyLog.log("Ping request");
			res.send("Pong!");
		});

		//status request
		app.get('/_status', function (req, res) {
			MyLog.log("Status request");
			res.end(JSON.stringify({status: 'ok'}));
		});

		//verify bot
		app.get('/', function (req, res) {
			MyLog.log("Verify bot request");
			return zoiBot._verify(req, res);
		});

		//facebook message request
		app.post('/', function (req, res) {
			// we always write 200, otherwise facebook will keep retrying the request
			res.writeHead(200, {'Content-Type': 'application/json'});

			zoiBot._handleMessage(req.body);
			res.end(JSON.stringify({status: 'ok'}));
		});
	},

	/**
	 * set bot listeners
	 * @param bot
	 */
	setBotListeners: function () {
		// bot error handler
		zoiBot.on('error', (err) => {
			MyLog.error(err);
		});

		// bot message handler
		zoiBot.on('message', onMessageArrived);

		//postback buttons handler
		zoiBot.on('postback', onPostbackArrived);
	}
};