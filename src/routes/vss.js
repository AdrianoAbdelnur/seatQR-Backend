const router = require("express").Router();
const ctrl = require("../controllers/vss");

router.get("/health", ctrl.health);
router.post("/login", ctrl.login);
router.post("/devices", ctrl.listDevices);
router.post("/status", ctrl.getDeviceStatus);
router.post("/tracks", ctrl.getTracks);
router.post("/alarms", ctrl.getAlarms);
router.post("/video/search", ctrl.searchVideoFiles);
router.post("/alarms/evidence", ctrl.getAlarmEvidence);
router.post("/vehicle/control", ctrl.vehicleControl);
router.post("/webdown/create", ctrl.webdownCreate);
router.post("/webdown/progress", ctrl.webdownProgress);
router.post("/webdown/list", ctrl.webdownList);

module.exports = router;
