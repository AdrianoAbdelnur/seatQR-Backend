const SensorData = require('../models/SensorData');
const Sensor = require('../models/Sensor');


const addBatchSensorData = async (req, res) => {
  try {
    const { deviceId, measurements } = req.body; 

    if (!deviceId || !Array.isArray(measurements)) {
      return res.status(400).json({ message: 'deviceId and measurements[] required' });
    }

    const sensor = await Sensor.findOne({ deviceId });
    if (!sensor) return res.status(404).json({ message: 'Sensor not found' });

    const dataDocs = measurements.map(m => ({
      sensor: sensor._id,
      timestamp: new Date(m.timestamp),
      value: m.value
    }));

    await SensorData.insertMany(dataDocs);

    const totalBatch = measurements.reduce((acc, cur) => acc + cur.value, 0);
    sensor.totalLiters += totalBatch;
    await sensor.save();

    res.status(200).json({ message: 'Measurements saved and total updated', totalAdded: totalBatch, totalLiters: sensor.totalLiters });

  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};


const getSensorData = async (req, res) => {
  const sensorId = req.params.sensorId;
  console.log(sensorId)

  try {
    const sensor = await Sensor.findById(sensorId);
    const data = await SensorData.find({ sensor: sensorId }).sort({ timestamp: 1 });
    console.log(sensor,data)

    res.json({
      sensor,
      data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener datos del sensor" });
  }
};


const getLastSensorData = async (req, res) => {
  try {
    const { sensorId } = req.params;

    const lastData = await SensorData.findOne({ sensor: sensorId }).sort({ timestamp: -1 });
    if (!lastData) return res.status(404).json({ message: 'No data found for this sensor' });

    res.status(200).json({ message: 'Last sensor data retrieved', lastData });
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};


const deleteSensorData = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SensorData.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Sensor data not found' });

    res.status(200).json({ message: 'Sensor data deleted', deleted });
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};

const getSensorSummaryInRange = async (req, res) => {
  try {
    const { sensorId, start, end } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!sensorId || isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ message: 'Missing or invalid parameters' });
    }

    
    const sensor = await Sensor.findOne({ deviceId: sensorId });
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    const sensorObjectId = sensor._id;

    const rawData = await SensorData.find({
      sensor: sensorObjectId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    const hourlySummary = await SensorData.aggregate([
      {
        $match: {
          sensor: sensorObjectId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
            hour: { $hour: "$timestamp" }
          },
          total: { $sum: "$value" },
          average: { $avg: "$value" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 }
      }
    ]);

    const totalValue = rawData.reduce((acc, cur) => acc + cur.value, 0);

    res.status(200).json({
      message: 'Sensor summary in range',
      sensor: sensor.deviceId,
      range: { start: startDate, end: endDate },
      totalValue,
      count: rawData.length,
      hourlySummary,
      rawData
    });

  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};

const generateFakeSensorData = async (req, res) => {
  try {
    const {
      deviceId,
      days = 30,
      readingsPerDay = 12,
      minLiters = 2,
      maxLiters = 6,
      startDate 
    } = req.body;

    const sensor = await Sensor.findOne({ deviceId });
    if (!sensor) return res.status(404).json({ message: 'Sensor not found' });

    const measurements = [];
    const now = new Date();
    const baseDate = startDate ? new Date(startDate) : new Date();

    for (let i = days - 1; i >= 0; i--) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(currentDate.getDate() - i);

      const intervalHours = Math.floor(24 / readingsPerDay);

      for (let h = 0; h < 24; h += intervalHours) {
        const timestamp = new Date(currentDate);
        timestamp.setHours(h, 0, 0, 0);

        const value = parseFloat((Math.random() * (maxLiters - minLiters) + minLiters).toFixed(2));

        measurements.push({
          sensor: sensor._id,
          timestamp,
          value
        });
      }
    }

    await SensorData.insertMany(measurements);

    const totalAdded = measurements.reduce((acc, cur) => acc + cur.value, 0);
    sensor.totalLiters += totalAdded;
    await sensor.save();

    res.status(201).json({
      message: 'Fake sensor data generated successfully',
      totalDays: days,
      totalReadings: measurements.length,
      totalAdded: totalAdded.toFixed(2),
      updatedTotal: sensor.totalLiters
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addBatchSensorData,
  getSensorData,
  getLastSensorData,
  deleteSensorData,
  generateFakeSensorData
};