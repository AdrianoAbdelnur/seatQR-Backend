const express = require("express");
const { getLastSensorData, deleteSensorData, addBatchSensorData, generateFakeSensorData, getSensorData } = require("../controllers/sensorData");
const router = express.Router();

router.post('/', addBatchSensorData);
router.get('/:sensorId', getSensorData);
router.get('/last/:sensorId', getLastSensorData);
router.delete('/:id', deleteSensorData);
router.post('/generateFakeData', generateFakeSensorData);

module.exports = router; 