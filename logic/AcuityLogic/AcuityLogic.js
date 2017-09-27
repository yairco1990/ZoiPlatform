/**
 * Created by Yair on 7/4/2017.
 */
const AcuityApi = require('../ApiHandlers/AcuitySchedulingLogic');
const MyLog = require('../../interfaces/MyLog');
const moment = require('moment-timezone');
const ZoiConfig = require('../../config');
const GmailLogic = require('../GmailLogic');
const _ = require('underscore');
const MyUtils = require('../../interfaces/utils');
const AcuityFactory = require('../../interfaces/Factories/AcuityFactory');
const requestify = require('requestify');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ClientLogic = require('../Intents/ClientLogic');
const EmailLib = require('../../interfaces/EmailLib');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const WelcomeLogic = require('../Intents/WelcomeLogic');
const deepcopy = require('deepcopy');
const async = require('async');
const Acuity = require('acuityscheduling');
const zoiBot = require('../../bot/ZoiBot');

const Response = {
	SUCCESS: 200,
	ERROR: 400,
	UNFULLFILLED: 401,
	NOT_FOUND: 404
};

class AcuityLogic {

	constructor() {
		this.DBManager = require('../../dal/DBManager');
	}

	/**
	 * get business's clients
	 * @param userId
	 * @param callback
	 * @returns {Promise.<void>}
	 */
	async getClients(userId, callback) {
		const self = this;

		try {
			let user = await self.DBManager.getUser({_id: userId});
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let result = await acuityApi.getClients();

			callback(Response.SUCCESS, result);
		} catch (err) {
			callback(Response.ERROR);
			MyLog.error("Error on getClients");
			MyLog.error(err);
		}
	}

	/**
	 * get availability of business for tomorrow
	 * @param data
	 * @param callback
	 */
	async getAvailability(data, callback) {
		const self = this;

		try {

			let user = await self.DBManager.getUser({_id: data.userId});
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let options = {
				appointmentTypeID: parseInt(data.appointmentTypeId),
				date: moment(parseInt(data.date, 16)).tz(user.integrations.Acuity.userDetails.timezone).add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')
			};

			let result = await acuityApi.getAvailability(options);
			callback(Response.SUCCESS, result);

		} catch (err) {
			callback(Response.ERROR);
			MyLog.error("Error on getAvailability");
			MyLog.error(err);
		}

	}

	/**
	 * get business calendars
	 * @param data
	 * @param callback
	 * @returns {Promise.<void>}
	 */
	async getCalendars(data, callback) {
		const self = this;

		try {
			let user = await self.DBManager.getUser({_id: data.userId});

			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let calendars = await acuityApi.getCalendars();

			callback(Response.SUCCESS, calendars);
		} catch (err) {
			callback(Response.ERROR, err);
			MyLog.error("Error on getCalendars", err);
		}
	}

	/**
	 * get appointment types
	 * @param userId
	 * @param callback
	 */
	async getAppointmentTypes(userId, callback) {
		const self = this;

		try {
			let user = await self.DBManager.getUser({_id: userId});
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let result = await acuityApi.getAppointmentTypes();
			callback(Response.SUCCESS, result);
		} catch (err) {
			callback(Response.ERROR);
			MyLog.error("Error on getAppointmentTypes", err);
		}
	}

	/**
	 * get business agenda
	 * @param data
	 * @param callback
	 */
	async getAgenda(data, callback) {

		const self = this;

		try {

			let user = await self.DBManager.getUser({_id: data.userId});

			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			//check which calendar to use(if valid id - choose it. else - all calendars)
			let calendarId = user.defaultCalendar.id > 0 ? user.defaultCalendar.id : null;

			let params = {
				minDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).endOf('day'))
			};

			if (calendarId) {
				params.calendarID = calendarId;
			}

			let appointments = await acuityApi.getAppointments(params);

			//sort appointments
			appointments.sort(function (q1, q2) {
				if (moment(q1.datetime).isAfter(moment(q2.datetime))) {
					return 1;
				} else {
					return -1;
				}
			});

			callback(Response.SUCCESS, AcuityFactory.generateAppointmentsList(appointments));
		} catch (err) {
			callback(Response.ERROR);
			MyLog.error("Error on getAppointmentTypes", err);
		}
	}

	/**
	 * get old customers(customers who didn't visit for a long time)
	 * @param data
	 * @param callback
	 */
	async getOldCustomers(data, callback) {
		const self = this;

		try {
			let user = await self.DBManager.getUser({_id: data.userId});

			if (user.metadata.oldCustomers) {
				callback(Response.SUCCESS, user.metadata.oldCustomers);
			} else {
				callback(Response.SUCCESS, "NOT_AVAILABLE");
			}
		} catch (err) {
			callback(Response.ERROR);
			MyLog.error("Error on getOldCustomers", err);
		}

	}

	/**
	 * send promotions to old customers
	 * @param bot
	 * @param data
	 * @param callback
	 */
	async promoteOldCustomers(bot, data, callback) {
		const self = this;

		try {
			const customers = JSON.parse(data.customers);

			let user = await self.DBManager.getUser({_id: data.userId});

			const acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			const appointmentTypes = await acuityApi.getAppointmentTypes();
			const emailTemplate = EmailConfig.oldCustomersEmail;
			const service = appointmentTypes[0];

			customers.forEach(function (customer) {

				let emailHtml = EmailLib.getEmailByName('promotionsMail');

				//parse the first part
				emailHtml = emailHtml.replace('{{line1}}', emailTemplate.line1);
				emailHtml = emailHtml.replace('{{line2}}', emailTemplate.line2);
				emailHtml = emailHtml.replace('{{line3}}', emailTemplate.line3);
				emailHtml = emailHtml.replace('{{line4}}', emailTemplate.line4);
				emailHtml = emailHtml.replace('{{bannerSrc}}', emailTemplate.bannerImage);
				emailHtml = emailHtml.replace('{{preHeaderText}}', emailTemplate.subject);

				//parse the second part
				emailHtml = MyUtils.replaceAll('{{business name}}', user.integrations.Acuity.userDetails.name, emailHtml);
				emailHtml = MyUtils.replaceAll('{{firstName}}', customer.firstName, emailHtml);
				emailHtml = MyUtils.replaceAll('{{hoverColor}}', emailTemplate.hoverColor, emailHtml);
				emailHtml = MyUtils.replaceAll('{{color}}', emailTemplate.color, emailHtml);
				emailHtml = MyUtils.replaceAll('{{service}}', service.name, emailHtml);
				emailHtml = MyUtils.replaceAll('{{discount type}}', "10% Off", emailHtml);
				emailHtml = MyUtils.replaceAll('{{href}}', user.integrations.Acuity.userDetails.schedulingPage, emailHtml);
				emailHtml = MyUtils.replaceAll('{{buttonText}}', EmailConfig.oldCustomersEmail.buttonText, emailHtml);
				emailHtml = MyUtils.replaceAll('{{unsubscribeHref}}', ZoiConfig.serverUrl + "/unsubscribe?email=" + customer.email, emailHtml);

				EmailLib.sendEmail(emailHtml, [{
					address: customer.email,
					from: user.integrations.Acuity.userDetails.name + ' <noreply@zoi.ai>',
					subject: EmailConfig.oldCustomersEmail.subject,
					alt: 'Old Customers Promotions',
					replyTo: user.integrations.Acuity.userDetails.email
				}]);
			});

			callback(Response.SUCCESS, "SUCCESS");
			MyLog.log("Old customers promotions sent successfully");

			//remove the metadata
			user.metadata.oldCustomers = null;
			await self.DBManager.saveUser(user);

			const replyFunction = zoiBot.getBotReplyFunction(user);
			//send messages
			async.series([
				MyUtils.resolveMessage(replyFunction, facebookResponse.getTextMessage("Done! 😎 I sent the promotion to " + customers.length + " of your customers."), true),
				MyUtils.resolveMessage(replyFunction, facebookResponse.getTextMessage("Trust me, they will be regulars soon enough."), false, ZoiConfig.delayTime),
			], MyUtils.getErrorMsg());

		} catch (err) {
			callback(Response.ERROR);
			MyLog.error("Error on promoteOldCustomers", err);
		}

	}

	/**
	 * schedule an appointment by customers
	 * @param data
	 * @param callback
	 */
	async scheduleAppointment(data, callback) {
		const self = this;

		try {
			const user = await self.DBManager.getUser({_id: data.userId});

			const acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			// Create appointment:
			const options = {
				method: 'POST',
				body: {
					//remove the timezone
					datetime: data.datetime.substring(0, 19),
					appointmentTypeID: data.appointmentTypeID,
					firstName: data.firstname,
					lastName: data.lastname,
					email: data.email,
					notes: data.notes
				}
			};
			if (data.certificate) {
				options.body.certificate = data.certificate;
			}

			await acuityApi.scheduleAppointment(options);

			callback(Response.SUCCESS, {message: "Appointment scheduled successfully"});
			MyLog.log("Appointment scheduled successfully");

			//save number of appointments schedule by zoi
			const actionTime = moment().tz(user.integrations.Acuity.userDetails.timezone).format("YYYY/MM");

			if (user.profile[actionTime]) {
				user.profile[actionTime].numOfAppointments = (user.profile[actionTime].numOfAppointments || 0) + 1;
				user.profile[actionTime].profitFromAppointments = ((user.profile[actionTime].profitFromAppointments || 0) + parseFloat(data.price)) || 0;
			} else {
				user.profile[actionTime] = {
					numOfAppointments: 1,
					profitFromAppointments: parseFloat(data.price) || 0
				}
			}

			await self.DBManager.saveUser(user);

		} catch (err) {
			callback(Response.ERROR);
			MyLog.error("Error on promoteOldCustomers", err);
		}
	}

	/**
	 * get unread emails
	 * @param data
	 * @param callback
	 * @returns {Promise.<void>}
	 */
	async getEmails(data, callback) {

		const self = this;

		try {
			//get the user
			const user = await self.DBManager.getUserByPageId(data.userId);

			if (user.integrations.Gmail) {
				//init the acuity api
				const acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

				//get the tokens
				let tokens = user.integrations.Gmail;

				//get user clients
				const clients = await acuityApi.getClients();

				//set the query string
				const queryString = "newer_than:7d is:unread";

				//get unread emails from the user clients
				const messages = await GmailLogic.getEmailsList(tokens, queryString, 'me', user);

				//intersection between user's clients and email messages
				const clientsMessages = _.filter(messages, function (item1) {
					return _.some(this, function (item2) {
						return item1.from.includes(item2.email) && item2.email;
					});
				}, clients);

				callback(Response.SUCCESS, clientsMessages);
			} else { //if there is no integration with Gmail yet

				callback(Response.UNFULLFILLED, "There is no integration with Gmail");
			}

		} catch (err) {
			MyLog.error(err);
			callback(Response.UNFULLFILLED, err);
		}
	}

	/**
	 * on appointment scheduled (acuity webhook)
	 * @param userId
	 * @param data
	 * @param callback
	 */
	async onAppointmentScheduled(userId, data, callback) {
		const self = this;

		try {
			//get the user that wants to integrate
			let user = await self.DBManager.getUserById(userId);

			//check if the user integrated with Acuity(in some case, the user deleted himself, but the webhook is still exist)
			if (user.integrations.Acuity) {

				//if the user prompt new customers
				if (user.promptNewCustomers !== false) {
					const acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

					const appointment = await acuityApi.getAppointments(null, 'appointments/' + data.id);

					const options = {
						firstName: appointment.firstName,
						lastName: appointment.lastName
					};

					const appointments = await acuityApi.getAppointments(options);

					if (appointments.length < 2) {

						const newClient = {
							firstName: appointment.firstName,
							lastName: appointment.lastName,
							email: appointment.email,
						};

						if (!user.conversationData) {

							//save the new client to user
							user.session = {
								newClient: newClient
							};
							await self.DBManager.saveUser(user);

							//start the conversation in the clientLogic class
							const clientLogic = new ClientLogic(user, {
								intent: "client new customer join",
								context: "CLIENT"
							});
							clientLogic.processIntent();
						}

						callback(Response.SUCCESS, {message: "It's a new customer"});
					} else {
						callback(Response.SUCCESS, {message: "Not a new customer"});
					}
				} else {
					MyLog.info("User doesn't prompt new customers");
					callback(Response.SUCCESS, {message: "User doesn't prompt new customers"});
				}
			} else {
				MyLog.info("User didn't integrate with Acuity");
				callback(Response.SUCCESS, {message: "User didn't integrate with Acuity"});
			}
		} catch (err) {
			MyLog.error("Failed to send welcome message to new customer", err);
			callback(Response.ERROR, err);
		}
	}

	/**
	 * integrate with Acuity.
	 * the step that the user click on "Allow" on Acuity page
	 * @param userId
	 * @param code
	 * @param bot
	 * @param callback
	 */
	async integrate(userId, code, bot, callback) {

		const self = this;

		try {
			//get the user that wants to integrate
			const user = await self.DBManager.getUser({_id: userId});

			//check if already integrated with Acuity
			const isAlreadyConnectedWithAcuity = user.integrations && user.integrations.Acuity;

			//get acuity details
			const userData = await AcuityApi.getUserAndToken(code);

			//set integration
			user.integrations.Acuity = userData;

			//set timezone
			user.timezone = userData.userDetails.timezone;

			//if the user has a default timezone - change it
			if (!user.timezone || user.timezone === "ampm") {
				user.timezone = "America/Los_Angeles";
				user.integrations.Acuity.userDetails.timezone = "America/Los_Angeles";
			}

			//set default values
			user.nextMorningBriefDate = moment().tz(user.timezone).hours(ZoiConfig.times.defaultMorningBriefHours).minutes(0).add(1, 'days').valueOf();
			user.nextOldCustomersDate = moment().tz(user.timezone).hours(ZoiConfig.times.defaultOldCustomersHours).minutes(0).add(1, 'days').valueOf();

			//save user with the integration
			await self.DBManager.saveUser(user);

			//redirect the user to his integrations page
			callback(302, {'location': `${ZoiConfig.clientUrl}/integrations?userId=${userId}&skipExtension=true`});

			const acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			const targetUrl = ZoiConfig.serverUrl + "/acuity/webhook/" + userId + "/scheduled";
			//register for Acuity webhooks
			const options = {
				method: 'POST',
				body: {
					event: "appointment.scheduled",
					target: targetUrl.replace(":3000", "") //we want to listen on 443 due to Acuity rules
				}
			};

			const response = await acuityApi.setWebhooks(options);

			//proceed after user integrated for the first time only(if integrated more than once - skip it)
			if (!isAlreadyConnectedWithAcuity) {

				MyLog.log("Integrated with Acuity successfully");
				MyLog.log(response);

				//save the last message time
				user.lastMessageTime = new Date().valueOf();

				//start the conversation in the welcomeLogic class
				const welcomeLogic = new WelcomeLogic(user, {
					intent: "welcome acuity integrated",
					context: "WELCOME",
					setDelay: true
				});

				welcomeLogic.processIntent();

			} else {
				MyLog.log("Already integrated with Acuity");
			}
		} catch (err) {
			callback(Response.ERROR, err);
			MyLog.error("Failed to integrate with Acuity", err);
		}

	}

	/**
	 * unsubscribe from zoi emails
	 * @param data
	 * @param callback
	 */
	async unsubscribe(data, callback) {

		const self = this;

		try {
			//unsubscribe for 20 years :)
			let unsubscribeDate = moment().add(20, 'years').valueOf();

			await self.DBManager.addEmailToUnsubscribe({_id: data.email, blockDate: unsubscribeDate});

			callback(Response.SUCCESS, "Successfully unsubscribed\n" + data.email);
		} catch (err) {
			callback(Response.ERROR, err);
			MyLog.error("Failed to unsubscribe", err);
		}
	}

	/**
	 * send integration reminder
	 * @param data
	 * @param bot
	 * @param callback
	 */
	async sendIntegrationReminder(data, bot, callback) {

		try {
			if (data.token === ZoiConfig.adminToken) {

				//get the users that should get the reminder
				let usersToRemind = await this.DBManager.getUsers({
					$and: [{
						conversationData: {
							$eq: null
						}
					}, {
						$or: [
							{
								lastMessageTime: {
									$lt: new Date().valueOf() - (data.days * ZoiConfig.times.oneDay)
								}
							}
							, {
								lastMessageTime: {
									$eq: null
								}
							}
						]
					}]
				});

				let sentCounter = 0;

				//iterate the users that should get the reminder
				usersToRemind.forEach(async (user) => {

					//send only if there is no integration with acuity
					if (!user.integrations || !user.integrations.Acuity) {

						sentCounter++;

						//get sendMessage function
						const sendMessage = bot.getBotReplyFunction(user);

						//create the redirect url
						const acuity = Acuity.oauth(ZoiConfig.ACUITY_OAUTH);
						const redirectUrl = acuity.getAuthorizeUrl({scope: 'api-v1', state: user._id});

						//set last message time
						user.lastMessageTime = new Date().valueOf();

						//save the user
						await this.DBManager.saveUser(user);

						//send the reminder
						sendMessage((facebookResponse.getButtonMessage("Hey boss! I noticed you forgot to integrate with your Acuity account. Click on this button for start working together! :)", [
							facebookResponse.getGenericButton("web_url", "Acuity Integration", null, redirectUrl, null)
						])));
					}
				});

				MyLog.info(`Reminders sent to ${sentCounter} users`);
				callback(Response.SUCCESS, {message: `Reminders sent to ${sentCounter} users`})

			} else {
				MyLog.error("Error on sendIntegrationReminder - Auth Error");
				callback(Response.ERROR, "Auth Error");
			}

		} catch (err) {
			MyLog.error(err);
			callback(Response.ERROR, err);
		}

	}
}

module.exports = AcuityLogic;