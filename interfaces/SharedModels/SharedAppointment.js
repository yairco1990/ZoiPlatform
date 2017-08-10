const moment = require('moment-timezone');

function SharedAppointment(startTime, endTime, serviceName, sharedEmployee, sharedCustomer) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.serviceName = serviceName;
    this.sharedCustomer = sharedCustomer;
    this.sharedEmployee = sharedEmployee;
}

SharedAppointment.prototype.toString = function () {

    let s = "";

    if (this.startTime)
        s += "Start time: " + moment(this.startTime).format('lll') + ".";
    if (this.endTime)
        s += "\nEnd time: " + moment(this.endTime).format('lll') + ".";
    if (this.serviceName)
        s += "\nService name: " + this.serviceName;
    if (this.sharedCustomer)
        s += "\nCustomer: " + this.sharedCustomer.toString();
    if (this.sharedEmployee)
        s += "\nProvider: " + this.sharedEmployee.toString();

    return s + "\n";
};

module.exports = SharedAppointment;