

const validateTripFields = (req, res, next) => {
  const {
    date,
    time,
    origin,
    destination,
    seats
  } = req.body;

  if (!date || !time || !origin || !destination || !seats?.cama || !seats?.semicama) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const cama = Number(seats.cama.quantity);
  const semicama = Number(seats.semicama.quantity);
  const total = cama + semicama;

  if (total === 0) {
    return res.status(400).json({ error: "Debe haber al menos un asiento" });
  }

  req.body.totalSeats = total;
  req.body.availableSeats = {
    cama,
    semicama
  };

  next();
};

module.exports = {
    validateTripFields
}