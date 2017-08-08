function CustomerSendLimitPopupCtrl($log, $scope, $mdDialog, $mdpTimePicker) {
	var vm = this;

	vm.$log = $log;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.$mdpTimePicker = $mdpTimePicker;

	vm.$log.info("OldCustomersPopupCtrl loaded");

	vm.initCtrl();
}

CustomerSendLimitPopupCtrl.prototype.initCtrl = function () {

	var vm = this;

	vm.options = [
		{
			text: "1 promo per week",
			value: 7
		},
		{
			text: "1 promo per 2 weeks",
			value: 14
		},
		{
			text: "1 promo per 3 weeks",
			value: 21
		},
		{
			text: "1 promo per 4 weeks",
			value: 28
		}
	]
};

CustomerSendLimitPopupCtrl.prototype.optionSelected = function (option) {

	var vm = this;

	vm.$mdDialog.hide(option);
};