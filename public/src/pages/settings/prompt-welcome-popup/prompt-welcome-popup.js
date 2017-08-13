function PromptWelcomePopupCtrl($log, $scope, $mdDialog, $mdpTimePicker) {
	var vm = this;

	vm.$log = $log;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.$mdpTimePicker = $mdpTimePicker;

	vm.$log.info("PromptWelcomePopupCtrl loaded");

	vm.initCtrl();
}

PromptWelcomePopupCtrl.prototype.initCtrl = function () {

	var vm = this;

	vm.options = [
		{
			text: "Notify me of new bookers",
			value: true
		},
		{
			text: "Don't notify me of new bookers",
			value: false
		}
	]
};

PromptWelcomePopupCtrl.prototype.optionSelected = function (option) {

	var vm = this;

	vm.$mdDialog.hide(option.value);
};