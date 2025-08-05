const express = require("express");
const { validateTripFields } = require("../middlewares/trip");
const {addTrip, getTrips, boardPassenger, setPassengerSeat, updateTripStatus } = require("../controllers/trip");
const router = express.Router();


router.post('/addTrip', addTrip);
router.get('/getTrips', getTrips);
router.post('/:tripId/board', boardPassenger);
router.post('/:tripId/seat', setPassengerSeat);
router.patch('/:tripId/updateStatus', updateTripStatus);

module.exports = router; 