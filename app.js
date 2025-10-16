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
        formatDate: (date) => new Date(date).toLocaleDateString(),
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
    name: 'thrift.sid',
    secret: 'your-secret-key',
    resave: true, // ensure session is saved even if unmodified to avoid race conditions in dev
    saveUninitialized: false,
    rolling: true, // refresh cookie on every response to keep session alive during repeated requests
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Flash messages
app.use(flash());

// Make user data and current year available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    // Use first flash message if present so templates render cleanly
    const errorFlash = req.flash('error');
    const successFlash = req.flash('success');
    res.locals.error = Array.isArray(errorFlash) ? (errorFlash[0] || null) : errorFlash;
    res.locals.success = Array.isArray(successFlash) ? (successFlash[0] || null) : successFlash;
    res.locals.year = new Date().getFullYear();
    next();
});

// Development-only session debug middleware
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        try {
            const sessionId = req.sessionID;
            const user = req.session ? req.session.user : null;
            console.debug(`[SESSION DEBUG] ${req.method} ${req.originalUrl} - sessionID=${sessionId} user=${user ? user.email : 'null'}`);
        } catch (e) {
            console.debug('[SESSION DEBUG] error reading session', e);
        }
        next();
    });
}

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