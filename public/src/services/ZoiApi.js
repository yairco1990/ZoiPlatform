angular.module('Zoi.services.zoi-api', [])

	.service('zoiApi', function ($log, $http, zoiConfig, $timeout, $state, $mdDialog) {

		return {

			postOnFacebook: function (payload) {
				return $http({
					url: zoiConfig.getServerUrl() + "/chat/postFacebookContent",
					method: "POST",
					params: payload,
					timeout: 10000
				}).then(function (result) {
					return result.data;
				}, function (err) {
					$log.error(err);
				});
			},

			/**
			 * get user by id
			 * @param userId
			 */
			getUser: function (userId) {
				return $http({
					url: zoiConfig.getServerUrl() + "/api/getUser",
					method: "GET",
					params: {
						userId: userId
					},
					timeout: 10000
				}).then(function (result) {
					return result.data;
				}, function (err) {
					$log.error(err);
					$timeout(function () {
						$state.go('404');
					});
				});
			},

			/**
			 * save user
			 * @param user
			 * @param ev
			 * @returns {*}
			 */
			saveUser: function (user, ev) {
				return $http({
					url: zoiConfig.getServerUrl() + "/api/saveUser",
					method: "POST",
					params: {
						user: user
					},
					timeout: 10000
				}).then(function (result) {
					return result.data;
				}).then(function (user) {
					$log.info("User saved successfully");

					if (ev) {
						MyUtils.removeLoader();

						$mdDialog.show(
							$mdDialog.alert()
								.parent(angular.element(document.querySelector('#popupContainer')))
								.clickOutsideToClose(true)
								.title("Saved Successfully")
								.ariaLabel("Saved Successfully")
								.targetEvent(ev)
						);
					}

					return user;
				}).catch(function (err) {
					MyUtils.removeLoader();
					alert("Failed to save user");
					$log.error(err);
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