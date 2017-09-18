/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.integrations', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('integrations', {
			url: '/integrations?{userId}{closeWindow}',
			controller: 'integrationsCtrl as vm',
			templateUrl: 'src/pages/integrations/integrations.html',
			resolve: {
				zoiUserId: function ($stateParams) {
					if ($stateParams.closeWindow && !MyUtils.isMobile()) {
						window.close();
					}
					return getZoiUserId();
				},
				zoiUser: function (zoiApi, zoiUserId) {
					return zoiApi.getUser(zoiUserId);
				}
			}
		})
	}]).controller('integrationsCtrl', integrationsCtrl);


/**
 * page constructor
 * @constructor
 */
function integrationsCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiUser, zoiApi, $window, zoiConfig, $state) {

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
	vm.$state = $state;

	vm.$log.debug("integrationsCtrl loaded");
}

/**
 *  init the page
 */
integrationsCtrl.prototype.$onInit = function () {
	var vm = this;
	vm.isAcuityAssociated = vm.zoiUser.integrations.Acuity;
	vm.isMindbodyAssociated = vm.zoiUser.integrations.Mindbody;
	vm.isGmailAssociated = vm.zoiUser.integrations.Gmail;
	vm.isFacebookAssociated = vm.zoiUser.integrations.Facebook;
};

integrationsCtrl.prototype.onAcuityClicked = function () {
	var vm = this;

	vm.redirectTo(vm.zoiConfig.getServerUrl() + '/acuity/authorize?userId=' + vm.zoiUser._id);

};

integrationsCtrl.prototype.onGmailClicked = function () {
	var vm = this;

	vm.redirectTo(vm.zoiConfig.getServerUrl() + '/gmail/auth?userId=' + vm.zoiUser._id);
};

integrationsCtrl.prototype.redirectTo = function (url) {
	var vm = this;
	if (MyUtils.isMobile()) {
		vm.$window.location.href = url;
	} else {
		MyUtils.closeWebview();
		vm.$window.open(url, '_blank');
	}
}

integrationsCtrl.prototype.onFacebookClicked = function () {
	var vm = this;

	FB.login(function (response) {

		if (response.authResponse && response.authResponse.accessToken) {

			MyUtils.addLoader();

			console.log('Welcome!  Fetching your information.... ');

			vm.zoiApi.sendFacebookAccessToken(vm.zoiUser._id, response.authResponse).then(function () {

				MyUtils.removeLoader();

				console.log("integrated with facebook successfully");
				vm.isFacebookAssociated = true;

				vm.$timeout(function () {
					vm.$state.go('facebook-pages', {userId: vm.zoiUser._id});
				}, 500);
			});

		} else {
			//user hit cancel button
			console.log('User cancelled login or did not fully authorize.');

		}
	}, {
		scope: 'manage_pages,publish_pages'
	});
};