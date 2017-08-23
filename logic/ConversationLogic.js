const MyUtils = require('../interfaces/utils');
const MyLog = require('../interfaces/MyLog');
const FacebookResponse = require('../interfaces/FacebookResponse');
const ZoiConfig = require('../config');

class ConversationLogic {

	constructor(user) {
		this.user = user;
		this.DBManager = require('../dal/DBManager');
	}

	clearConversation(reply, sendLastMessage) {
		let self = this;
		let user = self.user;

		user.conversationData = null;
		user.session = null;
		self.DBManager.saveUser(user).then(function () {
			if (sendLastMessage) {
				(MyUtils.resolveMessage(reply, FacebookResponse.getTextMessage("I'll be right here if you need me ☺"), false, ZoiConfig.delayTime))();
			}
		});
	};

	getStatsMessage() {

		let self = this;
		let user = self.user;

		let currentMonth = moment().tz(user.integrations.Acuity.userDetails.timezone).format("YYYY/MM");

		//get stats of current month
		let stats = user.profile[currentMonth];

		let relevantMessages = [];

		//if there are stats this month
		if (stats) {

			//if there are profits
			if (stats.numOfAppointments > 1) {
				relevantMessages.push("We are on the right track! 🏆 I booked " + stats.numOfAppointments + " meetings for you this month. Working with you is great 😍");
				relevantMessages.push("Yeah! Together we booked " + stats.numOfAppointments + " appointments this month! Big 👍,  boss!");
				relevantMessages.push("Guess what... We already booked " + stats.numOfAppointments + " this month! We are a great team 👊");
			}

			if (stats.profitFromAppointments) {
				let profit = stats.profitFromAppointments + " " + user.integrations.Acuity.userDetails.currency;
				relevantMessages.push("Dollar, Dollar Bills... 💵 We earned " + profit + " this month, amazing work boss");
				relevantMessages.push("Now that's progress, we earned " + profit + " from the beginning of the month!");
				relevantMessages.push("Boss, we maid " + profit + " this month, I think it's just great! 🤗");
			}

			if (stats.numOfPromotions) {
				relevantMessages.push("Cool, I sent " + stats.numOfPromotions + " promotions for you this month! We will see results in no time 😀");
				relevantMessages.push("We built and sent " + stats.numOfPromotions + " promotions this month👌, I'm going to work on some more, talk to you soon...");
				relevantMessages.push("By now, we sent " + stats.numOfPromotions + " promotions, I knew we are going to hit it off 😘");
			}

		} else {//no stats
			relevantMessages.push("Hey, you know that I'm here if you need me 👋👋👋");
			relevantMessages.push("Boss, I'm here just for you, ping me if you need something!");
		}

		return MyUtils.getRandomValueFromArray(relevantMessages);
	};
}

module.exports = ConversationLogic;