/**
 * Created by Yair on 6/20/2017.
 */
const MyLog = require('../../interfaces/MyLog');
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
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

function GeneralLogic(user) {
	this.user = user;
	this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user input
 */
GeneralLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, reply) {
	let self = this;

	switch (conversationData.intent) {
		case "general no thanks":
			self.clearSession(reply, true);
			break;
		case "general bye zoi":
			self.clearSession(reply, true);
			break;
		case "general leave review":
			self.wishZoi(conversationData, setBotTyping, requestObj, reply);
			break;
		case "general suggest idea":
			self.wishZoi(conversationData, setBotTyping, requestObj, reply);
			break;
		case "general morning brief":
			setBotTyping && setBotTyping();
			self.sendMorningBrief(conversationData, setBotTyping, requestObj, reply);
			break;
		default:
			reply(facebookResponse.getTextMessage(fallbackText));
			break;
	}
};

/**
 * send morning brief
 */
GeneralLogic.prototype.sendMorningBrief = async function (conversationData, setBotTyping, requestObj, reply) {

	let self = this;
	let user = self.user;
	try {

		let appointmentLogic = new AppointmentLogic(user);

		let acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);

		//if user integrated with Gmail
		if (user.integrations && user.integrations.Gmail) {

			let tokens = user.integrations.Gmail;

			//get business customers
			let clients = await acuityLogic.getClients();

			let queryString = "newer_than:7d is:unread";

			//get unread emails from the user clients
			let messages = await GmailLogic.getEmailsList(tokens, queryString, 'me', user);

			//do the intersection between customers emails and the user's gmail
			let clientsMessages = _.filter(messages, function (item1) {
				return _.some(this, function (item2) {
					return item1.from.includes(item2.email) && item2.email;
				});
			}, clients);

			if (clientsMessages.length > 0) {
				async.series([
					//emails
					MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("You have " + clientsMessages.length + " unread emails from your customers within the last 7 days", [
						facebookResponse.getGenericButton("web_url", "Customers Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + user._id, "full")
					]), true),
				], MyUtils.getErrorMsg());
			} else {
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("You have read all the emails received from your customers. Good job! 👍"), true),
				], MyUtils.getErrorMsg());
			}
		}

		//get appointments for today
		let appointments = await acuityLogic.getAppointments({
			minDate: MyUtils.convertToAcuityDate(moment().startOf('day')),
			maxDate: MyUtils.convertToAcuityDate(moment().endOf('day'))
		});

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

			let messages = [MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("You have " + appointments.length + " appointments today", [
				facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, "full")
			]), true, delayTime)];

			//if there is next appointment - add another message about it.
			if (nextAppointment) {
				messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Your next appointment is at " + nextAppointment.time + " with " + nextAppointment.firstName + " " + nextAppointment.lastName), true, delayTime));
			}

			async.series(messages, function () {
				startSendPromotions();
			});

		} else {
			async.series([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("You don't have appointments today"), true, delayTime)
			], function () {
				startSendPromotions();
			});
		}
	} catch (err) {
		MyLog.error("morning brief. userId => " + user._id);
		MyLog.error(err);
	}
};

const wishZoiQuestions = {
	writeReview: {
		id: 1
	}
};
/**
 * send morning brief
 */
GeneralLogic.prototype.wishZoi = async function (conversationData, setBotTyping, requestObj, reply) {

	let self = this;
	let user = self.user;

	try {
		//if this is the start of the conversation
		if (!user.conversationData) {
			//set current question
			let currentQuestion = wishZoiQuestions.writeReview;
			//save conversation to the user
			user.conversationData = conversationData;
			//save the question
			user.conversationData.lastQuestion = currentQuestion;

			//save the user
			await self.DBManager.saveUser(user);

			reply(facebookResponse.getTextMessage("What do you wish I would do for you in the future?"), false, 1000);

		} else if (user.conversationData.lastQuestion.id === wishZoiQuestions.writeReview.id) {

			user.wishList.push(conversationData.input);

			//save the user
			await self.DBManager.saveUser(user);

			//send response
			reply(facebookResponse.getTextMessage("Thank you for helping me become an even greater assistant!"), false, 1000);

			//clear the session
			self.clearSession(reply, false);
		}
	} catch (err) {
		MyLog.error(err);
	}
};

GeneralLogic.prototype.clearSession = function (reply, sendLastMessage) {
	let self = this;
	let user = self.user;

	user.conversationData = null;
	user.session = null;
	self.DBManager.saveUser(user).then(function () {
		if (sendLastMessage) {
			(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'll be right here if you need me ☺"), false, delayTime))();
		}
	});
};


module.exports = GeneralLogic;