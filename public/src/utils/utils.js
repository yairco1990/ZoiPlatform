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
	}
};