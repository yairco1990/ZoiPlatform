/**
 * Created by Yair on 7/4/2017.
 */
const Util = require('util');

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

	//get the user
	self.DBManager.saveUser(user).then(function (user) {
		callback(200, user);
	}).catch(function (err) {
		Util.log(err);
		Util.log("Failed to save user");
		callback(404, err);
	});
};

module.exports = UserApiLogic;