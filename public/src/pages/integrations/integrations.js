/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.integrations', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('integrations', {
			url: '/integrations?{userId}',
			controller: 'integrationsCtrl as vm',
			templateUrl: 'src/pages/integrations/integrations.html',
			resolve: {
				zoiUser: function ($http, $log, $stateParams, zoiConfig, $timeout, $state) {
					return $http({
						url: zoiConfig.getServerUrl() + "/api/getUser",
						method: "GET",
						params: {
							userId: $stateParams.userId
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
				}
			}
		})
	}]).controller('integrationsCtrl', integrationsCtrl);


/**
 * page constructor
 * @constructor
 */
function integrationsCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.zoiUser = zoiUser;
	vm.zoiApi = zoiApi;
	vm.$window = $window;
	vm.zoiConfig = zoiConfig;

	vm.$log.debug("integrationsCtrl loaded");
}

/**
 *  init the page
 */
integrationsCtrl.prototype.$onInit = function () {
	var vm = this;
	if (vm.zoiUser !== "NO_SUCH_USER") {
		vm.isAcuityAssociated = vm.zoiUser.integrations.Acuity;
		vm.isMindbodyAssociated = vm.zoiUser.integrations.Mindbody;
		vm.isGmailAssociated = vm.zoiUser.integrations.Gmail;
		vm.isFacebookAssociated = vm.zoiUser.integrations.Facebook;
	} else {
		vm.zoiUser = null;
	}

};

integrationsCtrl.prototype.onAcuityClicked = function () {
	var vm = this;

	vm.$window.location.href = vm.zoiConfig.getServerUrl() + '/acuity/authorize?userId=' + vm.zoiUser._id;
};

integrationsCtrl.prototype.onGmailClicked = function () {
	var vm = this;

	vm.$window.location.href = vm.zoiConfig.getServerUrl() + '/gmail/auth?userId=' + vm.zoiUser._id;
};

integrationsCtrl.prototype.onGmailClicked = function () {
	var vm = this;

	vm.$window.location.href = vm.zoiConfig.getServerUrl() + '/gmail/auth?userId=' + vm.zoiUser._id;
};

integrationsCtrl.prototype.onFacebookClicked = function () {
	var vm = this;

	FB.login(function (response) {

		if (response.authResponse && response.authResponse.accessToken) {

			console.log('Welcome!  Fetching your information.... ');

			vm.zoiApi.sendFacebookAccessToken(vm.zoiUser._id, response.authResponse).then(function () {
				console.log("integrated with facebook successfully");
				vm.isFacebookAssociated = true;
			});

		} else {
			//user hit cancel button
			console.log('User cancelled login or did not fully authorize.');

		}
	}, {
		scope: 'manage_pages,publish_pages'
	});

	// checkLoginState(function (response) {
	//     if (response.status === "connected") {
	//         vm.zoiApi.sendFacebookAccessToken(vm.zoiUser._id, response).then(function () {
	//             console.log("integrated with facebook successfully");
	//         });
	//     } else {
	//         //TODO what to do here?
	//         console.log("check the TODO");
	//     }
	// });
};