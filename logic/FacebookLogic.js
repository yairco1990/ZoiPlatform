const graph = require('fbgraph');
const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const request = require('request');
const deepCopy = require('deepcopy');
const DefaultUserModel = require('../interfaces/DefaultModels/DefaultUser');

class FacebookLogic {

	/**
	 * add facebook integration to the user object
	 * @param userId
	 * @param authResponse
	 */
	static async addFacebookIntegration(userId, authResponse) {

		try {

			//get long token
			const longTermUserAuth = await FacebookLogic.extendAccessToken(authResponse.accessToken);

			//get the user
			const user = await DBManager.getUserById(userId);

			//if this is a new user
			if (!user) {
				//create default user with default parameters
				const newUser = deepCopy(DefaultUserModel);
				newUser._id = userId;
				newUser.fullname = displayName;
				newUser.conversationData = conversationData;

				await DBManager.saveUser(newUser);
			}

			//set the facebook integration to the user
			user.integrations.Facebook = longTermUserAuth;

			//get pages details
			const pagesResult = await MyUtils.makeRequest("GET", MyUtils.addParamsToUrl("https://graph.facebook.com/me/accounts", {access_token: authResponse.accessToken}));

			if (pagesResult && pagesResult.data) {
				user.integrations.Facebook.pages = pagesResult.data;

				//extend tokens for all pages TODO move it to promise.all
				for (let page of user.integrations.Facebook.pages) {
					const tokenObject = await FacebookLogic.extendAccessToken(page.access_token);
					page.access_token = tokenObject.access_token;
					//if there is only one page - make it enabled by default.
					page.isEnabled = user.integrations.Facebook.pages.length === 1 || false;
				}
			}

			//save user
			await DBManager.saveUser(user);

			return {status: 200, message: "integrated successfully with Facebook"};

		} catch (err) {
			MyLog.error("Failed to integrate with Facebook", err);
		}
	}


	/**
	 * post content on facebook page
	 * @param pageId
	 * @param payload
	 */
	static async postContentOnFacebookPage(pageId, payload) {

		return new Promise(async (resolve, reject) => {
			request({
				method: 'POST',
				url: `https://graph.facebook.com/v2.9/${pageId}/feed`,
				formData: payload
			}, function (err, response, body) {
				if (err) {
					return reject(err);
				}
				body = JSON.parse(body);
				if (body.error) {
					return reject(body.error);
				}
				MyLog.log(`Posted feed successfully on page ${pageId}`);
				resolve(body);
			});
		});

	}


	/**
	 * post content on user's facebook pages
	 * @param user
	 * @param payload
	 */
	static postContentOnUserPages(user, payload) {

		//post on facebook page
		user.integrations.Facebook.pages
			.filter(page => page.isEnabled)
			.forEach(async page => {
				try {
					payload.access_token = page.access_token;
					await FacebookLogic.postContentOnFacebookPage(page.id, payload)
				} catch (err) {
					MyLog.error(err);
				}
			});

		return "contentPosted";
	}


	/**
	 * post on facebook page
	 * @param pageId
	 * @param payload
	 */
	static async postPhotoOnFacebookPage(pageId, payload) {

		return new Promise(async (resolve, reject) => {
			request({
				method: 'POST',
				url: `https://graph.facebook.com/v2.9/${pageId}/photos`,
				formData: payload
			}, function (err, response, body) {
				if (err) {
					return reject(err);
				}
				body = JSON.parse(body);
				MyLog.log(`Posted photo successfully on page ${pageId}`);
				resolve(body);
			});
		});
	}

	/**
	 * post content on user's facebook pages
	 * @param user
	 * @param payload
	 */
	static postPhotoOnUserPages(user, payload) {

		//post on facebook page
		user.integrations.Facebook.pages
			.filter(page => page.isEnabled)
			.forEach(page => {
				try {
					payload.access_token = page.access_token;
					FacebookLogic.postPhotoOnFacebookPage(page.id, payload)
				} catch (err) {
					MyLog.error(err);
				}
			});

		return "photoPosted";
	}

	/**
	 * extend the access token
	 * @param accessToken
	 * @returns {Promise}
	 */
	static extendAccessToken(accessToken) {
		return new Promise((resolve, reject) => {
			graph.extendAccessToken({
				"access_token": accessToken,
				"client_id": ZoiConfig.appId,
				"client_secret": ZoiConfig.appSecret
			}, function (err, facebookResponse) {
				if (err) {
					return reject(err);
				}
				resolve(facebookResponse);
			});
		});
	}
}

module.exports = FacebookLogic;