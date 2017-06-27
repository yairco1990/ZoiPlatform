function SharedCustomer(firstname, lastname, email, mobile) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.mobile = mobile;
}

SharedCustomer.prototype.toString = function () {
    return this.firstname + " " + this.lastname + ". Email: " + this.email + ". Mobile: " + this.mobile;
};

module.exports = SharedCustomer;