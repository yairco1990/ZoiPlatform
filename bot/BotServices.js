const ListenLogic = require('../logic/Listeners/ListenLogic');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const PostbackLogic = require('../logic/Listeners/PostbackLogic');
const speechToText = require('../interfaces/SpeechToText');
const cloudinary = require('cloudinary');
const facebookResponses = require('../interfaces/FacebookResponse');
const zoiBot = require('../bot/ZoiBot');

/**
 * on message arrived
 * @param payload
 * @param reply
 */
async function onMessageArrived(payload, reply) {

	const onMessageReady = function (profile, attachmentResult) {
		// user information
		const display_name = profile.first_name + ' ' + profile.last_name;
		const sender_id = payload.sender.id;

		const listenLogic = new ListenLogic();

		//if there is attachment result - set it to 'text'
		if (attachmentResult) {
			payload.message.text = attachmentResult;
		}

		//get bot functions
		const setTypingFunction = zoiBot.getBotWritingFunction({_id: sender_id});
		const replyFunction = zoiBot.getBotReplyFunction({_id: sender_id, fullname: display_name});

		const textMessage = payload.message.text;

		//process the input and return an answer to the sender
		listenLogic.processInput(textMessage, payload, setTypingFunction, replyFunction);
	};

	try {
		// get profile info
		const profile = await zoiBot.getProfile(payload.sender.id);

		const display_name = profile.first_name + ' ' + profile.last_name;
		MyLog.log("Got message from " + display_name);

		//get attachment if exist
		const attachment = MyUtils.nestedValue(payload, "message.attachments[0]");

		//check if this is an attachment
		if (attachment) {

			//if this is an image
			if (attachment.type === "image") {

				let imageUrl;

				try {
					imageUrl = attachment.payload.url;

					if (imageUrl) {
						///Upload the image
						cloudinary.uploader.upload(imageUrl, function (result) {
							let public_id = result.public_id;
							//Resize the image
							let resizedImg = cloudinary.url(public_id, {width: 544, height: 544, crop: "fill"});
							onMessageReady(profile, resizedImg);
						});
					}

				} catch (err) {
					reply(facebookResponses.getTextMessage("I didn't get your image :\\"), (err) => {
						if (err) throw err;
					});
				}

			}
			//if this is a voice message
			else {
				let text;

				try {
					text = await speechToText(attachment.payload.url);
				} catch (err) {
					MyLog.error("Error: failed to convert the payload audio to text");
					reply(facebookResponses.getTextMessage("I can't hear what you say.."), (err) => {
						if (err) throw err;
						// console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
					});
				}

				//if the speech to text generated a text
				if (text) {
					onMessageReady(profile, text);
				} else {
					reply(facebookResponses.getTextMessage("I can't hear what you say.."), (err) => {
						if (err) throw err;
						// console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
					});
				}
			}

		}
		//if it's a regular message
		else {
			onMessageReady(profile);
		}
	} catch (err) {
		MyLog.error("Failed on onMessageArrived", err);
	}
}

/**
 * on postback arrived
 * @param payload
 */
async function onPostbackArrived(payload) {
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
			listenLogic.processInput(postbackPayload, payload, setTypingFunction, replyFunction);
		}
	} catch (err) {
		MyLog.error("Failed on onPostbackArrived", err);
	}
}

module.exports = {
	//set server routing
	setBotRouting: function (app) {

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