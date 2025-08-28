const vss = require("../helpers/vssClient");

// Respuestas homogéneas
const ok = (res, data = {}) => res.json({ ok: true, ...data });
const fail = (res, code = 500, message = "Error interno") =>
  res.status(code).json({ ok: false, message });

/** GET /api/vss/health */
const health = async (_req, res) => {
  try {
    await vss.ensureSession();
    return ok(res, { wsURL: vss.wsURL(), pid: vss.getPid() });
  } catch (e) {
    console.error("VSS health error:", e);
    return fail(res, 500, "VSS no disponible");
  }
};

/** POST /api/vss/login  -> devuelve token/pid (por si tu front los quiere para WS) */
const login = async (_req, res) => {
  try {
    const { token, pid } = await vss.login();
    return ok(res, { token, pid, wsURL: vss.wsURL() });
  } catch (e) {
    console.error("VSS login error:", e);
    return fail(res, 401, "Credenciales VSS inválidas o servidor no responde");
  }
};

/** POST /api/vss/devices  (lista/paginado/filtros) */
const listDevices = async (req, res) => {
  try {
    const {
      pageNum = 1,
      pageCount = 2000,
      isOnline = "",     // "" todos | "1" online | "0" offline
      fleetId, keyword,
    } = req.body || {};

    const data = await vss.post("/vss/vehicle/findAll.action", {
      pageNum, pageCount, isOnline, fleetId, keyword,
    });

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error listando dispositivos");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("listDevices error:", e);
    return fail(res);
  }
};

/** POST /api/vss/status  (último estado GPS/IO de 1..N) */
const getDeviceStatus = async (req, res) => {
  try {
    // deviceIds: array de IDs de dispositivos
    const { deviceIds = [] } = req.body || {};
    const data = await vss.post("/vss/vehicle/getDeviceStatus.action", {
      deviceIds,
    });
    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error obteniendo status");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("getDeviceStatus error:", e);
    return fail(res);
  }
};

/** POST /api/vss/tracks  (histórico por rango) */
const getTracks = async (req, res) => {
  try {
    const {
      deviceId,
      beginTime, // "2025-08-27 00:00:00"
      endTime,   // "2025-08-27 23:59:59"
      pageNum = 1,
      pageCount = 2000,
    } = req.body || {};

    const data = await vss.post("/vss/track/getApiTrackList.action", {
      deviceId, beginTime, endTime, pageNum, pageCount,
    });

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error obteniendo tracks");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("getTracks error:", e);
    return fail(res);
  }
};

/** POST /api/vss/alarms  (alarmas por rango y filtros) */
const getAlarms = async (req, res) => {
  try {
    const {
      beginTime,
      endTime,
      pageNum = 1,
      pageCount = 100,
      alarmType,     // opcional
      deviceId,      // opcional
    } = req.body || {};

    const data = await vss.post("/vss/alarm/apiFindAllByTime.action", {
      beginTime, endTime, pageNum, pageCount, alarmType, deviceId,
    });

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error obteniendo alarmas");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("getAlarms error:", e);
    return fail(res);
  }
};

/** POST /api/vss/video/search  (buscar archivos de video/foto) */
const searchVideoFiles = async (req, res) => {
  try {
    const {
      deviceId,
      beginTime,
      endTime,
      channelList,  // ej. "1,2"
      fileType,     // 0: all, 1: normal, 2: alarm, etc.
      location,     // 0: device, 1: server
      scheme,       // "http" | "https"
      pageNum = 1,
      pageCount = 200,
    } = req.body || {};

    const data = await vss.post("/vss/record/videoFileSearch.action", {
      deviceId, beginTime, endTime, channelList, fileType, location, scheme,
      pageNum, pageCount
    });

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error buscando videos");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("searchVideoFiles error:", e);
    return fail(res);
  }
};

/** POST /api/vss/alarms/evidence  (clips/frames asociados a alarmas) */
const getAlarmEvidence = async (req, res) => {
  try {
    const { alarmId } = req.body || {};
    const data = await vss.post("/vss/record/evidenceToRetrieve.action", {
      id: alarmId,
    });

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error recuperando evidencia");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("getAlarmEvidence error:", e);
    return fail(res);
  }
};

/** POST /api/vss/vehicle/control  (comandos: snapshot, PTZ, etc.) */
const vehicleControl = async (req, res) => {
  try {
    // La API admite varios "cmd": revisa tu matriz de comandos
    const payload = req.body || {};
    const data = await vss.post("/vss/vehicle/apiVehicleControl.action", payload);

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error enviando comando");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("vehicleControl error:", e);
    return fail(res);
  }
};

/** POST /api/vss/webdown/create  (crear tarea de descarga de video) */
const webdownCreate = async (req, res) => {
  try {
    const payload = req.body || {};
    const data = await vss.post("/vss/vss/webdownrecord/insert.action", payload);

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error creando tarea de descarga");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("webdownCreate error:", e);
    return fail(res);
  }
};

/** POST /api/vss/webdown/progress  (consulta progreso de tarea) */
const webdownProgress = async (req, res) => {
  try {
    const { taskId } = req.body || {};
    const data = await vss.post("/vss/vss/webdownrecord/findTaskProgress.action", { id: taskId });

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error consultando progreso");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("webdownProgress error:", e);
    return fail(res);
  }
};

/** POST /api/vss/webdown/list  (listar tareas) */
const webdownList = async (req, res) => {
  try {
    const {
      pageNum = 1,
      pageCount = 50,
      status,   // opcional
    } = req.body || {};

    const data = await vss.post("/vss/vss/webdownrecord/findPage.action", {
      pageNum, pageCount, status
    });

    if (data.code !== 0) {
      return fail(res, 502, data.msg || "Error listando tareas");
    }
    return ok(res, { data: data.data });
  } catch (e) {
    console.error("webdownList error:", e);
    return fail(res);
  }
};

module.exports = {
  health,
  login,
  listDevices,
  getDeviceStatus,
  getTracks,
  getAlarms,
  searchVideoFiles,
  getAlarmEvidence,
  vehicleControl,
  webdownCreate,
  webdownProgress,
  webdownList,
};