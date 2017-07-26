/**
 * Created by Yair on 6/20/2017.
 */
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const google = require('googleapis');
const GmailLogic = require('../GmailLogic');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const AppointmentLogic = require('./AppointmentLogic');
const _ = require('underscore');
const async = require('async');
const ZoiConfig = require('../../config');

const delayTime = ZoiConfig.delayTime || 3000;

function GeneralLogic(user) {
	this.user = user;
	this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user input
 */
GeneralLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, callback) {
	let self = this;

	switch (conversationData.intent) {
		case "general hi zoi":
			self.sayHey(conversationData.entities, callback);
			break;
		case "general no thanks":
			self.clearSession(callback, true);
			break;
		case "general bye zoi":
			self.clearSession(callback, true);
			break;
		case "general leave review":
			self.wishZoi(conversationData, setBotTyping, requestObj, callback);
			break;
		case "general morning brief":
			setBotTyping();
			self.sendMorningBrief(conversationData, setBotTyping, requestObj, callback);
			break;
	}
};

/**
 * send morning brief
 */
GeneralLogic.prototype.sendMorningBrief = function (conversationData, setBotTyping, requestObj, reply) {
	let self = this;
	let user = self.user;

	let tokens = user.integrations.Gmail;

	let appointmentLogic = new AppointmentLogic(user);

	let acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);
	acuityLogic.getClients().then(function (clients) {

		let queryString = "newer_than:7d is:unread";

		//get unread emails from the user clients
		GmailLogic.getEmailsList(tokens, queryString, 'me').then(function (messages) {

			let clientsMessages = _.filter(messages, function (item1) {
				return _.some(this, function (item2) {
					return item1.from.includes(item2.email) && item2.email;
				});
			}, clients);

			if (clientsMessages.length > 0) {
				async.series([
					//emails
					MyUtils.onResolve(reply, facebookResponse.getButtonMessage("You have " + clientsMessages.length + " unread emails from your customers within the last 7 days", [
						facebookResponse.getGenericButton("web_url", "Customers Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + user._id, "full")
					]), true),
				], MyUtils.getErrorMsg());
			} else {
				async.series([
					MyUtils.onResolve(reply, facebookResponse.getTextMessage("You have read all the emails received from your customers. Good job! 👍"), true),
				], MyUtils.getErrorMsg());
			}

			//get appointments for today
			return acuityLogic.getAppointments({
				minDate: MyUtils.convertToAcuityDate(moment().startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().endOf('day'))
			});
		}).then(function (appointments) {

			//function for starting send promotions dialog
			let startSendPromotions = function () {
				appointmentLogic.processIntent({
					intent: "appointment send promotions",
					context: "APPOINTMENT",
					skipHey: true
				}, setBotTyping, requestObj, reply);
			};


			if (appointments.length) {

				//sort appointments
				appointments.sort(function (q1, q2) {
					if (moment(q1.datetime).isAfter(moment(q2.datetime))) {
						return 1;
					} else {
						return -1;
					}
				});

				//get the next appointment
				let nextAppointment;
				appointments.forEach(function (appointment) {
					if (!nextAppointment && moment(appointment.datetime).isAfter(moment())) {
						nextAppointment = appointment;
					}
				});

				let messages = [MyUtils.onResolve(reply, facebookResponse.getButtonMessage("You have " + appointments.length + " appointments today", [
					facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, "full")
				]), true, delayTime)];

				//if there is next appointment - add another message about it.
				if (nextAppointment) {
					messages.push(MyUtils.onResolve(reply, facebookResponse.getTextMessage("Your next appointment is at " + nextAppointment.time + " with " + nextAppointment.firstName + " " + nextAppointment.lastName), true, delayTime));
				}

				async.series(messages, function () {
					startSendPromotions();
				});

			} else {
				(MyUtils.onResolve(reply, facebookResponse.getTextMessage("You don't have appointments today"), true, delayTime))().then(function () {
					startSendPromotions();
				});
			}

		}).catch(function (err) {
			Util.log("Error:");
			Util.log(err);
		});
	});
};

const wishZoiQuestions = {
	writeReview: {
		id: 1,
		text: "What you with that zoi will do?"
	}
};
/**
 * send morning brief
 */
GeneralLogic.prototype.wishZoi = function (conversationData, setBotTyping, requestObj, reply) {

	let self = this;
	let user = self.user;

	//if this is the start of the conversation
	if (!user.conversationData) {
		//set current question
		let currentQuestion = wishZoiQuestions.writeReview;
		//save conversation to the user
		user.conversationData = conversationData;
		//save the question
		user.conversationData.lastQuestion = currentQuestion;

		//save the user
		self.DBManager.saveUser(user).then(function () {
			reply(facebookResponse.getTextMessage("What will you wish Zoi will do in the future?"), false, 1000);
		});
	} else if (user.conversationData.lastQuestion.id === wishZoiQuestions.writeReview.id) {

		user.wishList.push(conversationData.input);

		//save the user
		self.DBManager.saveUser(user).then(function () {
			reply(facebookResponse.getTextMessage("Thank you for helping Zoi become greater assistant! :)"), false, 1000);
			self.clearSession(reply, false);
		});
	}
};

/**
 * say hey
 * @param entities
 * @param reply
 */
GeneralLogic.prototype.sayHey = function (entities, reply) {
	let self = this;

	let randomNumber = Math.random();
	if (randomNumber < 0.5) {
		(MyUtils.onResolve(reply, facebookResponse.getTextMessage("Hey boss! What can I do for you?"), false, delayTime))();
	} else {
		(MyUtils.onResolve(reply, facebookResponse.getTextMessage("Hey Chief! What can I do for you?"), false, delayTime))();
	}
};

GeneralLogic.prototype.clearSession = function (reply, sendLastMessage) {
	let self = this;
	let user = self.user;

	user.conversationData = null;
	user.session = null;
	self.DBManager.saveUser(user).then(function () {
		if (sendLastMessage) {
			(MyUtils.onResolve(reply, facebookResponse.getTextMessage("I'll be right here if you need me ☺"), false, delayTime))();
		}
	});
};


module.exports = GeneralLogic;