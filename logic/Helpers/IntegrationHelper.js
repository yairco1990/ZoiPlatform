const MyUtils = require('../../interfaces/utils');

const SYSTEMS = {
	ACUITY: "Acuity Scheduling",
	GMAIL: "Gmail",
	FACEBOOK: "Facebook"
};

const intentions = {
	"general morning brief": {
		$must: {
			$and: [SYSTEMS.ACUITY]
		}
	},
	// "general suggest to post article": {
	// 	$must: {
	// 		$and: [SYSTEMS.FACEBOOK]
	// 	}
	// },
	"appointment what is my schedule": {
		$must: {
			$and: [SYSTEMS.ACUITY]
		}
	},
	"appointment show my schedule": {
		$must: {
			$and: [SYSTEMS.ACUITY]
		}
	},
	"appointment send promotions": {
		$must: {
			$or: [SYSTEMS.ACUITY, SYSTEMS.FACEBOOK]
		}
	},
	"client old customers": {
		$must: {
			$and: [SYSTEMS.ACUITY]
		}
	},
	"client new customer join": {
		$must: {
			$and: [SYSTEMS.ACUITY]
		}
	},
	"generic unread emails": {
		$must: {
			$and: [SYSTEMS.GMAIL, SYSTEMS.ACUITY]
		}
	},
	"test": {
		$must: {
			$and: [SYSTEMS.GMAIL],
			$or: [SYSTEMS.ACUITY, SYSTEMS.FACEBOOK]
		}
	}
};

class IntegrationHelper {

	/**
	 * return if there are missing integrations
	 * @param user
	 * @param intention
	 * @returns {boolean}
	 */
	static areThereMissingIntegrations(user, intention) {
		return IntegrationHelper.getMissingIntegrations(user, intention).length > 0;
	}

	/**
	 * get the user missing integration text
	 * @param intention
	 * @param user
	 */
	static getMissingIntegrationsText(user, intention) {

		const missingIntegrations = IntegrationHelper.getMissingIntegrations(user, intention);

		return MyUtils.printArrWithCommas(missingIntegrations);
	}

	/**
	 * get the missing integration
	 * @param intention
	 * @param user
	 */
	static getMissingIntegrations(user, intention) {

		//get user integrations
		const userIntegrations = IntegrationHelper.getUserIntegrations(user);

		//get intent integrations
		const intentIntegrations = intentions[intention];

		//init missing integrations
		const missingIntegrations = [];

		if (intentIntegrations && intentIntegrations.$must) {
			//over and integrations
			if (intentIntegrations.$must.$and) {
				intentIntegrations.$must.$and.forEach(integrationName => {
					//if the integration missing in the user integrations
					if (userIntegrations.indexOf(integrationName) === -1) {
						missingIntegrations.push(integrationName);
					}
				});
			}

			//over or integrations
			if (intentIntegrations.$must.$or) {
				const numOfCommonIntegrations = intentIntegrations.$must.$or.filter(function (obj) {
					return userIntegrations.indexOf(obj) !== -1;
				}).length;
				if (!numOfCommonIntegrations) {
					missingIntegrations.push(...intentIntegrations.$must.$or);
				}
			}
		}

		return missingIntegrations;
	}

	/**
	 * get user integrations
	 * @param user
	 */
	static getUserIntegrations(user) {
		const integrations = [];
		if (user.isAcuityIntegrated) {
			integrations.push(SYSTEMS.ACUITY);
		}
		if (user.isGmailIntegrated) {
			integrations.push(SYSTEMS.GMAIL);
		}
		if (user.isFacebookIntegrated) {
			integrations.push(SYSTEMS.FACEBOOK);
		}
		return integrations;
	}
}

module.exports = IntegrationHelper;