/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.old-customers', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('old-customers', {
			url: '/old-customers?{userId}',
			controller: 'OldCustomersCtrl as vm',
			templateUrl: 'src/pages/old-customers/old-customers.html',
			resolve: {
				oldCustomers: function ($http, $log, zoiConfig, $stateParams, $timeout, $state) {
					return $http({
						url: zoiConfig.getServerUrl() + "/acuity/getOldCustomers?userId=" + $stateParams.userId,
						method: "GET",
						params: {}
					}).then(function (result) {
						return result.data;
					}).catch(function (err) {
						$log.error(err);
						$timeout(function () {
							$state.go('404');
						});
					});
				}
			}
		})
	}]).controller('OldCustomersCtrl', OldCustomersCtrl);


/**
 * page constructor
 * @constructor
 */
function OldCustomersCtrl($log, $rootScope, $timeout, oldCustomers, $http, zoiConfig, $stateParams, $mdDialog) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.oldCustomers = oldCustomers;
	vm.$http = $http;
	vm.zoiConfig = zoiConfig;
	vm.$stateParams = $stateParams;
	vm.$mdDialog = $mdDialog;

	vm.$log.info("OldCustomersCtrl loaded");
}

// OldCustomersCtrl.inject = ['$log', '$rootScope', '$timeout', 'appointments'];

/**
 *  init the page
 */
OldCustomersCtrl.prototype.$onInit = function () {

	var vm = this;

	vm.isPromotionSent = false;

	if (vm.oldCustomers != "NOT_AVAILABLE") {
		vm.oldCustomers.forEach(function (customer, index) {
			customer.sendEmail = true;
			customer.id = index;
		});
	} else {
		vm.oldCustomers = null;
	}
};

/**
 * check if to show send button
 * @returns {boolean}
 */
OldCustomersCtrl.prototype.showSendButton = function () {
	var vm = this;

	var showSendButton = false;
	if (vm.oldCustomers) {
		vm.oldCustomers.forEach(function (customer) {
			if (customer.sendEmail) {
				showSendButton = true;
			}
		});
	}
	return showSendButton;
};

/**
 * send the emails
 */
OldCustomersCtrl.prototype.sendButtonClicked = function (ev) {
	var vm = this;

	MyUtils.addLoader();

	//get relevant customers
	var customersList = vm.oldCustomers.filter(function (customer) {
		return customer.sendEmail;
	});

	vm.$http({
		url: vm.zoiConfig.getServerUrl() + "/acuity/promoteOldCustomers",
		method: "POST",
		params: {
			userId: vm.$stateParams.userId,
			customers: JSON.stringify(customersList)
		}
	}).then(function (result) {

		// vm.isPromotionSent = true;

		// MyUtils.removeLoader();
		// vm.$mdDialog.show(
		// 	vm.$mdDialog.alert()
		// 		.parent(angular.element(document.querySelector('#popupContainer')))
		// 		.clickOutsideToClose(true)
		// 		.title("You Got It!")
		// 		.textContent("Promotions sent successfully!")
		// 		.ariaLabel("Promotions sent successfully!")
		// 		.targetEvent(ev)
		// );

		vm.$timeout(function () {
			//close the browser via messenger extension
			MyUtils.closeWebview();
		}, 1000);

		vm.$log.debug(result.data);
	}).catch(function (err) {
		MyUtils.removeLoader();
		alert("Failed to send promotions");
		vm.$log.error(err);
	});
};




















