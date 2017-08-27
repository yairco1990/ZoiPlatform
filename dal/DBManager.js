/**
 * Created by Yair on 6/19/2017.
 */
const mongoose = require('mongoose');
const MyLog = require('../interfaces/MyLog');
const ZoiConfig = require('../config');

class DBManager {

	constructor() {

		const options = {
			useMongoClient: true
		};

		mongoose.connect(ZoiConfig.mongoUrl, options);

		let Schema = mongoose.Schema;

		let userSchema = new Schema({
			_id: String,
			fullname: String,
			email: String,
			conversationData: Object,
			session: Object,
			integrations: Object,
			metadata: Object,
			wishList: [String],
			profile: Object,
			startedAt: String,
			nextMorningBriefDate: Number,
			nextOldCustomersDate: Number,
			morningBriefTime: String,
			defaultCalendar: Object,
			promptNewCustomers: Boolean,
			customerSendLimit: Object,
			oldCustomersRange: Object,
			lastMessageTime: Number,
			timezone: String,
			isOnBoarded: Boolean
		}, {minimize: false});

		let blackListSchema = new Schema({
			_id: String,
			blockDate: Number,
			blockDateString: String
		});

		let inputsSchema = new Schema({
			_id: {
				type: Schema.ObjectId, default: function () {
					return new mongoose.Types.ObjectId()
				}
			},
			userId: String,
			input: String,
			intent: String,
			score: Number
		}, {minimize: false});

		let promotionTypesSchema = new Schema({
			_id: Number,
			name: String
		});

		this.User = mongoose.model('User', userSchema);
		this.BlackList = mongoose.model('BlackList', blackListSchema);
		this.Inputs = mongoose.model('Inputs', inputsSchema);
		this.PromotionTypes = mongoose.model('PromotionTypes', promotionTypesSchema);

		MyLog.log("DB synced");
	}

	/**
	 * get users
	 * @param where
	 */
	getUsers(where) {

		let self = this;

		return new Promise(function (resolve, reject) {
			self.User.find(where, function (err, users) {
				if (err) {
					reject(err);
				} else {
					resolve(users);
				}
			});
		});
	}

	/**
	 * get user
	 */
	getUser(where, throwErrorIfNull = true) {

		let self = this;

		return new Promise(function (resolve, reject) {
			self.User.findOne(where, function (err, user) {
				if (err) {
					reject(err);
				} else if (throwErrorIfNull && !user) {
					reject("NO SUCH USER");
				} else {
					resolve(user);
				}
			});
		});
	}

	/**
	 * save user
	 * @param user
	 */
	saveUser(user) {

		let self = this;

		return new Promise(function (resolve, reject) {

			let userObj = new self.User(user);

			self.User.findOneAndUpdate(
				{_id: user._id}, // find a document with that filter
				userObj, // document to insert when nothing was found
				{upsert: true, new: true}, // options
				function (err, doc) { // callback
					if (err) {
						reject(err);
					} else {
						resolve(doc);
					}
				}
			);
		});
	}

	/**
	 * delete user
	 * @returns {Promise}
	 */
	deleteUser(where) {

		let self = this;

		return new Promise(function (resolve, reject) {
			self.User.remove(where, function (err) {
				if (err) {
					reject(err);
				}
				else {
					resolve();
				}
			});
		});
	};

	/**
	 * get black list
	 */
	getBlackList(where) {

		let self = this;

		return new Promise(function (resolve, reject) {

			self.BlackList.find(where, function (err, user) {
				if (err) {
					reject(err);
				} else {
					resolve(user);
				}
			});
		});
	}

	/**
	 * save email to unsubscribe
	 * @param email
	 */
	addEmailToUnsubscribe(email) {

		let self = this;

		return new Promise(function (resolve, reject) {

			let emailObj = new self.BlackList(email);

			self.BlackList.findOneAndUpdate(
				{_id: email}, // find a document with that filter
				emailObj, // document to insert when nothing was found
				{upsert: true, new: true}, // options
				function (err, doc) { // callback
					if (err) {
						reject(err);
					} else {
						resolve(doc);
					}
				}
			);
		});
	}

	/**
	 * get promotion types
	 * @param where
	 */
	getPromotionsTypes(where) {

		let self = this;

		return new Promise(function (resolve, reject) {
			self.PromotionTypes.find(where, function (err, users) {
				if (err) {
					reject(err);
				} else {
					resolve(users);
				}
			});
		});
	}

	/**
	 * set promotion type
	 * @param where
	 */
	addPromotionsType(promotionType) {

		let self = this;

		return new Promise(function (resolve, reject) {
			self.PromotionTypes.create(promotionType, function (err, doc) { // callback
					if (err) {
						reject(err);
					} else {
						resolve(doc);
					}
				}
			);
		});
	}


	/**
	 * save input and intention
	 */
	addInput(inputObj) {

		let self = this;

		return new Promise(function (resolve, reject) {

			self.Inputs.create(inputObj, function (err, doc) { // callback
					if (err) {
						reject(err);
					} else {
						resolve(doc);
					}
				}
			);
		});
	}
}


module.exports = new DBManager();