const express = require("express");
const { validateTripFields } = require("../middlewares/trip");
const {addTrip, getTrips } = require("../controllers/trip");
const router = express.Router();


router.post('/addTrip', addTrip);
router.get('/getTrips', getTrips);

module.exports = router; 