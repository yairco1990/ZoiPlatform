/**
 * Created by Yair on 10/11/2016.
 */
angular.module('Zoi.directives.integration-element', [])

    .directive('integrationElement', function () {
        return {
	  restrict: 'E',
	  templateUrl: 'src/directives/integration-element/integration-element.html',
	  scope: {
	      isAssociated: "=",
          isClosedForBeta: "=",
	      name: "@",
	      icon: "@"
	  }
        }
    });
