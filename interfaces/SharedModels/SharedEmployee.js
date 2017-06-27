function SharedEmployee(firstname, lastname, email, mobile) {
    this.firstname = firstname;
    this.lastname = lastname;
}

SharedEmployee.prototype.toString = function () {
    return this.firstname + " " + this.lastname + ".";
};

module.exports = SharedEmployee;