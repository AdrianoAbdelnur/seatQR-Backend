const Bus = require("../models/Bus");
const BusLayout = require("../models/BusLayout");


const addLayout = async (req, res) => {
    try {
        console.log(req.body)
        const existing = await BusLayout.findOne({ name: req.body.name });
if (existing) {
  return res.status(400).json({ error: "Ya existe un layout con ese nombre." });
}
    const layout = new BusLayout(req.body);
    await layout.save();
    res.status(201).json({ message: "Layout guardado con éxito", id: layout._id });
  } catch (error) {
    console.error("Error al guardar layout:", error);
    res.status(500).json({ error: "Error al guardar layout" });
  }
}

const addBus = async (req, res) => {
  try {
    const { plate, description, layout } = req.body;

    const layoutDoc = await BusLayout.findById(layout).lean();
    if (!layoutDoc) return res.status(404).json({ error: "Layout not found" });

    const countSeats = (deck = []) => deck.filter(s => s.type === "seat").length;

    const lower = countSeats(layoutDoc.lowerDeck);
    const upper = countSeats(layoutDoc.upperDeck);
    const total = lower + upper;

    const newBus = new Bus({
      plate,
      description,
      layout,
      lowerDeckSeatCount: lower,
      upperDeckSeatCount: upper,
      totalSeatCount: total,
    });

    await newBus.save();
    res.status(201).json({ message: "Bus successfully created", id: newBus._id });
  } catch (error) {
    console.error("Error saving bus:", error);
    res.status(500).json({ error: "Error saving bus" });
  }
};

const getBusesLayout = async (req, res) => {
  try {
    const busesLayout = await BusLayout.find();
    console.log(busesLayout)
    res.status(200).json(busesLayout);
  } catch (error) {
    console.error("Error fetching buses:", error);
    res.status(500).json({ error: "Error fetching buses" });
  }
};

const getBuses = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, layoutId } = req.query;

    const filter = {};
    if (q) filter.plate = new RegExp(q, "i");   // búsqueda por patente
    if (layoutId) filter.layout = layoutId;     // filtrar por layout

    const skip = (Number(page) - 1) * Number(limit);

    const query = Bus.find(filter)
      .populate({ path: "layout", select: "name floors" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const [items, total] = await Promise.all([
      query,
      Bus.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching buses:", error);
    return res.status(500).json({ error: "Error fetching buses" });
  }
};


module.exports = {
    addLayout,
    addBus,
    getBusesLayout,
    getBuses
}
