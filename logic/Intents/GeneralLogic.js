/**
 * Created by Yair on 6/20/2017.
 */
const ConversationLogic = require('../ConversationLogic');
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const GmailLogic = require('../GmailLogic');
const AppointmentLogic = require('./AppointmentLogic');
const _ = require('underscore');
const ZoiConfig = require('../../config');
const RssLogic = require('../RssLogic');
const FacebookLogic = require('../FacebookLogic');
const LinkShortner = require('../LinkShortnerLogic');

const delayTime = ZoiConfig.delayTime;
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

class GeneralLogic extends ConversationLogic {

	constructor(user, conversationData) {
		super(user, conversationData);
	}

	/**
	 * process the user input
	 */
	async processIntent() {

		switch (this.conversationData.intent) {
			case "general no thanks":
				await this.clearConversation();
				break;
			case "general bye zoi":
				await this.clearConversation();
				break;
			case "general leave review":
				await this.wishZoiConvoManager();
				break;
			case "general suggest idea":
				await this.wishZoiConvoManager();
				break;
			case "general morning brief":
				await this.morningBriefConvoManager();
				break;
			case "general suggest to post article":
				await this.articleToPostConvo();
				break;
			default:
				await this.sendSingleMessage(fallbackText);
				break;
		}
	}

	/**
	 * start article to post convo
	 */
	async articleToPostConvo() {

		const {user} = this;

		try {

			await this.botTyping();
			//get the next state he wants to go
			const nextState = this.getNextState();
			//set the state he wants to be to his current state
			this.setCurrentState(nextState);

			//check that facebook conversations are allowed
			if (this.isValidFacebookRequest()) {
				if (!user.conversationData) {
					await this.suggestToPostArticle();
				} else if (nextState === "suggestRandomArticle") {
					await this.suggestRandomArticle();
				} else if (nextState === "showArticleOnClient") {
					await this.showArticleOnClient();
				} else if (nextState === "postArticleOnFacebook") {
					await this.postArticleOnFacebook();
				} else if (nextState === "dontPostArticleOnFacebook") {
					await this.dontPostArticleOnFacebook();
				}
			}
			return nextState;
		} catch (err) {
			MyLog.error("error on articleToPostConvo function", err);
			await this.sendSingleMessage(ZoiConfig.DEFAULT_ERROR_TEXT);
		}
	}

	/**
	 * start rss convo
	 */
	async suggestToPostArticle() {

		try {

			this.setNextAnswerState("qr");

			await this.sendMessagesV2([
				[facebookResponse.getQRElement("I think we should post a really good article, what do you say champ?", [
					facebookResponse.getQRButton('text', "Let's choose!", {nextState: "suggestRandomArticle"}),
					facebookResponse.getQRButton('text', "Maybe later", {nextState: "stopConvo"})
				])]
			]);

			return MyUtils.SUCCESS;
		} catch (err) {
			await this.clearConversation();
			MyLog.error("Failed to suggest to post article", err);
			await this.sendSingleMessage("I can't load articles for now. I will fix it and I will talk to you later. :)");
			return MyUtils.ERROR;
		}
	}

	/**
	 * suggest to post some article from rss list
	 */
	async suggestRandomArticle() {

		const {user} = this;

		try {

			this.setNextAnswerState("payload");

			const articlesToSuggest = await RssLogic.getRandomArticles(user.category, user.keyWords, 4);

			if (!articlesToSuggest) {
				throw new Error();
			}

			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("Pick one of these articles, keep your customers in mind:")],
				[facebookResponse.getGenericTemplate(GeneralLogic.getArticlesButtons(articlesToSuggest))]
			]);

			return MyUtils.SUCCESS;

		} catch (err) {

			await this.clearConversation();
			MyLog.error("Failed to suggest random articles", err);
			await this.sendSingleMessage("I can't load articles for now. I will fix it and I will talk to you later. :)");
			return MyUtils.ERROR;
		}
	}

	/**
	 * get facebook json object with article buttons parsed
	 * @param articles
	 */
	static getArticlesButtons(articles) {
		return articles.map((article) => {
			return facebookResponse.getGenericElement(article.title,
				article.image,
				article.description,
				[
					facebookResponse.getGenericButton("web_url", "Open Article", null, article.link, null, false),
					facebookResponse.getGenericButton("postback", "I like it!", {
						link: article.link,
						title: article.title,
						nextState: "showArticleOnClient"
					})
				]);
		});
	}

	/**
	 * watch the selected article on client and approve it
	 * @returns {Promise.<*>}
	 */
	async showArticleOnClient() {

		const {user, conversationData} = this;

		const selectedArticle = JSON.parse(conversationData.input);

		this.setNextAnswerState("webview");

		const selectedArticleOpenGraphResult = await RssLogic.getOpenGraphResult(selectedArticle.link);

		//save the article to session
		user.session = {
			selectedArticle: {
				image: selectedArticleOpenGraphResult.ogImage.url,
				title: selectedArticleOpenGraphResult.ogTitle,
				link: selectedArticle.link
			}
		};

		await this.sendMessagesV2([
			[facebookResponse.getButtonMessage("I need you to take a look before I post:", [
				facebookResponse.getGenericButton("web_url", "Content Preview", null, ZoiConfig.clientUrl + "/content-preview?userId=" + user._id, "tall")
			])]
		]);

		return MyUtils.SUCCESS;

	}

	/**
	 * post the article on facebook page
	 */
	async postArticleOnFacebook() {

		const {user, conversationData} = this;

		const selectedArticle = conversationData.payload;

		//save the link to zoi shortner
		const linkId = await LinkShortner.saveLink(selectedArticle.link);

		//start posting on user's pages
		user.integrations.Facebook.pages
			.filter(page => page.isEnabled)
			.forEach(async (page) => {
				try {
					await FacebookLogic.postContentOnFacebookPage(page.id, {
						access_token: page.access_token,
						message: selectedArticle.title,
						link: `${ZoiConfig.shortnerUrl}/${linkId}`
					});
				} catch (err) {
					MyLog.error("Error from facebook when posting an article", err);
					return MyUtils.ERROR;
				}
			});

		//clear convo
		await this.clearConversation();

		await this.sendMessagesV2([
			[facebookResponse.getTextMessage("Wheehee!!! I posted on your Facebook page :) we should do that at least twice a week."), delayTime * 2]
		]);

		//finish onboarding if needed to
		if (!user.isOnBoarded) {
			await this.finishOnBoarding(true);
		}

		return MyUtils.SUCCESS;

	}

	/**
	 * dont post article on facebook
	 * @returns {Promise.<string>}
	 */
	async dontPostArticleOnFacebook() {

		await this.clearConversation(false);
		await this.sendSingleMessage("Ok boss! I didn't post it.");

		return "contentAborted";
	}

	/**
	 * send morning brief
	 */
	async morningBriefConvoManager() {

		const {user, conversationData} = this;

		try {
			await this.botTyping();
			//get next state
			const nextState = this.getNextState();

			//if the morning brief sent from the interval and not launched by the user
			if (!user.conversationData && conversationData.isAutomated) {
				await this.suggestMorningBrief();
			} else {
				await this.sendMorningBrief();
			}
		} catch (err) {
			MyLog.error("morning brief. userId => " + user._id);
			MyLog.error(err);
		}
	};

	/**
	 * suggest morning brief to the user
	 */
	async suggestMorningBrief() {

		this.setNextAnswerState("qr");

		//save the response
		const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("Hey boss! Are you ready for your morning brief?", [
			facebookResponse.getQRButton('text', 'Yes!', {nextState: "sendMorningBrief"}),
			facebookResponse.getQRButton('text', 'No', {nextState: "stopConvo"})
		]));

		//send the message
		await this.sendMessagesV2([[lastQRResponse]]);
	}

	/**
	 * send the morning brief
	 */
	async sendMorningBrief() {

		const {user} = this;

		//clean the user conversation
		user.conversationData = null;

		//if user integrated with Gmail
		if (user.isGmailIntegrated) {

			let tokens = user.integrations.Gmail;

			//get business customers
			let clients = await this.acuityLogic.getClients();

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
				await this.sendMessagesV2([
					[facebookResponse.getButtonMessage("You have " + clientsMessages.length + " unread emails from your customers within the last 7 days", [
						facebookResponse.getGenericButton("web_url", "Customers Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + user._id, null)
					])],
				]);
			} else {
				await this.sendMessagesV2([
					[facebookResponse.getTextMessage("You have read all the emails received from your customers. Good job! 👍")]
				]);
			}
		}
		//get appointments for today
		let appointments = await this.acuityLogic.getAppointments({
			minDate: MyUtils.convertToAcuityDate(moment().tz(user.timezone).startOf('day')),
			maxDate: MyUtils.convertToAcuityDate(moment().tz(user.timezone).endOf('day'))
		});

		const newConversationData = {
			intent: "appointment send promotions",
			context: "APPOINTMENT",
			skipHey: true
		};
		const appointmentLogic = new AppointmentLogic(user, newConversationData);

		//if there are appointments
		if (appointments.length) {

			//sort appointments
			appointments.sort(function (q1, q2) {
				if (moment(q1.datetime).tz(user.integrations.Acuity.userDetails.timezone).isAfter(moment(q2.datetime).tz(user.integrations.Acuity.userDetails.timezone))) {
					return 1;
				} else {
					return -1;
				}
			});

			//get the next appointment
			let nextAppointment;

			appointments.forEach(function (appointment) {
				if (!nextAppointment && moment(appointment.datetime).tz(user.integrations.Acuity.userDetails.timezone).isAfter(moment().tz(user.integrations.Acuity.userDetails.timezone))) {
					nextAppointment = appointment;
				}
			});

			let messages = [
				[facebookResponse.getButtonMessage("You have " + appointments.length + " appointments today", [
					facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, null)
				])]
			];

			//if there is next appointment - add another message about it.
			if (nextAppointment) {
				messages.push([facebookResponse.getTextMessage("Your next appointment is at " + nextAppointment.time + " with " + nextAppointment.firstName + " " + nextAppointment.lastName)]);
			}

			await this.sendMessagesV2(messages);
		}
		//if there are no appointments
		else {
			await this.sendSingleMessage("You don't have appointments today");
		}

		//proceed to promotions
		await appointmentLogic.processIntent();
	}

	/**
	 * send morning brief
	 */
	async wishZoiConvoManager() {

		const {user, conversationData} = this;

		try {

			const nextState = this.getNextState();

			//if this is the start of the conversation
			if (!user.conversationData) {

				this.setNextAnswerState("text");
				user.nextState = "saveReview";

				await this.sendSingleMessage("What do you wish I would do for you in the future?");

			} else if (nextState === "saveReview") {

				//save the review
				user.wishList.push(conversationData.input);

				//clear the session
				await this.clearConversation(false);

				await this.sendSingleMessage("Thank you for helping me become an even greater assistant!");
			}
		} catch (err) {
			MyLog.error(err);
		}
	};
}


module.exports = GeneralLogic;