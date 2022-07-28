const express = require('express'),
    app = express(),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    routers = require('./routers'),
    fileUpload = require('express-fileupload'),
    {port} = require('./env.json');


app.use(cookieParser());
app.use(express.json());
app.use(fileUpload());
app.use('/', (req, res, next) => {
    console.log(req.path);
    next();
})

app.use('/', routers);

app.use(function(err, req, res, next) {
    console.error(err.message ? err : err.stack);
    let status = err.status || 500;
    let message = err.message || 'Something broke!';
    res.status(status).send(message);
});

app.listen(process.env.PORT || port || 4000);