angular.module('Zoi.services.zoi-api', [])

    .service('zoiApi', function ($log, $http, zoiConfig) {

        return {
            /**
             * save user
             * @param user
             * @returns {*}
             */
            saveUser: function (user) {
                return $http({
                    url: zoiConfig.getServerUrl() + "/api/saveUser",
                    method: "POST",
                    params: {
                        user: user
                    },
                    timeout: 10000
                }).then(function (result) {
                    return result.data;
                });
            },

            /**
             * integrate with facebook
             */
            sendFacebookAccessToken: function (userId, authResponse) {
                return $http({
                    url: zoiConfig.getServerUrl() + "/facebook/auth",
                    method: "POST",
                    params: {
                        userId: userId,
                        authResponse: authResponse
                    },
                    timeout: 5000
                }).then(function (result) {
                    return result.data;
                });
            }
        }

    });