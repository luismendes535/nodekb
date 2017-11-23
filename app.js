const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database')
const dbConnectionOptions = {
    useMongoClient: true,
    authSource: "admin"
}

mongoose.connect(config.database, dbConnectionOptions);
//mongoose.Promise = global.Promise;
/*
var Cat = mongoose.model('Cat', { name: String });

var kitty = new Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('meow');
  }
});

mongoose.connect('mongodb://localhost/nodekb');*/

let db = mongoose.connection;

//Check Connection
db.once('open', function(){
  console.log('Conected to MongoDB');
});

//Check DB errors
db.on('error', function(err){
    console.log(err);
});

//init app
const app = express();

//Bring in Models
let Article = require('./models/article');

//load view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

//body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//Set public folder
app.use(express.static(path.join(__dirname,'public')));

//express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

//Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param,msg, value){
    var namespace =param.split('.')
    , root =namespace.shift()
    , formParam = root;

    while (namespace.lenght){
      formParam += '[' + namespace.shift() +']';
    }
    return {
      param : formParam,
      msg   : msg,
      value :value
    };
  }
}));

//Passport Config
require('./config/passport')(passport);
//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
})

//home route
app.get('/', function(req, res){
  Article.find({}, function(err, articles){
    if(err){
      console.log(err);
    } else{
      res.render('index', {
        title:'Articles',
        articles: articles
      });
    }
  });
});

//Route Files
let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/articles', articles);
app.use('/users', users);

//Start Server
app.listen(3009, function(){
  console.log('Server started in port 3009...')
});
