const router = require('express').Router();
const ApiServices = require('./ApiService');
const GmailService = require('./GmailService');
const AcuityService = require('./AcuityService');
const FacebookService = require('./FacebookService');
const ShortnerService = require('./ShortnerService');

//manage the routing
router.use('/api', ApiServices);
router.use('/gmail', GmailService);
router.use('/acuity', AcuityService);
router.use('/facebook', FacebookService);
router.use('/s', ShortnerService);

module.exports = router;