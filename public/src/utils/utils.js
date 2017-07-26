/**
 * Created by sergeisafrigin on 3/27/16.
 */

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

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
    }
};

/**
 * check if a value is null
 * @param value
 * @returns {boolean}
 */
function isNull(value) {
    return value == null || value == undefined || value == 'undefined';
}

function isNullOrEmpty(value) {
    return isNull(value) || isEmpty(value);
}

/**
 * check if a value is not null
 * @param value
 * @returns {boolean}
 */
function isNotNull(value) {
    return !isNull(value);
}

function isNotNullNorEmpty(value) {
    return isNotNull(value) && isNotEmpty(value);
}

function isEmpty(value) {
    return isNull(value) || isNull(value.length) || value.length <= 0;
}

function isNotEmpty(value) {
    return !isEmpty(value);
}

/**
 * random number between min to max (both min and max are included)
 * @param min
 * @param max
 * @returns {*}
 */
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


//last given unique id
var uniqueIdCounter = 1000;

/**
 * get a unique id (used mostly for forms)
 * @returns {number}
 */
function getUniqueId() {
    return uniqueIdCounter++;
}


/**
 * invokes all who the functions that listens to ready alert after the ready function is called numOfFunc times.
 * @param numOfFunc
 * @param animation
 * @constructor
 */
function ReadyInvoker(numOfFunc) {
    numOfFunc = numOfFunc || 1;
    this.numOfFuncLeft = numOfFunc;
    this.listeners = [];
    this.stopped = false;
}

/**
 * invoke the given function when ready
 * @param func
 */
ReadyInvoker.prototype.wait = function (func) {
    if (!this.stopped) {
        if (this.numOfFuncLeft > 0) {
	  this.listeners.push(func);
        } else {
	  func();
        }
    }
};

/**
 * notify that another function is ready, checks if all the functions are ready, if so invoke all the ready listeners
 */
ReadyInvoker.prototype.ready = function () {
    this.numOfFuncLeft--;

    if (this.numOfFuncLeft === 0) {
        while (this.listeners.length > 0) {
	  this.listeners[0]();
	  this.listeners.splice(0, 1);
        }
    }
};

/**
 * stop the invoker, and don't invoke any listen functions
 */
ReadyInvoker.prototype.stop = function () {
    this.stopped = true;
};