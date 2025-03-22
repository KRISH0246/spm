const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: String, required: true }, // User who booked
  slot: { type: String, required: true }, // Parking slot (e.g., A1, B2)
  startTime: { type: Date, required: true }, // Start time of booking
  endTime: { type: Date, required: true }, // End time of booking
  status: { type: String, default: "Active" }, // Active/Expired
  penalty: { type: Number, default: 0 }, // Penalty if time exceeded
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;