var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const booksRouter = require('./routes/books');
const booksApiRouter = require('./routes/booksApi');
const usersApiRouter = require('./routes/usersApi');
const bookRouter = require('./routes/book');
const searchRouter = require('./routes/search');
const authRouter = require('./routes/auth');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/books', booksRouter);
app.use('/book', bookRouter);
app.use('/search', searchRouter);
app.use('/api/auth', authRouter);

app.use('/api/books', booksApiRouter);
app.use('/api/users', usersApiRouter);


app.use(express.static(path.join(__dirname, '../comp3047-assignment-vue-fall2025-andylam852/dist')));

app.use((req, res, next) => {
  res.status(404).send('Page not found');
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;