/**
 * Created by Yair on 6/19/2017.
 */
let mongoose = require('mongoose');
let Util = require('util');

function DBManager() {
    mongoose.connect('mongodb://zoiAdmin:GoTime2015!@ds133192.mlab.com:33192/zoi_db');

    let Schema = mongoose.Schema;

    let userSchema = new Schema({
        _id: String,
        fullname: String,
        email: String,
        conversationData: Object
    });

    this.User = mongoose.model('User', userSchema);

    Util.log("DB synced");
}

/**
 * get user
 * @param where
 */
DBManager.prototype.getUser = function (where) {

    let self = this;

    return new Promise(function (resolve, reject) {
        self.User.findOne(where, function (err, user) {
	  if (err) {
	      reject(err);
	  } else {
	      resolve(user);
	  }
        });
    });
};

/**
 * save user
 * @param user
 */
DBManager.prototype.saveUser = function (user) {

    let self = this;

    return new Promise(function (resolve, reject) {
        //create model instance with the user object
        let savedUser = self.User(user);

        //save the user
        savedUser.save(function (err) {
	  if (err) {
	      reject(err);
	  } else {
	      resolve(user);
	  }
        });
    });
};

/**
 * delete user
 * @param user
 * @returns {Promise}
 */
DBManager.prototype.deleteUser = function (where) {

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

module.exports = new DBManager();