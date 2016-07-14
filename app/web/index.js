var express = require('express');
var config = require('config');
var expressLayouts = require('express-ejs-layouts')
var errorHandler = require('errorhandler');
var User = require('../../models/user.js');

// configure express
var app = module.exports = express();
app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static(__dirname + '/public'));

// configure routes
app.get('/', checkAuth, function(req, res, next) {
    res.render('index', {
        route: app.route,
        firstname: req.session.firstname,
        lastname: req.session.lastname
    });
});

app.all('/login', function(req, res, next) {
    var post = req.body;
    var username = post.username;
    var password = post.password;

    if (post) {
        User.findOne({
            username: username,
            password: password
        }, function(err, user) {
            if (user) {
                req.session.username = user.username;
                req.session.firstname = user.firstname;
                req.session.lastname = user.lastname;
                res.redirect('/web');
            } else {
                res.render('login', {
                    route: app.route
                });
            }
        });
    } else {
        res.render('login', {
            route: app.route
        });
    }
});

app.get('/logout', function(req, res, next) {
    delete req.session.username;
    delete req.session.firstname;
    delete req.session.lastname;
    res.redirect('/web/login');
});

if (!module.parent) {
    app.listen(3000);
    console.log('Express started on port 3000');
}

function checkAuth(req, res, next) {
    if (!req.session.username) {
        res.redirect('/web/login');
    } else {
        next();
    }
}
