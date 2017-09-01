const router = require('express').Router();
const ApiServices = require('./ApiService');
const GmailService = require('./GmailService');
const AcuityService = require('./AcuityService');

//manage the routing
router.use('/api', ApiServices);
router.use('/gmail', GmailService);
router.use('/acuity', AcuityService);

module.exports = router;