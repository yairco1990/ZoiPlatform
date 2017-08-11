/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.appointment-sum', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('appointment-sum', {
			url: '/appointment-sum?{firstName}{lastName}{email}{userId}{date}{price}{serviceId}{serviceName}{promotionTitle}{promotionImage}{notes}{timezone}',
			controller: 'AppointmentSumCtrl as vm',
			templateUrl: 'src/pages/appointment-sum/appointment-sum.html',
			resolve: {
				openings: function ($http, $log, $stateParams, zoiConfig) {
					return $http({
						url: zoiConfig.getServerUrl() + "/acuity/getAvailability",
						method: "GET",
						params: {
							userId: $stateParams.userId,
							date: $stateParams.date,
							appointmentTypeId: $stateParams.serviceId
						},
						timeout: 5000
					}).then(function (result) {
						return result.data;
					}, function (err) {
						$log.error(err.data);
						return err.data;
					});
				}
			}
		})
	}]).controller('AppointmentSumCtrl', AppointmentSumCtrl);


/**
 * page constructor
 * @constructor
 */
function AppointmentSumCtrl($log, $rootScope, $timeout, $stateParams, $http, zoiConfig, openings, $mdDialog) {

	var vm = this;
	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.$stateParams = $stateParams;
	vm.moment = moment;
	vm.$http = $http;
	vm.zoiConfig = zoiConfig;
	vm.openings = openings;
	vm.$mdDialog = $mdDialog;

	vm.$log.info("AppointmentSumCtrl loaded");
}

AppointmentSumCtrl.inject = ['$log', '$rootScope', '$timeout', '$stateParams'];

/**
 *  init the page
 */
AppointmentSumCtrl.prototype.$onInit = function () {

	var vm = this;

	//set timezone
	vm.timezone = vm.$stateParams.timezone;

	//default selection
	vm.selectedSlot = vm.openings[0].time;

	//is booked
	vm.isBooked = false;

	vm.appointment = {
		customer: {
			firstname: vm.$stateParams.firstName,
			lastname: vm.$stateParams.lastName,
			email: vm.$stateParams.email
		},
		userId: vm.$stateParams.userId,
		date: vm.$stateParams.date,
		datetime: vm.$stateParams.date,
		notes: vm.$stateParams.notes,
		serviceId: vm.$stateParams.serviceId,
		serviceName: vm.$stateParams.serviceName,
		promotionTitle: vm.$stateParams.promotionTitle,
		price: vm.$stateParams.price,
		promotionImage: vm.$stateParams.promotionImage
	};
};

AppointmentSumCtrl.prototype.scheduleAppointment = function (ev) {
	var vm = this;

	MyUtils.addLoader();

	vm.$http({
		url: vm.zoiConfig.getServerUrl() + "/acuity/scheduleAppointment",
		method: "GET",
		params: {
			userId: vm.appointment.userId,
			datetime: vm.selectedSlot,
			appointmentTypeID: vm.appointment.serviceId,
			firstname: vm.appointment.customer.firstname,
			lastname: vm.appointment.customer.lastname,
			email: vm.appointment.customer.email,
			notes: vm.appointment.notes,
			price: vm.appointment.price
		}
	}).then(function (result) {
		MyUtils.removeLoader();
		vm.$mdDialog.show(
			vm.$mdDialog.alert()
				.parent(angular.element(document.querySelector('#popupContainer')))
				.clickOutsideToClose(true)
				.title("You Got It!")
				.textContent("Thank's for scheduling!")
				.ariaLabel("Thank's for scheduling!")
				.ok('OK')
				.targetEvent(ev)
		);
		vm.isBooked = true;
		vm.$log.debug(result);
	}, function (err) {
		MyUtils.removeLoader();
		alert("Failed to schedule");
		vm.$log.error(err);
	});
};



















