/**
 * Created by Yair on 2/20/2017.
 */

var Utils = {
    serverResponse: {
        SUCCESS: "success",
        ERROR: "error"
    },

    pushCase: {
        SESSION_ENDED: "sessionEnded",
        PLAYER_GAMBLED: "playerGambled",
        GAME_OVER: "gameOver",
        GAME_RESTARTED: "gameRestarted",
        UPDATE_GAME: "updateGame",
        NEW_MESSAGE: "newMessage",
        NEW_ROOM_CREATED: "newRoomCreated"
    },

    /**
     * remove from array
     * @param array
     * @param value
     * @returns {*}
     */
    removeFromArray: function (array, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].id == value.id) {
                array.splice(i, 1);
                break;
            }
        }
        return array;
    },

    generateArrayOfUsersIds: function (users, onlyLoggedIn) {
        var array = [];

        users.forEach(function (user) {
            if (!onlyLoggedIn || (onlyLoggedIn && user.isLoggedIn)) {
                array.push(user.id);
            }
        });

        return array;
    },

    getUserById: function (users, id) {
        var selectedUser = null;
        users.forEach(function (user) {
            if (user.id == id) {
                selectedUser = user;
            }
        });
        return selectedUser;
    },

    /**
     * getJSON:  REST get request returning JSON object(s)
     * @param options: http options object
     * @param callback: callback to pass the results JSON object(s) back
     */
    restRequest: function (options, asString, onResult) {

        var protocol = options.port == 443 ? https : http;
        var req = protocol.request(options, function (res) {
            var output = '';

            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                var obj = output;
                if (!asString) {
                    obj = JSON.parse(output);
                }
                onResult(res.statusCode, obj);
            });
        });

        req.on('error', function (err) {
            console.error("failed to make restRequest due to");
            console.error(err);
        });

        req.end();
    },

    /**
     * build path with params
     * @param path
     * @param params
     */
    buildPath: function (path, params) {

        path += "?";

        for (var property in params) {

            if (params.hasOwnProperty(property)) {

                path += property + "=" + params[property];

                path += "&";
            }
        }

        return path;
    }
};

module.exports = Utils;
