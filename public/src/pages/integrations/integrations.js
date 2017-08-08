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
				zoiUser: function ($http, $log, $stateParams, zoiConfig) {
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
						$log.error(err.data);
						return err.data;
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
	if (vm.zoiUser != "NO_SUCH_USER") {
		//add integration object if doesn't exist
		if (!vm.zoiUser.integrations) {
			vm.zoiUser.integrations = {};
		}

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

// integrationsCtrl.prototype.onFacebookClicked = function () {
// 	alert("facebook");
// };
// integrationsCtrl.prototype.onMindbodyClicked = function (ev) {
//
// 	var vm = this;
//
// 	vm.$mdDialog.show({
// 		controller: BriefPopupCtrl,
// 		controllerAs: 'vm',
// 		templateUrl: 'src/pages/integrations/mindbody-popup/mindbody-popup.html',
// 		parent: angular.element(document.body),
// 		targetEvent: ev,
// 		clickOutsideToClose: true,
// 		fullscreen: false // Only for -xs, -sm breakpoints.
// 	})
// 		.then(function (mindbody) {
// 			vm.zoiUser.integrations.mindbody = mindbody;
// 			vm.saveMindbodyUser();
// 		}, function () {
// 			vm.$log.debug('You cancelled the dialog.');
// 		});
// };
//
// integrationsCtrl.prototype.saveMindbodyUser = function () {
// 	var vm = this;
//
// 	vm.zoiApi.saveUser(vm.zoiUser).then(function (result) {
// 		vm.$log.info("user saved successfully");
// 	}).catch(function () {
// 		console.error("asdasdasd");
// 	})
// };