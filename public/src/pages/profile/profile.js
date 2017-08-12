/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.profile', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('profile', {
			url: '/profile?{userId}',
			controller: 'ProfileCtrl as vm',
			templateUrl: 'src/pages/profile/profile.html',
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
	}]).controller('ProfileCtrl', ProfileCtrl);


/**
 * page constructor
 * @constructor
 */
function ProfileCtrl($log, $rootScope, $timeout, zoiUser) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.zoiUser = zoiUser;

	vm.$log.info("AccountCtrl loaded");
}

/**
 *  init the page
 */
ProfileCtrl.prototype.$onInit = function () {
	var vm = this;

	//init values
	vm.actionTime = moment().format("YYYY/MM");
	vm.bookedMoreThan = 5;
	vm.earnedMoreThan = 1000;
	vm.promotedMoreThan = 10;

	if (vm.zoiUser != "NO_SUCH_USER") {

		vm.currency = vm.zoiUser.integrations.Acuity.userDetails.currency;

		vm.integrationsOn = vm.zoiUser.integrations && Object.keys(vm.zoiUser.integrations).length;
		if (vm.zoiUser.profile[vm.actionTime]) {

			vm.numOfAppointments = vm.zoiUser.profile[vm.actionTime].numOfAppointments;
			vm.profitFromAppointments = vm.zoiUser.profile[vm.actionTime].profitFromAppointments;

			vm.socialShareOn = vm.zoiUser.profile[vm.actionTime].shared;
			vm.bookedMoreThanOn = vm.zoiUser.profile[vm.actionTime].numOfAppointments >= vm.bookedMoreThan;
			vm.earnedMoreThanOn = vm.zoiUser.profile[vm.actionTime].profitFromAppointments >= vm.earnedMoreThan;
			vm.promotedMoreThanOn = vm.zoiUser.profile[vm.actionTime].numOfPromotions >= vm.promotedMoreThan;
		} else {
			vm.numOfAppointments = 0;
			vm.profitFromAppointments = 0;
		}

		vm.badgesCounter = 0;
		//count the badges
		if (vm.integrationsOn)
			vm.badgesCounter++;
		if (vm.socialShareOn)
			vm.badgesCounter++;
		if (vm.bookedMoreThanOn)
			vm.badgesCounter++;
		if (vm.earnedMoreThanOn)
			vm.badgesCounter++;
		if (vm.promotedMoreThanOn)
			vm.badgesCounter++;

		vm.isChampion = vm.badgesCounter == 5;
	} else {
		vm.zoiUser = null;
	}
};



















