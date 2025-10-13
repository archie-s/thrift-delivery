const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const app = express();

// View engine setup
const { engine } = require('express-handlebars');
app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
        eq: (v1, v2) => v1 === v2,
        formatDate: (date) => {
            if (!date) return 'Invalid Date';
            try {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return 'Invalid Date';
            }
        },
        currentYear: () => new Date().getFullYear(),
        now: () => new Date()
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash messages
app.use(flash());

// Make user data available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/manager', require('./routes/manager'));
app.use('/rider', require('./routes/rider'));

// 404 handler
app.use((req, res, next) => {
    res.status(404);
    res.render('error', {
        message: 'Page Not Found',
        error: {
            status: 404,
            stack: process.env.NODE_ENV === 'development' ? 'Page not found' : ''
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render('error', {
        title: 'Error',
        message: err.message || 'An error occurred',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;