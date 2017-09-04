/**
 * Created by Yair on 6/19/2017.
 */
const mongoose = require('mongoose');
const MyLog = require('../interfaces/MyLog');
const ZoiConfig = require('../config');

//models
const User = require('./models/User');
const BlackList = require('./models/BlackList');
const Input = require('./models/Input');
const PromotionTypes = require('./models/PromotionType');

class DBManager {

    constructor() {

        const options = {
            useMongoClient: true
        };

        mongoose.connect(ZoiConfig.mongoUrl, options)
            .once('open', () => MyLog.log(`DB Synced. Mongo Url = ${ZoiConfig.mongoUrl}`))
            .on('error', (err) => MyLog.error("Failed to sync DB", err));
    }

    /**
     * get users
     * @param where
     */
    getUsers(where) {

        return new Promise(function (resolve, reject) {
            User.find(where, function (err, users) {
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

        return new Promise(function (resolve, reject) {
            User.findOne(where, function (err, user) {
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
     * get user
     */
    getUserById(id, throwErrorIfNull = true) {

        return new Promise(function (resolve, reject) {
            User.findOne({_id: id}, function (err, user) {
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

        return new Promise(function (resolve, reject) {

            let userObj = new User(user);

            User.findOneAndUpdate(
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

        return new Promise(function (resolve, reject) {
            User.remove(where, function (err) {
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

        return new Promise(function (resolve, reject) {

            BlackList.find(where, function (err, user) {
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

        return new Promise(function (resolve, reject) {

            let emailObj = new BlackList(email);

            BlackList.findOneAndUpdate(
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

        return new Promise(function (resolve, reject) {
            PromotionTypes.find(where, function (err, users) {
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

        return new Promise(function (resolve, reject) {
            PromotionTypes.create(promotionType, function (err, doc) { // callback
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

        return new Promise(function (resolve, reject) {

            Input.create(inputObj, function (err, doc) { // callback
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