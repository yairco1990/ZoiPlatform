/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.agenda', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('agenda', {
			url: '/agenda?{userId}',
			controller: 'AgendaCtrl as vm',
			templateUrl: 'src/pages/agenda/agenda.html',
			resolve: {
				zoiUserId: function () {
					return getZoiUserId();
				},
				zoiUser: function (zoiUserId, zoiApi) {
					return zoiApi.getUser(Number(zoiUserId));
				},
				appointments: function ($http, $log, zoiConfig, $stateParams) {
					return $http({
						url: zoiConfig.getServerUrl() + "/acuity/getAgenda?userId=" + $stateParams.userId,
						method: "GET",
						params: {}
					}).then(function (result) {
						return result.data;
					}).catch(function (err) {
						$log.error(err);
						return [];
					});
				}
			}
		})
	}]).controller('AgendaCtrl', AgendaCtrl);


/**
 * page constructor
 * @constructor
 */
function AgendaCtrl($log, $rootScope, $timeout, appointments, zoiUser) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.appointments = appointments;
	vm.zoiUser = zoiUser;

	vm.$log.info("AgendaCtrl loaded");
	vm.initCtrl();
}

AgendaCtrl.inject = ['$log', '$rootScope', '$timeout', 'appointments', 'zoiUser'];

/**
 *  init the page
 */
AgendaCtrl.prototype.initCtrl = function () {

	var vm = this;

	vm.appointments.sort(function (a1, a2) {
		if (moment(a1.startTime).isAfter(a2.startTime)) {
			return 1;
		} else {
			return -1;
		}
	});

	vm.calendarName = vm.zoiUser.defaultCalendar.id > 0 ? vm.zoiUser.defaultCalendar.name : "All Calendars";
};




















