var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// job model
var Job = new Schema({
    username: String,
    expression: String,
    url: String,
    nextrun: String
});

module.exports = mongoose.model('Job', Job);
