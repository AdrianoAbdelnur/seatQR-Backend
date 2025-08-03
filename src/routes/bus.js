const express = require("express");
const { addLayout, addBus, getBusesLayout, getBuses } = require("../controllers/bus");
const router = express.Router();

router.post('/addLayout', addLayout)
router.post('/addBus', addBus)
router.get('/getBusesLayout', getBusesLayout)
router.get("/getBuses", getBuses);

module.exports = router; 
