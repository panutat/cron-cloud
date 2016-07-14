var express = require('express');
var errorHandler = require('errorhandler');
var cronParser = require('cron-parser');
var Job = require('../../models/job');
var CronTab = require('../../lib/cronTab');

// configure express
var app = module.exports = express();
app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

// configure routes
app.get('/jobs', function(req, res, next) {
    Job.find({
        username: req.session.username
    }, function(err, jobs) {
        if (err) return next(err);
        for (i = 0; i < jobs.length; i++) {
            var interval = cronParser.parseExpression(jobs[i].expression);
            jobs[i].nextrun = interval.next();
        }
        res.json(jobs);
    }).sort({
        expression: 'asc'
    });
});

app.post('/jobs', function(req, res, next) {
    if (!req.body.expression || !req.body.url) return next(new Error('You must provide an expression and an url as POST parameters'), 403);
    var job = new Job();
    job.expression = req.body.expression;
    job.url = req.body.url;
    job.username = req.session.username;
    job.save(function(err) {
        if (err) return next(err);
        if (CronTab.add(job)) {
            res.redirect('/api/jobs/' + job._id);
        } else {
            return next(new Error('Error adding Job'));
        }
    });
});

app.get('/jobs/:id', function(req, res, next) {
    Job.findOne({
        _id: req.params.id,
        username: req.session.username
    }, function(err, job) {
        if (err) return next(err);
        res.json(job);
    });
});

app.put('/jobs/:id', function(req, res, next) {
    Job.findOne({
        _id: req.params.id,
        username: req.session.username
    }, function(err, job) {
        if (err) return next(err);
        if (!job) return next(new Error('Trying to update non-existing job'), 403);
        job.expression = req.params.expression;
        job.url = req.parms.url;
        job.save(function(err2) {
            if (err2) return next(err2);
            if (CronTab.update(job)) {
                res.redirect('/api/jobs/' + job._id);
            } else {
                return next(new Error('Error updating Job'));
            }
        });
    });
});

app.delete('/jobs/:id', function(req, res, next) {
    Job.findOne({
        _id: req.params.id,
        username: req.session.username
    }, function(err, job) {
        if (err) return next(err);
        if (!job) return next(new Error('Trying to remove non-existing job'), 403);
        job.remove(function(err2) {
            if (err2) return next(err2);
            if (CronTab.remove(job)) {
                //res.redirect('/api/jobs');
                res.end('{"success" : "Deleted", "status" : 200}');
            } else {
                return next(new Error('Error removing job'));
            }
        });
    });
});

app.get('/', function(req, res) {
    var routes = [];
    app.routes.all().forEach(function(route) {
        routes.push({
            method: route.method.toUpperCase(),
            path: app.route + route.path
        });
    });
    res.json(routes);
});

if (!module.parent) {
    app.listen(3000);
    console.log('Express started on port 3000');
}
