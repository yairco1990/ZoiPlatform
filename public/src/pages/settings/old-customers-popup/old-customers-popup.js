function OldCustomersPopupCtrl($log, $scope, $mdDialog, $mdpTimePicker) {
	var vm = this;

	vm.$log = $log;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.$mdpTimePicker = $mdpTimePicker;

	vm.$log.info("OldCustomersPopupCtrl loaded");

	vm.initCtrl();
}

OldCustomersPopupCtrl.prototype.initCtrl = function () {

	var vm = this;

	vm.options = [
		{
			text: "1 Month",
			value: 30
		},
		{
			text: "2 Month",
			value: 60
		},
		{
			text: "3 Month",
			value: 90
		},
		{
			text: "4 Month",
			value: 120
		}
	]
};

OldCustomersPopupCtrl.prototype.optionSelected = function (option) {

	var vm = this;

	vm.$mdDialog.hide(option);
};