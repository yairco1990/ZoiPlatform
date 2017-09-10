/**
 * Created by Yair on 6/20/2017.
 */
const ConversationLogic = require('../ConversationLogic');
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const GmailLogic = require('../GmailLogic');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const AppointmentLogic = require('./AppointmentLogic');
const _ = require('underscore');
const ZoiConfig = require('../../config');
const RssLogic = require('../RssLogic');
const FacebookLogic = require('../FacebookLogic');

const delayTime = ZoiConfig.delayTime;
const fallbackText = "I don't know what that means 😕, Please try to say it again in a different way. You can also try to use my preset actions in the menu.";

//QUESTIONS
const wishZoiQuestions = {
    writeReview: {
        id: 1
    }
};
const morningBriefQuestions = {
    areYouReady: {
        id: 1
    }
};
const suggestToPostQuestions = {
    suggestArticle: {
        id: "suggestArticle"
    }
};

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
                await this.wishZoi();
                break;
            case "general suggest idea":
                await this.wishZoi();
                break;
            case "general morning brief":
                await this.botTyping();
                await this.sendMorningBrief();
                break;
            case "general suggest to post article":
                await this.botTyping();
                await this.startArticleToPostConvo();
                break;
            default:
                this.reply(facebookResponse.getTextMessage(fallbackText));
                break;
        }
    }

    /**
     * start article to post convo
     */
    async startArticleToPostConvo() {

        const {user, conversationData, reply} = this;
        const lastQuestionId = this.getLastQuestionId();

        if (!user.conversationData) {
            await this.suggestRandomArticle();
        } else if (suggestToPostQuestions.suggestArticle.id === lastQuestionId) {
            await this.postArticleOnFacebook();
        }

        return MyUtils.SUCCESS;
    }

    /**
     * suggest to post some article from rss list
     */
    async suggestRandomArticle() {

        try {
            const {user, conversationData, reply} = this;

            this.setCurrentQuestion(suggestToPostQuestions.suggestArticle, "payload");

            const articlesToSuggest = await RssLogic.getRandomArticles(user.categories[0], user.keyWords, 4);

            await this.DBManager.saveUser(user);

            await this.sendMessages([
                MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's post some professional article on you facebook page"), true),
                MyUtils.resolveMessage(reply, facebookResponse.getGenericTemplate(GeneralLogic.getArticlesButtons(articlesToSuggest)), false, delayTime),
            ]);

            return MyUtils.SUCCESS;

        } catch (err) {

            MyLog.error("Failed to suggest random article", err);
            return MyUtils.ERROR;
        }
    }

    static getArticlesButtons(articles) {
        return articles.map((article) => {
            return facebookResponse.getGenericElement(article.title,
                article.image,
                article.description,
                [
                    facebookResponse.getGenericButton("web_url", "Open Article", null, article.link),
                    facebookResponse.getGenericButton("postback", "I like it!", {
                        link: article.link,
                        title: article.title
                    })
                ]);
        });
    }

    /**
     * post the article on facebook page
     */
    async postArticleOnFacebook() {

        try {
            const {user, conversationData, reply} = this;

            const selectedArticle = conversationData.payload;

            //start posting on user's pages
            user.integrations.Facebook.pages.forEach((page) => {
                FacebookLogic.postContentOnFacebookPage(page.id, {
                    access_token: page.access_token,
                    message: selectedArticle.title,
                    link: selectedArticle.link
                })
            });

            //clear convo
            await this.clearConversation();

            await this.sendMessages([
                MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I just posted the article! Moshe will give me some good text here..."), false)
            ]);

            return MyUtils.SUCCESS;
        } catch (err) {

            MyLog.error("Failed to post article on facebook page", err);
            return MyUtils.ERROR;
        }
    }

    /**
     * send morning brief
     */
    async sendMorningBrief() {

        const {user, conversationData, reply} = this;

        try {

            //check if the user wants to get the brief

            const acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);

            //if the morning brief sent from the interval and not by the user
            if (!user.conversationData && conversationData.isAutomated) {

                this.setCurrentQuestion(morningBriefQuestions.areYouReady);

                //save the response
                const lastQRResponse = facebookResponse.getQRElement("Hey boss! Are you ready for your morning brief?",
                    [
                        facebookResponse.getQRButton('text', 'Yes!', {id: 1}),
                        facebookResponse.getQRButton('text', 'No', {id: 2})
                    ]
                );
                user.conversationData.lastQRResponse = lastQRResponse;

                //save the user
                await this.DBManager.saveUser(user);

                //send the message
                reply(lastQRResponse, false);
            }
            //if the user ask for morning brief
            else {
                //check if we can proceed to the morning brief
                if (user.conversationData && user.conversationData.isAutomated) {
                    //check for valid payload
                    if (conversationData.payload) {
                        //if the payload is not the "yes" button
                        if (conversationData.payload.id !== 1) {
                            //clear the session
                            await this.clearConversation();
                            //send reply
                            reply(facebookResponse.getTextMessage("Ok boss! See you later :)"), false, ZoiConfig.times.wishZoiWillDelay);
                            //stop the convo
                            return "userQuitConvoProcess";
                        }
                    } else {
                        this.sendMessages([
                            MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Please let's finish what we started"), true, delayTime),
                            MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime)
                        ]);
                        //stop the convo
                        return "sendQRAgain";
                    }
                }

                //clean the user conversation
                user.conversationData = null;

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
                        await this.sendMessages([
                            MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("You have " + clientsMessages.length + " unread emails from your customers within the last 7 days", [
                                facebookResponse.getGenericButton("web_url", "Customers Emails", null, ZoiConfig.clientUrl + "/mail?userId=" + user._id, "full")
                            ]), true),
                        ]);
                    } else {
                        await this.sendMessages([
                            MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("You have read all the emails received from your customers. Good job! 👍"), true),
                        ]);
                    }
                }
                //get appointments for today
                let appointments = await acuityLogic.getAppointments({
                    minDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).startOf('day')),
                    maxDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).endOf('day'))
                });

                const newConversationData = {
                    intent: "appointment send promotions",
                    context: "APPOINTMENT",
                    skipHey: true
                };
                const appointmentLogic = new AppointmentLogic(user, newConversationData);

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

                    let messages = [MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("You have " + appointments.length + " appointments today", [
                        facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, "full")
                    ]), true, delayTime)];

                    //if there is next appointment - add another message about it.
                    if (nextAppointment) {
                        messages.push(MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Your next appointment is at " + nextAppointment.time + " with " + nextAppointment.firstName + " " + nextAppointment.lastName), true, delayTime));
                    }

                    await this.sendMessages(messages);

                    await appointmentLogic.processIntent();

                } else {

                    await this.sendMessages([MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("You don't have appointments today"), true, delayTime)]);

                    await appointmentLogic.processIntent();
                }
            }
        } catch (err) {
            MyLog.error("morning brief. userId => " + user._id);
            MyLog.error(err);
        }
    };

    /**
     * send morning brief
     */
    async wishZoi() {

        const {user, conversationData, reply} = this;

        try {
            //if this is the start of the conversation
            if (!user.conversationData) {
                //set current question
                this.setCurrentQuestion(wishZoiQuestions.writeReview, "text");

                //save the user
                await this.DBManager.saveUser(user);

                reply(facebookResponse.getTextMessage("What do you wish I would do for you in the future?"), false, ZoiConfig.times.wishZoiWillDelay);

            } else if (this.getLastQuestionId() === wishZoiQuestions.writeReview.id) {

                user.wishList.push(conversationData.input);

                //save the user
                await this.DBManager.saveUser(user);

                //send response
                reply(facebookResponse.getTextMessage("Thank you for helping me become an even greater assistant!"), false, ZoiConfig.times.wishZoiWillDelay);

                //clear the session
                await this.clearConversation(reply, false);
            }
        } catch (err) {
            MyLog.error(err);
        }
    };
}


module.exports = GeneralLogic;