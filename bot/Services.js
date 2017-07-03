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
const ApiLogic = require('../logic/ApiLogic/index');
const GeneralTest = require('../tests/general');
const RequestLogic = require('../logic/Listeners/RequestLogic');
const crypto = require('crypto');
const bodyParser = require('body-parser');

//TODO here we decide if mock or real world
const logicType = MyUtils.logicType.MOCK;

module.exports = {
    //set server routing
    setRouting: function (app, bot) {

        //parse body for every request
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: true}));
        //sign that the server got the request
        // app.use('/', function () {
	 //  console.log("-------------------------------------");
        // });

        //ping request
        app.get('/ping', function (req, res) {
	  res.send("Pong!");
        });

        //status request
        app.get('/_status', function (req, res) {
	  res.end(JSON.stringify({status: 'ok'}));
        });

        //test mindbody api
        app.get('/test/mindbody', function (req, res) {
	  GeneralTest.index(req, res);
        });

        //test mindbody api
        app.get('/mock/openings', function (req, res) {
	  let requestLogic = new RequestLogic();
	  requestLogic.processMock(bot, {id: 1}, req.query.senderId);
	  res.end("Message sent!");
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

	      //process the input and return an answer to the sender
	      listenLogic[processType](payload.message.text, payload, function () {
		bot.sendSenderAction(payload.sender.id, "typing_on");
	      }, bot, function (rep, isBotTyping) {
		// send reply
		reply(rep, (err) => {
		    if (err) throw err;
		    console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
		    if (isBotTyping) {
		        bot.sendSenderAction(payload.sender.id, "typing_on");
		    }
		});
	      });
	  };

	  // get profile info
	  bot.getProfile(payload.sender.id, (err, profile) => {
	      if (err) throw err;

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
	      let postbackLogic = new PostbackLogic();

	      //check if real world or mock to decide which process function we should use
	      let processActionType = logicType === MyUtils.logicType.REAL_WORLD ? "processAction" : "processMockAction";

	      postbackLogic[processActionType](function () {
		bot.sendSenderAction(payload.sender.id, "typing_on");
	      }, bot, payload, JSON.parse(payload.postback.payload), function (rep, isBotTyping) {
		// send reply
		reply(rep, (err) => {
		    if (err) throw err;
		    console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);

		    if (isBotTyping) {
		        bot.sendSenderAction(payload.sender.id, "typing_on");
		    }
		});
	      });
	  });
        });
    }
};
