const ZoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');
const ogs = require('open-graph-scraper');
const requestify = require('requestify');
const DBManager = require('../dal/DBManager');

class LinkShortnerLogic {

	static async saveLink(url) {

		try {

			const randomId = MyUtils.generateRandomString(6);

			const link = await DBManager.saveLink({_id: randomId, url: url});

			return randomId;
		} catch (err) {
			MyLog.error("Failed to save link", err);
			return MyUtils.ERROR;
		}
	}

	/**
	 * get link by id
	 * @param id
	 * @returns {Promise.<*>}
	 */
	static async getLink(id, toRedirect = true) {

		try {

			const requestedLink = await DBManager.getLinkById(id);

			//increase the number of openings
			requestedLink.numOfOpenings += 1;
			DBManager.saveLink(requestedLink);

			if (toRedirect) {
				return {status: 302, data: {'location': requestedLink.url}};
			} else {
				return {status: 200, data: requestedLink.url};
			}

		} catch (err) {
			MyLog.error("Failed to get link", err);
			return {status: 400, message: "Can't find the requested link"};
		}

	}

}

module.exports = LinkShortnerLogic;