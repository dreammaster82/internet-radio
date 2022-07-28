const router = require('express').Router(),
    apiRoute = require('./api'),
    splitRouter = require('./split');

router.use('/api/split', splitRouter)
router.use('/api', apiRoute);

module.exports = router;
