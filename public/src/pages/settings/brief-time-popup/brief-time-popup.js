function BriefPopupCtrl($log, $scope, $mdDialog, $mdpTimePicker, items) {
	var vm = this;

	vm.$log = $log;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.$mdpTimePicker = $mdpTimePicker;
	vm.items = items;

	vm.$log.info("BriefPopupCtrl loaded");

	vm.initCtrl();
}

BriefPopupCtrl.prototype.initCtrl = function () {

	var vm = this;

	//current brief time
	vm.currentBriefTime = new Date(vm.items.currentBriefTime);

	//if there is brief time - set it as default
	if (vm.currentBriefTime) {
		vm.morningBriefTime = new Date();
		vm.morningBriefTime.setHours(vm.currentBriefTime.getHours());
		vm.morningBriefTime.setMinutes(vm.currentBriefTime.getMinutes());
	}
	//if there is no - set current time as default
	else {
		vm.morningBriefTime = new Date();
	}

};

BriefPopupCtrl.prototype.saveButtonClicked = function () {

	var vm = this;

	vm.$mdDialog.hide(vm.morningBriefTime.valueOf());
};