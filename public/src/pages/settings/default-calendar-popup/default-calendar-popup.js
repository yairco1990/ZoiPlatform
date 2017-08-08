function DefaultCalendarPopupCtrl($log, $scope, $mdDialog, $mdpTimePicker, items) {
	var vm = this;

	vm.$log = $log;
	vm.$scope = $scope;
	vm.$mdDialog = $mdDialog;
	vm.$mdpTimePicker = $mdpTimePicker;
	vm.items = items;

	vm.$log.info("PromotionTypesPopupCtrl loaded");

	vm.initCtrl();
}

DefaultCalendarPopupCtrl.prototype.initCtrl = function () {

	var vm = this;

	vm.businessCalendars = vm.items.businessCalendars;

	//add 'all calendar selection' to business calendars
	vm.businessCalendars.push({
		id: -1,
		name: "All calendars"
	});

	//sort business calendars by id
	vm.businessCalendars.sort(function (c1, c2) {
		if (c1.id > c2.id) {
			return 1;
		}
		return -1;
	});
};

DefaultCalendarPopupCtrl.prototype.calendarSelected = function (calendar) {

	var vm = this;

	vm.$mdDialog.hide(calendar);
};