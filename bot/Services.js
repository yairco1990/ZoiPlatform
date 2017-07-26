/**
 * Created by Yair on 7/3/2017.
 */
const fs = require('fs');
const ListenLogic = require('../logic/Listeners/ListenLogic');
const Util = require('util');
const MyUtils = require('../interfaces/utils');
const PostbackLogic = require('../logic/Listeners/PostbackLogic');
const speechToText = require('../interfaces/SpeechToText');
const facebookResponses = require('../interfaces/FacebookResponse');
const GeneralTest = require('../tests/general');
const RequestLogic = require('../logic/Listeners/RequestLogic');
const crypto = require('crypto');

//TODO here we decide if mock or real world
const logicType = MyUtils.logicType.REAL_WORLD;

module.exports = {
	//set server routing
	setRouting: function (app, bot) {

		//ping request
		app.get('/ping', function (req, res) {
			Util.log("Ping request");
			res.send("Pong!");
		});

		//status request
		app.get('/_status', function (req, res) {
			Util.log("Status request");
			res.end(JSON.stringify({status: 'ok'}));
		});

		// //test mindbody api
		// app.get('/test/mindbody', function (req, res) {
		// 	GeneralTest.index(req, res);
		// });
		//
		// //getImage request
		// app.get('/getImage', function (req, res) {
		// 	MyUtils.getScreenShot(res, req.url.substring(10));
		// });
		//
		// //test mindbody api
		// app.get('/mock/openings', function (req, res) {
		// 	let requestLogic = new RequestLogic();
		// 	requestLogic.processMock(bot, {id: 1}, req.query.senderId);
		// 	res.end("Message sent!");
		// });

		//verify bot
		app.get('/', function (req, res) {
			Util.log("Verify bot request");
			return bot._verify(req, res);
		});

		//facebook message request
		app.post('/', function (req, res) {
			// we always write 200, otherwise facebook will keep retrying the request
			res.writeHead(200, {'Content-Type': 'application/json'});

			bot._handleMessage(req.body);
			res.end(JSON.stringify({status: 'ok'}));
		});
	},

	/**
	 * set bot listeners
	 * @param bot
	 */
	setBotListeners: function (bot) {
		// bot error handler
		bot.on('error', (err) => {
			console.log(err.message)
		});

		// bot message handler
		bot.on('message', (payload, reply) => {
			//console.log(payload);

			// get message text
			// if message has no text (e.g. location response) - stringify it.
			// let text = !!payload.message.text ? payload.message.text : JSON.stringify(payload.message);
			// let msg_payload = !!payload.message.quick_reply && !!payload.message.quick_reply.payload ? payload.message.quick_reply.payload : null;

			let onTextReady = function (profile, speechToText) {
				// user information
				let display_name = profile.first_name + ' ' + profile.last_name;
				let sender_id = payload.sender.id;

				// build reply
				// let rep = repHandler.buildReply(payload);

				//MY RESPONSE LOGIC
				let listenLogic = new ListenLogic();

				//check if real world or mock to decide which process function we should use
				let processType = logicType === MyUtils.logicType.REAL_WORLD ? "processInput" : "processMock";

				//if it's sound message - set it in the text key
				if (speechToText) {
					payload.message.text = speechToText;
				}

				let setTypingFunction = function () {
					bot.sendSenderAction(payload.sender.id, "typing_on");
				};
				let replyFunction = function (rep, isBotTyping, delay) {
					return new Promise(function (resolve, reject) {
						delay = delay || 0;
						setTimeout(() => {
							//send reply
							reply(rep, (err) => {
								if (err) {
									reject();
									return;
								}
								if (isBotTyping) {
									bot.sendSenderAction(payload.sender.id, "typing_on", () => {
										resolve();
									});
								} else {
									resolve();
								}
								Util.log(`Message returned to ${display_name} [id: ${sender_id}] -> ${rep.text}`);
							});
						}, delay);
					});
				};
				let textMessage = payload.message.text;

				//process the input and return an answer to the sender
				listenLogic[processType](textMessage, payload, setTypingFunction, bot, replyFunction);
			};

			// get profile info
			bot.getProfile(payload.sender.id, (err, profile) => {
				if (err) throw err;

				let display_name = profile.first_name + ' ' + profile.last_name;
				Util.log("Got message from " + display_name);

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
						Util.log("Error: failed to convert the payload audio to text");
						reply(facebookResponses.getTextMessage("I can't hear what you say.."), (err) => {
							if (err) throw err;
							// console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
						});
					});
				} else {
					onTextReady(profile);
				}

			});
		});

		//postback buttons handler
		bot.on('postback', (payload, reply) => {

			// get profile info
			bot.getProfile(payload.sender.id, (err, profile) => {
				if (err) throw err;

				// user information
				let display_name = profile.first_name + ' ' + profile.last_name;
				let sender_id = payload.sender.id;

				let setTypingFunction = function () {
					bot.sendSenderAction(payload.sender.id, "typing_on");
				};
				let replyFunction = function (rep, isBotTyping, delay) {
					return new Promise(function (resolve, reject) {
						delay = delay || 0;
						setTimeout(() => {
							//send reply
							reply(rep, (err) => {
								if (err) {
									reject(err);
									return;
								}
								if (isBotTyping) {
									bot.sendSenderAction(payload.sender.id, "typing_on", () => {
										resolve();
									});
								} else {
									resolve();
								}
								Util.log(`Message returned to ${display_name} [id: ${sender_id}]`);
							});
						}, delay);
					});
				};
				let postbackPayload = payload.postback.payload;

				if (postbackPayload.includes("POSTBACK")) {
					let postbackLogic = new PostbackLogic();
					//check if real world or mock to decide which process function we should use
					let processType = logicType === MyUtils.logicType.REAL_WORLD ? "processAction" : "processMockAction";
					postbackLogic[processType](postbackPayload, payload, setTypingFunction, bot, replyFunction);
				} else {
					let listenLogic = new ListenLogic();
					//check if real world or mock to decide which process function we should use
					let processType = logicType === MyUtils.logicType.REAL_WORLD ? "processInput" : "processMock";
					listenLogic[processType](postbackPayload, payload, setTypingFunction, bot, replyFunction);
				}
			});
		});
	}
};
