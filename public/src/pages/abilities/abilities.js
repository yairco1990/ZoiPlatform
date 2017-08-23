/**
 * Created by Yair on 3/28/2017.
 */
angular.module('Zoi.controllers.abilities', [])

	.config(['$stateProvider', function ($stateProvider) {
		$stateProvider.state('abilities', {
			url: '/abilities',
			controller: 'AbilitiesCtrl as vm',
			templateUrl: 'src/pages/abilities/abilities.html'
		})
	}]).controller('AbilitiesCtrl', AbilitiesCtrl);


/**
 * page constructor
 * @constructor
 */
function AbilitiesCtrl($log, $rootScope, $timeout) {

	var vm = this;

	vm.$log = $log;
	vm.$rootScope = $rootScope;
	vm.$timeout = $timeout;

	vm.$log.info("AbilitiesCtrl loaded");
}



















