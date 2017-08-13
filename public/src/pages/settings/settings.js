/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.settings', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('settings', {
			url: '/settings?{userId}',
			controller: 'SettingsCtrl as vm',
			templateUrl: 'src/pages/settings/settings.html',
			resolve: {
				zoiUser: function ($http, $log, $stateParams, zoiConfig) {
					return $http({
						url: zoiConfig.getServerUrl() + "/api/getUser",
						method: "GET",
						params: {
							userId: $stateParams.userId
						},
						timeout: 5000
					}).then(function (result) {
						return result.data;
					}, function (err) {
						$log.error(err.data);
						return err.data;
					});
				},
				businessCalendars: function ($http, $log, $stateParams, zoiConfig) {
					return $http({
						url: zoiConfig.getServerUrl() + "/acuity/getCalendars",
						method: "GET",
						params: {
							userId: $stateParams.userId
						},
						timeout: 5000
					}).then(function (result) {
						return result.data;
					}, function (err) {
						$log.error(err);
						return err;
					});
				}
			}
		})
	}]).controller('SettingsCtrl', SettingsCtrl);


/**
 * page constructor
 * @constructor
 */
function SettingsCtrl($log, $rootScope, $timeout, zoiUser, $mdDialog, zoiApi, businessCalendars) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.zoiUser = zoiUser;
	vm.$mdDialog = $mdDialog;
	vm.zoiApi = zoiApi;
	vm.businessCalendars = businessCalendars;

	vm.$log.info("SettingsCtrl loaded");
	vm.initCtrl();
}

SettingsCtrl.prototype.initCtrl = function () {
	var vm = this;

	//deep copy for the morning brief time text
	vm.morningBriefTime = angular.copy(vm.zoiUser.morningBriefTime);

	//check for missing values
	//old customer range text
	vm.oldCustomersRangeText = vm.zoiUser.oldCustomersRange && vm.zoiUser.oldCustomersRange.text ? vm.zoiUser.oldCustomersRange.text.toLowerCase() : "1 month";
	//customer send limit text
	vm.customersSendLimitText = vm.zoiUser.customerSendLimit && vm.zoiUser.customerSendLimit.text ? vm.zoiUser.customerSendLimit.text.toLowerCase() : "1 promo per week";
	//prompt new customers
	vm.promptNewCustomers = vm.zoiUser.promptNewCustomers === false ? "Don't notify me of new bookers" : "Notify me of new bookers";
};

/**
 * open morning brief time popup
 * @param ev
 */
SettingsCtrl.prototype.openBriefTimePopup = function (ev) {

	var vm = this;

	var items = {
		currentBriefTime: angular.copy(vm.zoiUser.nextMorningBriefDate)
	};

	vm.openPopup(ev, BriefPopupCtrl, 'src/pages/settings/brief-time-popup/brief-time-popup.html', items, function (briefTime) {

		//show the new time instead of unix timestamp
		vm.morningBriefTime = moment(briefTime).format("HH:mm");

		//attach time to the user
		vm.zoiUser.morningBriefTime = briefTime;

		//save the user
		vm.saveUser();

	}, function () {
		vm.$log.info('the brief time dialog cancelled');
	});
};

/**
 * open calendars popup
 * @param ev
 */
SettingsCtrl.prototype.openCalendarsPopup = function (ev) {

	var vm = this;
	var items = {
		businessCalendars: angular.copy(vm.businessCalendars)
	};
	vm.openPopup(ev, DefaultCalendarPopupCtrl, 'src/pages/settings/default-calendar-popup/default-calendar-popup.html', items, function (selectedCalendar) {

		//attach time to the user
		vm.zoiUser.defaultCalendar = selectedCalendar;

		//save the user
		vm.saveUser();

	}, function () {
		vm.$log.info('the default calendar dialog cancelled');
	});
};


/**
 * open old customers popup
 * @param ev
 */
SettingsCtrl.prototype.openOldCustomersPopup = function (ev) {

	var vm = this;

	vm.openPopup(ev, OldCustomersPopupCtrl, 'src/pages/settings/old-customers-popup/old-customers-popup.html', null, function (selectedValue) {

		//attach range to the user
		vm.zoiUser.oldCustomersRange = selectedValue;

		//save the user
		vm.saveUser();

	}, function () {
		vm.$log.info('the default calendar dialog cancelled');
	});
};

/**
 * open customer send limit popup
 * @param ev
 */
SettingsCtrl.prototype.openCustomersSendLimitPopup = function (ev) {

	var vm = this;

	vm.openPopup(ev, CustomerSendLimitPopupCtrl, 'src/pages/settings/customers-send-limit-popup/customers-send-limit-popup.html', null, function (selectedValue) {

		//attach range to the user
		vm.zoiUser.customerSendLimit = selectedValue;

		//save the user
		vm.saveUser();

	}, function () {
		vm.$log.info('the default calendar dialog cancelled');
	});
};

/**
 * open prompt welcome popup
 * @param ev
 */
SettingsCtrl.prototype.openPromptWelcomePopup = function (ev) {

	var vm = this;

	vm.openPopup(ev, PromptWelcomePopupCtrl, 'src/pages/settings/prompt-welcome-popup/prompt-welcome-popup.html', null, function (selectedValue) {

		//attach range to the user
		vm.zoiUser.promptNewCustomers = selectedValue;

		//save the user
		vm.saveUser();

	}, function () {
		vm.$log.info('the default calendar dialog cancelled');
	});
};

/**
 * save the user on server
 */
SettingsCtrl.prototype.saveUser = function () {
	var vm = this;
	vm.zoiApi.saveUser(vm.zoiUser).then(function (savedUser) {
		vm.zoiUser = savedUser;
		vm.initCtrl();
	});
};

/**
 * open popup
 */
SettingsCtrl.prototype.openPopup = function (ev, controller, templateUrl, items, onSuccess, onError) {
	var vm = this;

	//open the popup
	vm.$mdDialog.show({
		controller: controller,
		controllerAs: 'vm',
		templateUrl: templateUrl,
		parent: angular.element(document.body),
		targetEvent: ev,
		clickOutsideToClose: true,
		items: items
	}).then(onSuccess, onError);
};









