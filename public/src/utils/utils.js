var MyUtils = {

	startsWith: function (str, search) {
		return str.slice(0, search.length) === search;
	},

	isJson: function (str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	},

	addLoader: function () {
		var loaderWrapper = $('#loader-wrapper');
		loaderWrapper.removeClass('loader-hide');
		loaderWrapper.removeClass('fadeOut');
	},
	removeLoader: function () {
		var loaderWrapper = $('#loader-wrapper');
		loaderWrapper.addClass('fadeOut');
		setTimeout(function () {
			loaderWrapper.addClass('loader-hide');
		}, 1000);
	},
	getPreviewStringWithCommas: function (arr, key) {
		var previewText = "";
		arr.forEach(function (item, index) {
			if (key) {
				if (index < arr.length - 1) {
					previewText += item[key] + ", ";
				} else {
					previewText += item[key] + ".";
				}
			} else {
				if (index < arr.length - 1) {
					previewText += item + ", ";
				} else {
					previewText += item + ".";
				}
			}
		});
		return previewText.trim();
	},
	closeWebview: function () {
		if (MessengerExtensions) {
			MessengerExtensions.requestCloseBrowser(function success() {
			}, function error(err) {
			});
		}
	},
	isValidUrl: function(value) {
		return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
	}
};