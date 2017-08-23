/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.404', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('404', {
			url: '/404',
			controller: 'NotFoundCtrl as vm',
			templateUrl: 'src/pages/404/404.html'
		})
	}]).controller('NotFoundCtrl', NotFoundCtrl);


/**
 * page constructor
 * @constructor
 */
function NotFoundCtrl($log, $rootScope, $timeout) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;

	vm.$log.info("NotFoundCtrl loaded");
}



















