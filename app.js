var path = require('path');
var fs = require('fs');
var config = require('config');
var mongoose = require('mongoose');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var CronTab = require('./lib/cronTab');
var Job = require('./models/job');

// configure mongodb
mongoose.connect('mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server + '/' + config.mongodb.database);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB error: ' + err.message);
    console.error('Make sure a mongoDB server is running and accessible by this application');
    process.exit();
});

// configure express
var app = module.exports = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride());
app.use(session({
    secret: '1234567890QWERTY',
    resave: true,
    saveUninitialized: true
}));

if ('development' == app.get('env')) {
    if (config.verbose) mongoose.set('debug', true);
    app.use(express.static(__dirname + '/public'));
    app.use(errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
}

if ('production' == app.get('env')) {
    var oneYear = 31557600000;
    app.use(express.static(__dirname + '/public', {
        maxAge: oneYear
    }));
    app.use(errorHandler());
}

// initialize jobs
var nbInitializedJobs = 0;
Job.find({}).exec(function(err, jobs) {
    if (err) return callback(err);
    if (jobs.length > 0) {
        for (var i = 0; i < jobs.length; i++) {
            var job = jobs[i];
            CronTab.add(job);
            nbInitializedJobs++;
            console.log('Init job %s (URL: %s ON %s)', job._id, job.url, job.expression);
        }
    } else {
        if (nbInitializedJobs) {
            console.log('Init complete. %d jobs initialized.', nbInitializedJobs);
        } else {
            console.log('Starting with empty job collection.');
        }
    }
});

// exit cleanup
process.on('exit', function() {
    var nbJobs = CronTab.removeAll();
    if (nbJobs) {
        console.log('Stopped %d jobs.', nbJobs);
    }
});

// configure routes
app.use('/api', require('./app/api'));
app.use('/web', require('./app/web'));

// load plugins
fs.exists('./plugins/index.js', function(exists) {
    if (exists) {
        require('./plugins').init(app, config, mongoose);
    };
});

app.listen(config.server.port);
console.log("Express server listening on port %d in %s mode", config.server.port, app.settings.env);
