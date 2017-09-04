const graph = require('fbgraph');
const ZoiConfig = require('../config');
const DBManager = require('../dal/DBManager');
const MyLog = require('../interfaces/MyLog');
const MyUtils = require('../interfaces/utils');

class FacebookLogic {

    static async authUser(userId, authResponse, callback) {

        try {

            //get the user
            const user = await DBManager.getUserById(userId);

            //set the facebook integration to the user
            user.integrations.Facebook = authResponse;

            //get pages details
            const pagesResult = await MyUtils.makeRequest("GET", MyUtils.addParamsToUrl("https://graph.facebook.com/me/accounts", {access_token: authResponse.accessToken}));
            authResponse.pages = pagesResult.data;

            //save user
            await DBManager.saveUser(user);

            callback(200, {message: "integrated successfully with Facebook"});

        } catch (err) {
            MyLog.error("Failed to integrate with Facebook", err);
        }
    }

    static test(userId) {

        try {

            return new Promise(async (resolve, reject) => {
                graph.setVersion("2.8");

                const user = await DBManager.getUserById(userId);

                let pageId = "1110377895705616";
                graph.setAccessToken("EAAFGPKITtcEBALPUVVX5bkm8ymtCZApf4O6UpMLP33k8wlVv4vIjsRdQTTZBKh2gqovKJrQlfqZALo3tII58moCbxXzmCkRzWpjzIGdKdOTOL3hPgUPBBRk8ghaMA7SWZA6jlatEaSsZAUHZBUVZCsEabUU3niokB1WnjulJF0RtePMnSJU7lGRcSQ2MwFiwNgZD");

                // pass it in as part of the url
                graph.post(`${pageId}/feed`, {message: "test postttt"}, function (err, res) {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }
                    // returns the post id
                    console.log(res);
                    resolve(res);
                });
            });

        } catch (err) {
            MyLog.error("Failed to integrate with Facebook", err);
        }

    }
}

module.exports = FacebookLogic;