const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const Required = require('./RequiredTypes');

const schema = new Schema({
    email: Required.String,
    name: Required.String,
    address: String,
    hash: Required.String,
    roles: [{
        type: String,
        // For an array of strings, and because you have enum, this isn't needed:
        // required: true,
        enum: ['admin', 'donor', 'staff', 'volunteer']
    }]
});

schema.statics.emailExists = function(email) {
    return this.find({ email })
        .count()
        .then(count => count > 0);
};

schema.method('generateHash', function (password) {
    this.hash = bcrypt.hashSync(password, 8);
});

schema.method('comparePassword', function (password) {
    return bcrypt.compareSync(password, this.hash);
});

schema.query('selectFields', function() {
    return this.select('-hash').lean();
});

module.exports = mongoose.model('User', schema);