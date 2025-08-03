const express = require("express");
const router = express.Router();

router.use('/user', require('./user'))
router.use('/userPost', require('./userPost'))
router.use('/trip', require('./trip'))
router.use('/sensor', require('./sensor'))
router.use('/sensorData', require('./sensorData'))
router.use('/bus', require('./bus'))

/* router.use('/offer', require('./offer')) */
/* router.use('/payment', require('./payment')) */

module.exports = router; 