const graph = require('fbgraph');
const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const request = require('request');

class FacebookLogic {

	/**
	 * add facebook integration to the user object
	 * @param userId
	 * @param authResponse
	 * @param callback
	 */
	static async addFacebookIntegration(userId, authResponse, callback) {

		try {

			//get long token
			const longTermUserAuth = await FacebookLogic.extendAccessToken(authResponse.accessToken);

			//get the user
			const user = await DBManager.getUserById(userId);

			//set the facebook integration to the user
			user.integrations.Facebook = longTermUserAuth;

			//get pages details
			const pagesResult = await MyUtils.makeRequest("GET", MyUtils.addParamsToUrl("https://graph.facebook.com/me/accounts", {access_token: authResponse.accessToken}));
			user.integrations.Facebook.pages = pagesResult.data;

			//extend tokens for all pages
			for (let page of user.integrations.Facebook.pages) {
				const tokenObject = await FacebookLogic.extendAccessToken(page.access_token);
				page.access_token = tokenObject.access_token;
			}

			//save user
			await DBManager.saveUser(user);

			callback(200, {message: "integrated successfully with Facebook"});

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