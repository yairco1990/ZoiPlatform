/**
 * Created by Yair on 7/4/2017.
 */
const MyUtils = require('../../interfaces/utils');
const MyLog = require('../../interfaces/MyLog');
const moment = require('moment-timezone');
const ListenLogic = require('../Listeners/ListenLogic');
const zoiBot = require('../../bot/ZoiBot');
const DefaultUserModel = require('../../interfaces/DefaultModels/DefaultUser');
const deepcopy = require('deepcopy');
const FacebookLogic = require('../../logic/FacebookLogic');

function UserApiLogic() {
	this.DBManager = require('../../dal/DBManager');
}

const Response = {
	SUCCESS: 200,
	ERROR: 400,
	NOT_FOUND: 404
};

/**
 * create new user (called after login with facebook outside of the messenger)
 * @param userData
 */
UserApiLogic.prototype.createUser = async function (userData) {
	const self = this;

	try {

		let user = await self.DBManager.getUserByFacebookId(userData.userID, false);

		//if user doesn't exist - create it.
		if (!user || !user._id) {
			user = deepcopy(DefaultUserModel);
			user.facebookUserId = userData.userID;
			user.campaignData = userData.campaignData;
			user._id = MyUtils.generateUUID();

			await self.DBManager.saveUser(user);
		}

		const {status} = await FacebookLogic.addFacebookIntegration(user._id, userData);

		if (status !== Response.SUCCESS) {
			throw new Error("Failed to add facebook integration");
		}

		return {status: Response.SUCCESS, data: user};

	} catch (err) {
		return {status: Response.ERROR, message: "Error on creating new user"};
	}
};

/**
 * get user by id
 * @param userId - can be or pageUserId or userId.
 */
UserApiLogic.prototype.getUserById = async function (userId) {
	if (MyUtils.isUUID(userId)) {
		return await this.getUser({_id: userId});
	} else {
		return await this.getUser({pageUserId: userId});
	}
};

/**
 * get user by facebook id
 * @param userId
 */
UserApiLogic.prototype.getUser = async function (where) {

	const self = this;

	try {
		//get the user
		const user = await self.DBManager.getUser(where);

		//delete sensitive information
		if (user.isAcuityIntegrated) {
			delete user.integrations.Acuity.accessToken;
			delete user.integrations.Acuity.userDetails.accessToken;
		}
		if (user.isGmailIntegrated) {
			delete user.integrations.Gmail;
			user.integrations.Gmail = true;
		}
		if (user.isFacebookIntegrated) {

			//copy the facebook pages to user
			if (user.integrations.Facebook.pages) {
				user._doc.facebookPages = user.integrations.Facebook.pages.map(({name, id, isEnabled}) => {
					return {name, id, isEnabled};
				});
			}

			delete user.integrations.Facebook;
			user.integrations.Facebook = true;
		}

		if (user) {
			return {status: Response.SUCCESS, data: user};
		} else {
			return {status: Response.NOT_FOUND, data: "NO_SUCH_USER"};
		}

	} catch (err) {
		MyLog.error(`Failed to get user by facebook id -> ${where}`, err);
		return {status: Response.NOT_FOUND, data: err};
	}
};

/**
 * save user
 * @param savedUser
 */
UserApiLogic.prototype.saveUser = async function (savedUser) {

	const self = this;

	try {

		const oldUser = await self.DBManager.getUser({_id: savedUser._id});

		//get bot functions
		const reply = zoiBot.getBotReplyFunction(savedUser);
		const botTyping = zoiBot.getBotWritingFunction(savedUser);

		let isFacebookPagesEnables = false;

		//return sensitive information
		if (oldUser.integrations.Acuity) {
			savedUser.integrations.Acuity.accessToken = oldUser.integrations.Acuity.accessToken;
			savedUser.integrations.Acuity.userDetails.accessToken = savedUser.integrations.Acuity.userDetails.accessToken;
		}
		if (oldUser.integrations.Gmail) {
			savedUser.integrations.Gmail = oldUser.integrations.Gmail;
		}
		if (oldUser.integrations.Facebook) {
			savedUser.integrations.Facebook = oldUser.integrations.Facebook;

			const savedUserPagesLength = MyUtils.nestedValue(savedUser, "facebookPages.length");
			const oldUserPagesLength = MyUtils.nestedValue(oldUser, "integrations.Facebook.pages.length");

			//save the enables facebook pages
			if (savedUserPagesLength && oldUserPagesLength) {

				//get old and saved user enabled pages length
				const oldUserEnabledPagesLength = MyUtils.nestedValue(oldUser, "integrations.Facebook.pages")
					.filter(page => page.isEnabled)
					.length;

				const savedUserEnabledPagesLength = MyUtils.nestedValue(savedUser, "facebookPages")
					.filter(page => page.isEnabled)
					.length;

				savedUser.facebookPages.forEach((clientPage) => {
					const serverSelectedPage = oldUser.integrations.Facebook.pages.find(serverPage => clientPage.id === serverPage.id);
					serverSelectedPage.isEnabled = clientPage.isEnabled;
				});

				isFacebookPagesEnables = savedUserEnabledPagesLength > 0 && oldUserEnabledPagesLength === 0;
			}

			delete savedUser.facebookPages;
		}

		//calculate morning brief if the user set it
		if (savedUser.morningBriefTime && typeof(savedUser.morningBriefTime) === "number") {

			//convert the user selected time to server timezone
			let morningBriefTime = moment(savedUser.morningBriefTime).tz(savedUser.integrations.Acuity.userDetails.timezone);

			//if the time is before now - get future time
			if (morningBriefTime.isBefore(moment().tz(savedUser.integrations.Acuity.userDetails.timezone))) {
				morningBriefTime = moment(savedUser.morningBriefTime).tz(savedUser.integrations.Acuity.userDetails.timezone).add(1, 'days');
			}

			//set next morning brief time
			savedUser.nextMorningBriefDate = morningBriefTime.valueOf();
			//set static morning brief time as string
			savedUser.morningBriefTime = morningBriefTime.format("HH:mm");
		}

		//save the user
		await self.DBManager.saveUser(savedUser);

		//get the updated user
		const userResult = await self.getUserById(savedUser._id);

		//if user set pages enabled - start rss convo
		if (isFacebookPagesEnables && !userResult.conversationData) {
			const listenLogic = new ListenLogic();
			listenLogic.processInput("f:rss", {sender: {id: savedUser.pageUserId}}, botTyping, reply);
		}

		return {status: Response.SUCCESS, data: userResult.data};
	} catch (err) {
		MyLog.error("Failed to save user", err);
		return {status: Response.NOT_FOUND, data: err};
	}

};

module.exports = UserApiLogic;