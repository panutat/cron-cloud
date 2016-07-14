var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// user model
var User = new Schema({
    username: String,
    password: String,
    firstname: String,
    lastname: String
});

module.exports = mongoose.model('User', User);
