const Bus = require("../models/Bus");
const Trip = require("../models/Trip");


const normalizeName = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();


const normalizeDoc = (s = "") =>
  String(s).replace(/[.\-\s]/g, "").trim().toUpperCase();


const addTrip = async (req, res) => {
  try {
    const {
      date,
      time,
      routeId,
      busId,
      driver,
      notes,
      passengers = [],
    } = req.body;

    if (!date || !time || !routeId || !busId || !driver) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bus = await Bus.findById(busId).populate("layout").lean();
    if (!bus) return res.status(404).json({ error: "Bus not found" });

  
    let capacity =
      typeof bus.totalSeatCount === "number" ? bus.totalSeatCount : 0;
    if (!capacity) {
      const countSeats = (deck = []) =>
        deck.filter((s) => s.type === "seat").length;
      const lower = countSeats(bus.layout?.lowerDeck);
      const upper = countSeats(bus.layout?.upperDeck);
      capacity = lower + upper;
    }

    const cleanDoc = (s) => String(s || "").replace(/\D+/g, "").trim();

    const seen = new Set();
    const cleanedPassengers = [];

    for (const p of passengers) {
      const name = String(p.name || "").trim();
      const document = String(p.document || "").trim();
      if (!name || !document) continue;

      const key = `${normalizeName(name)}|${cleanDoc(document)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      cleanedPassengers.push({
        name,
        document,
        seatNumber: p.seatNumber,
      });
    }


    if (cleanedPassengers.length > capacity) {
      return res.status(400).json({
        error: "Capacity exceeded",
        capacity,
        totalPassengers: cleanedPassengers.length,
      });
    }


    const departureAt = new Date(`${date}T${time}:00Z`);

    const trip = await Trip.create({
      date,
      time,
      routeId,
      bus: bus._id,
      driver,
      notes,
      passengers: cleanedPassengers,
      totalPassengers: cleanedPassengers.length,
      capacity,
      departureAt,
    });

    return res
      .status(201)
      .json({ message: "Trip created successfully", id: trip._id });
  } catch (e) {
    console.error("Error creating trip:", e);
    return res.status(500).json({ error: "Error creating trip" });
  }
};


const getTrips = async (req, res) => {
  try {
    const { page = 1, limit = 10, q, routeId } = req.query;
    const filter = {};
    if (routeId) filter.routeId = routeId;
    if (q) {
      filter.$or = [
        { driver: new RegExp(q, "i") },
        { notes: new RegExp(q, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Trip.find(filter)
        .populate({ path: "bus", select: "plate description" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Trip.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error fetching trips" });
  }
};


const boardPassenger = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({ ok: false, message: "Falta document" });
    }
    const targetDoc = normalizeDoc(document);

    // Traigo pasajeros para ubicar índice por documento normalizado
    const trip = await Trip.findOne(
      { _id: tripId, "passengers.document": { $exists: true } },
      { passengers: 1 }
    ).lean();

    if (!trip) return res.status(404).json({ ok: false, message: "Trip no encontrado" });

    const idx = (trip.passengers || []).findIndex(
      (p) => normalizeDoc(p.document) === targetDoc
    );
    if (idx === -1) {
      return res.status(404).json({ ok: false, message: "Pasajero no pertenece a este trip" });
    }

    const originalDoc = trip.passengers[idx].document;

    const updated = await Trip.findOneAndUpdate(
      { _id: tripId, [`passengers.${idx}.document`]: originalDoc },
      { $set: { [`passengers.${idx}.boarded`]: true } },
      { new: true, projection: { passengers: 1 } }
    ).lean();

    const passenger = updated.passengers[idx];
    return res.json({ ok: true, passenger });
  } catch (err) {
    console.error("boardPassenger error:", err);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
};


const setPassengerSeat = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { document, seatLevel, seatNumber, plate, alsoBoard } = req.body;

    console.log("HOLA",document, seatNumber, alsoBoard, tripId)

    if (!document || seatNumber == null) {
      return res.status(400).json({ ok: false, message: "Faltan document o seatNumber" });
    }
    if (!Number.isInteger(seatNumber) || seatNumber < 0) {
      return res.status(400).json({ ok: false, message: "seatNumber inválido" });
    }

    const targetDoc = normalizeDoc(document);

    const trip = await Trip.findById(tripId, { passengers: 1, capacity: 1 }).lean();
    if (!trip) return res.status(404).json({ ok: false, message: "Trip no encontrado" });

    const passengers = trip.passengers || [];
    const idx = passengers.findIndex((p) => normalizeDoc(p.document) === targetDoc);
    if (idx === -1) {
      return res.status(404).json({ ok: false, message: "Pasajero no pertenece a este trip" });
    }

    
    const takenBy = passengers.find((p, i) => i !== idx && p.seatNumber === seatNumber);
    if (takenBy) {
      return res.status(409).json({
        ok: false,
        message: `El asiento ${seatNumber} ya está asignado a ${takenBy.name}`,
      });
    }

    const updateSet = {
      [`passengers.${idx}.seat`]: {
        number: seatNumber,
        level: seatLevel,   
        plate: plate,   
      }
    };
    if (alsoBoard === true) {
      updateSet[`passengers.${idx}.boarded`] = true;
    }

    const originalDoc = passengers[idx].document;

    console.log("OTRO",updateSet, originalDoc)

    const updated = await Trip.findOneAndUpdate(
      { _id: tripId, [`passengers.${idx}.document`]: originalDoc },
      { $set: updateSet },
      { new: true}
    ).lean();

    const passenger = updated.passengers[idx];
    return res.json({ ok: true, passenger });
  } catch (err) {
    console.error("setPassengerSeat error:", err);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
};


const updateTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'started', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ ok: false, message: `Estado inválido: ${status}` });
    }

    const trip = await Trip.findById(tripId).select('bus');
    if (!trip) {
      return res.status(404).json({ ok: false, message: 'Trip no encontrado' });
    }

    if (status === 'started') {
      const otherTrip = await Trip.findOne({
        _id: { $ne: tripId },           
        bus: trip.bus,                  
        tripStatus: 'started'            
      });

      if (otherTrip) {
        return res.status(409).json({
          ok: false,
          message: `La unidad ya tiene un viaje iniciado. ID: ${otherTrip._id}`,
        });
      }
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      { tripStatus: status },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ ok: false, message: 'Trip no encontrado al actualizar' });
    }

    return res.json({ ok: true, status: updatedTrip.tripStatus });
  } catch (err) {
    console.error("updateTripStatus error:", err);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
};

module.exports = {
  addTrip,
  getTrips,
  boardPassenger,
  setPassengerSeat,
  updateTripStatus
};