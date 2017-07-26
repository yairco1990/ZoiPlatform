function MindbodyPopupCtrl($log, $scope, $mdDialog) {
    var vm = this;

    vm.$log = $log;
    vm.$scope = $scope;
    vm.$mdDialog = $mdDialog;

    vm.$log.info("MindbodyPopupCtrl loaded");
}

MindbodyPopupCtrl.prototype.saveButtonClicked = function () {
    var vm = this;

    vm.$mdDialog.hide({
        username: vm.username,
        password: vm.password
    });
};