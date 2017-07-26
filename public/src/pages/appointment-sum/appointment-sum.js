/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.appointment-sum', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('appointment-sum', {
			url: '/appointment-sum?{firstname}{lastname}{email}{userId}{notes}{date}{price}{serviceId}{serviceName}{promotionTitle}',
			controller: 'AppointmentSumCtrl as vm',
			templateUrl: 'src/pages/appointment-sum/appointment-sum.html'
		})
	}]).controller('AppointmentSumCtrl', AppointmentSumCtrl);


/**
 * page constructor
 * @constructor
 */
function AppointmentSumCtrl($log, $rootScope, $timeout, $stateParams, $http, zoiConfig) {

	var vm = this;
	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;
	vm.$stateParams = $stateParams;
	vm.moment = moment;
	vm.$http = $http;
	vm.zoiConfig = zoiConfig;

	vm.$log.info("AppointmentSumCtrl loaded");
}

AppointmentSumCtrl.inject = ['$log', '$rootScope', '$timeout', '$stateParams'];

/**
 *  init the page
 */
AppointmentSumCtrl.prototype.$onInit = function () {

	var vm = this;

	//TODO change it and consider timezone

	var date;
	if (vm.$stateParams.date) {
		date = vm.$stateParams.date.substring(0, 19);
	}
	vm.appointment = {
		customer: {
			firstname: vm.$stateParams.firstname,
			lastname: vm.$stateParams.lastname,
			email: vm.$stateParams.email
		},
		userId: vm.$stateParams.userId,
		date: date,
		datetime: vm.$stateParams.date,
		notes: vm.$stateParams.notes,
		serviceId: vm.$stateParams.serviceId,
		serviceName: vm.$stateParams.serviceName,
		promotionTitle: vm.$stateParams.promotionTitle,
		price: vm.$stateParams.price
	};
};

AppointmentSumCtrl.prototype.scheduleAppointment = function () {
	var vm = this;

	vm.$http({
		url: vm.zoiConfig.getServerUrl() + "/acuity/scheduleAppointment",
		method: "GET",
		params: {
			userId: vm.appointment.userId,
			datetime: vm.appointment.datetime,
			appointmentTypeID: vm.appointment.serviceId,
			firstname: vm.appointment.customer.firstname,
			lastname: vm.appointment.customer.lastname,
			email: vm.appointment.customer.email,
			notes: vm.appointment.notes,
			price: vm.appointment.price
		}
	}).then(function (result) {
		alert("Scheduled successfully");
		vm.$log.debug(result);
	}, function (err) {
		alert("Failed to schedule");
		vm.$log.error(err);
	});
};



















