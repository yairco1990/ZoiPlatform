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
			text: "Prompt",
			value: true
		},
		{
			text: "Don't prompt",
			value: false
		}
	]
};

PromptWelcomePopupCtrl.prototype.optionSelected = function (option) {

	var vm = this;

	vm.$mdDialog.hide(option.value);
};