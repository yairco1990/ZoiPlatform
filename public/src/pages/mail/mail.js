/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.mail', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('mail', {
			url: '/mail?{userId}',
			controller: 'MailCtrl as vm',
			templateUrl: 'src/pages/mail/mail.html'
		})
	}]).controller('MailCtrl', MailCtrl);


/**
 * page constructor
 * @constructor
 */
function MailCtrl($log, $rootScope, $timeout, $scope, $mdDialog, zoiApi, $window, zoiConfig, $http, $stateParams) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.zoiApi = zoiApi;
	vm.$window = $window;
	vm.zoiConfig = zoiConfig;
	vm.$http = $http;
	vm.$stateParams = $stateParams;

	vm.$log.debug("MailCtrl loaded");
}

/**
 *  init the page
 */
MailCtrl.prototype.$onInit = function () {

	var vm = this;
	vm.$http({
		url: vm.zoiConfig.getServerUrl() + "/acuity/getEmails?userId=" + vm.$stateParams.userId,
		method: "GET"
	}).then(function (result) {
		result.data.forEach(function (email) {
			if (email.from.indexOf('<') > 0) {
				email.from = email.from.substring(0, email.from.indexOf('<'));
			}
		});
		vm.emails = result.data;
	}).catch(function (err) {
		vm.$log.error(err);
		return [];
	});
};

MailCtrl.prototype.moveToMail = function (emailId) {
	var vm = this;

	vm.$window.location.href = 'https://mail.google.com/mail/mu/mp/336/#cv/priority/%5Esmartlabel_personal/' + emailId;
};
