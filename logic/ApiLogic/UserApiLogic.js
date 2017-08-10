/**
 * Created by Yair on 7/4/2017.
 */
const MyLog = require('../../interfaces/MyLog');
const moment = require('moment');

function UserApiLogic() {
	this.DBManager = require('../../dal/DBManager');
}

/**
 * get user by facebook id
 * @param userId
 * @param callback
 */
UserApiLogic.prototype.getUser = async function (userId, callback) {

	let self = this;

	try {
		//get the user
		let user = await self.DBManager.getUser({_id: userId});

		if (user) {
			callback(200, user);
		} else {
			callback(404, "NO_SUCH_USER");
		}

	} catch (err) {
		MyLog.error(err);
		MyLog.error("Failed to get user by facebook id");
		callback(404, err);
	}
};

/**
 * save user
 * @param user
 * @param callback
 */
UserApiLogic.prototype.saveUser = async function (user, callback) {

	let self = this;

	try {
		//calculate morning brief if the user set it
		if (user.morningBriefTime && typeof(user.morningBriefTime) === "number") {

			//convert the user selected time to server timezone
			let morningBriefTime = moment(user.morningBriefTime).tz(user.integrations.Acuity.userDetails.timezone);

			//if the time is before now - get future time
			if (morningBriefTime.isBefore(moment().tz(user.integrations.Acuity.userDetails.timezone))) {
				morningBriefTime = moment(user.morningBriefTime).tz(user.integrations.Acuity.userDetails.timezone).add(1, 'days');
			}

			//set next morning brief time
			user.nextMorningBriefDate = morningBriefTime.valueOf();
			//set static morning brief time as string
			user.morningBriefTime = morningBriefTime.format("HH:mm");
		}

		//get the user
		let savedUser = await self.DBManager.saveUser(user);
		callback(200, savedUser);
	} catch (err) {
		MyLog.error(err);
		MyLog.error("Failed to save user");
		callback(404, err);
	}

};

// /**
//  * get promotion types
//  * @param callback
//  */
// UserApiLogic.prototype.getPromotionTypes = function (callback) {
// 	var self = this;
//
// 	self.DBManager.getPromotionsTypes().then(function (promotionTypes) {
// 		callback(200, promotionTypes);
// 	});
// };
//
// UserApiLogic.prototype.setPromotionType = function (promotionType, callback) {
// 	var self = this;
//
// 	self.DBManager.addPromotionsType(promotionType).then(function () {
// 		callback(200, "Success");
// 	}).catch(function () {
// 		callback(400, "Error");
// 	});
// };

module.exports = UserApiLogic;