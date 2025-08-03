const express = require("express");
const { addSensor, getAllSensors, getSensorByDeviceId } = require("../controllers/sensor");
const router = express.Router();


router.post('/', addSensor);
router.get('/', getAllSensors);
router.get('/:deviceId', getSensorByDeviceId);


module.exports = router;
module.exports = router; 