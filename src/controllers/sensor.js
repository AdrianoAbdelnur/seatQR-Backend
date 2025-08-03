const Sensor = require("../models/Sensor");


const addSensor = async (req, res) => {
    try {
        const { deviceId, name, location, installDate, notes } = req.body;

        const existingSensor = await Sensor.findOne({ deviceId });
        if (existingSensor) {
            return res.status(409).json({ message: 'Sensor already exists', existingSensor });
        }

        const newSensor = new Sensor({ deviceId, name, location, installDate, notes });
        await newSensor.save();

        res.status(201).json({ message: 'Sensor created successfully', newSensor });
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
};

const getAllSensors = async (req, res) => {
    try {
        const sensors = await Sensor.find();
        res.status(200).json({ message: 'Sensors retrieved successfully', sensors });
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
};

const getSensorByDeviceId = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const sensor = await Sensor.findOne({ deviceId });
        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }
        res.status(200).json({ message: 'Sensor retrieved', sensor });
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
};



module.exports = {
    addSensor,
    getAllSensors,
    getSensorByDeviceId
};