const Bus = require("../models/Bus");
const Trip = require("../models/Trip");


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

    // Basic validations
    if (!date || !time || !routeId || !busId || !driver) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get bus + layout to calculate capacity
    const bus = await Bus.findById(busId).populate("layout").lean();
    if (!bus) return res.status(404).json({ error: "Bus not found" });

    // Capacity: use totalSeatCount if already stored, otherwise calculate from layout
    let capacity =
      typeof bus.totalSeatCount === "number" ? bus.totalSeatCount : 0;
    if (!capacity) {
      const countSeats = (deck = []) =>
        deck.filter((s) => s.type === "seat").length;
      const lower = countSeats(bus.layout?.lowerDeck);
      const upper = countSeats(bus.layout?.upperDeck);
      capacity = lower + upper;
    }

    // Remove duplicates (same name + document)
    const normalizeName = (s) =>
      String(s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    const normalizeDoc = (s) =>
      String(s || "").replace(/\D+/g, "").trim();

    const seen = new Set();
    const cleanedPassengers = [];

    for (const p of passengers) {
      const name = String(p.name || "").trim();
      const document = String(p.document || "").trim();
      if (!name || !document) continue;

      const key = `${normalizeName(name)}|${normalizeDoc(document)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      cleanedPassengers.push({
        name,
        document,
        seatNumber: p.seatNumber,
      });
    }

    // Check capacity
    if (cleanedPassengers.length > capacity) {
      return res.status(400).json({
        error: "Capacity exceeded",
        capacity,
        totalPassengers: cleanedPassengers.length,
      });
    }

    // Combine date+time into a Date object (UTC)
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

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error fetching trips" });
  }
};

module.exports = { 
  addTrip,
  getTrips

 };