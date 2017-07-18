/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const EmailLib = require('../../interfaces/EmailLib');

const delayTime = 3000;

function ClientLogic(user) {
	this.user = user;
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
	this.mindbodyLogic = new MindbodyLogic({});
}

/**
 * process the user input
 */
ClientLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, callback) {

	let self = this;

	switch (conversationData.intent) {
		case "client show customer card":
			self.getCustomer(conversationData, callback);
			break;
		case "client new customer join":
			self.newCustomerJoin(conversationData, callback);
	}
};

const newCustomerJoinQuestions = {
	sendEmail: {
		id: 1,
		text: "Do you want to send welcome email to this customer?"
	},
	whichTemplate: {
		id: 2,
		text: "Which template to use?"
	}
};
ClientLogic.prototype.newCustomerJoin = function (conversationData, callback) {

	let self = this;
	let user = self.user;

	//if this is the start of the conversation
	if (!user.conversationData) {
		//ask send email
		let currentQuestion = newCustomerJoinQuestions.sendEmail;

		//save conversation to the user
		user.conversationData = conversationData;
		//save the question
		user.conversationData.lastQuestion = currentQuestion;
		//save the user
		self.DBManager.saveUser(user).then(function () {

			callback(facebookResponse.getTextMessage("Hey boss, New customer scheduled just now."), true);

			setTimeout(function () {
				callback(facebookResponse.getQRElement(currentQuestion.text,
					[facebookResponse.getQRButton("text", "Yes, send it.", {id: 1}),
						facebookResponse.getQRButton("text", "No, don't send it.", {id: 2})]
				))
			}, delayTime);
		});
	}
	else if (user.conversationData.lastQuestion.id === newCustomerJoinQuestions.sendEmail.id) {

		if (conversationData.payload.id == 1) {

			callback(facebookResponse.getTextMessage("Let's send it!"), true);

			//ask which tenplate
			let currentQuestion = newCustomerJoinQuestions.whichTemplate;
			//save conversation to the user
			user.conversationData = conversationData;
			//save the question
			user.conversationData.lastQuestion = currentQuestion;

			//save the user
			self.DBManager.saveUser(user).then(function () {
				setTimeout(function () {
					callback(facebookResponse.getTextMessage(currentQuestion.text), true);

					setTimeout(function () {
						callback(facebookResponse.getGenericTemplate([
							facebookResponse.getGenericElement("Welcome Email",
								"https://www.askideas.com/media/13/Welcome-3d-Picture.jpg",
								"Welcome my friend!",
								[facebookResponse.getGenericButton("postback", "I like it", {
									id: 1,
									title: "Welcome to our spa!"
								})]),
							facebookResponse.getGenericElement("Good Choice!",
								"http://www.designsbykayla.net/wp-content/uploads/2016/03/Welcome_large.jpg",
								"You did the right thing!",
								[facebookResponse.getGenericButton("postback", "I like it", {
									id: 2,
									title: "Hope you will enjoy our services!"
								})])
						]));
					}, delayTime);
				}, delayTime);
			});
		} else {
			user.conversationData = null;
			user.session = null;

			//save the user
			self.DBManager.saveUser(user).then(function () {
				callback(facebookResponse.getTextMessage("Ok boss.."));
			});
		}
	} else if (user.conversationData.lastQuestion.id === newCustomerJoinQuestions.whichTemplate.id) {

		if (user.session && user.session.newClient && user.session.newClient.email) {
			EmailLib.getEmailFile(__dirname + "/../../interfaces/assets/promotionsMail.html").then(function (emailHtml) {
				EmailLib.sendEmail(emailHtml, [{
					address: user.session.newClient.email,
					from: 'Zoi.AI <noreply@fobi.io>',
					subject: 'Test Subject',
					alt: 'Test Alt'
				}]);
			}).catch(MyUtils.getErrorMsg);
		}

		callback(facebookResponse.getTextMessage("Great! I sent it to him. 😎"), true);

		setTimeout(function () {
			callback(facebookResponse.getTextMessage("I'm sure he will be happy to see your attitude! ☺"));
		}, delayTime);

		//clear conversation data
		user.conversationData = null;
		user.session = null;
		//save the user
		self.DBManager.saveUser(user).then(function () {
		}).catch(MyUtils.getErrorMsg);
	}
};

/**
 * get customer
 */
ClientLogic.prototype.getCustomer = function (entities, callback) {

	let self = this;

	self.mindbodyLogic.getClients(entities).then(function (clients) {

		//choose the first one we found
		let customer = clients[0];

		callback(facebookResponse.getGenericTemplate([
			facebookResponse.getGenericElement(customer.FirstName + " " + customer.LastName, customer.PhotoURL, "Status: " + customer.Status)
		]));

	}).catch(function (err) {

		Util.log(err);
		callback(facebookResponse.getTextMessage("Error on getting clients"));
	});
};

module.exports = ClientLogic;