/**
 * Created by Yair on 2/20/2017.
 */

let Utils = {

    serverResponse: {
        SUCCESS: "success",
        ERROR: "error"
    },

    /**
     * getJSON:  REST get request returning JSON object(s)
     * @param options: http options object
     * @param callback: callback to pass the results JSON object(s) back
     */
    restRequest: function (options, asString, onResult) {

        let protocol = options.port == 443 ? https : http;
        let req = protocol.request(options, function (res) {
            let output = '';

            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                let obj = output;
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

        for (let property in params) {

            if (params.hasOwnProperty(property)) {

                path += property + "=" + params[property];

                path += "&";
            }
        }

        return path;
    },
    
    logicType:{
        MOCK: "Mock",
        REAL_WORLD: "Real world"
    }
};

module.exports = Utils;
