/**
 * Created by Yair on 7/4/2017.
 */
const Util = require('util');
const moment = require('moment');

function UserApiLogic() {
	this.DBManager = require('../../dal/DBManager');
}

/**
 * get user by facebook id
 * @param userId
 * @param callback
 */
UserApiLogic.prototype.getUser = function (userId, callback) {

	let self = this;

	//get the user
	self.DBManager.getUser({_id: userId}).then(function (user) {

		if (user) {
			callback(200, user);
		} else {
			callback(404, "NO_SUCH_USER");
		}

	}).catch(function (err) {
		Util.log(err);
		Util.log("Failed to get user by facebook id");

		callback(404, err);
	});
};

/**
 * save user
 * @param user
 * @param callback
 */
UserApiLogic.prototype.saveUser = function (user, callback) {

	let self = this;

	//calculate morning brief if the user set it
	if (user.morningBriefTime && typeof(user.morningBriefTime) === "number") {

		let morningBriefTime = moment(user.morningBriefTime);

		//if the time is before now - get future time
		if (morningBriefTime.isBefore(moment())) {
			morningBriefTime = moment(user.morningBriefTime).add(1, 'days');
		}

		//set next morning brief time
		user.nextMorningBriefDate = morningBriefTime.valueOf();
		//set static morning brief time as string
		user.morningBriefTime = morningBriefTime.format("HH:mm");
	}

	//get the user
	self.DBManager.saveUser(user).then(function (user) {
		callback(200, user);
	}).catch(function (err) {
		Util.log(err);
		Util.log("Failed to save user");
		callback(404, err);
	});
};

/**
 * get promotion types
 * @param callback
 */
UserApiLogic.prototype.getPromotionTypes = function (callback) {
	var self = this;

	self.DBManager.getPromotionsTypes().then(function (promotionTypes) {
		callback(200, promotionTypes);
	});
};

UserApiLogic.prototype.setPromotionType = function (promotionType, callback) {
	var self = this;

	self.DBManager.addPromotionsType(promotionType).then(function () {
		callback(200, "Success");
	}).catch(function () {
		callback(400, "Error");
	});
};

module.exports = UserApiLogic;