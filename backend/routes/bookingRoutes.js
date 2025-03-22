const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

// 📌 Create a new booking
router.post("/book", async (req, res) => {
  try {
    const { user, slot, startTime, endTime } = req.body;

    const newBooking = new Booking({ user, slot, startTime, endTime });
    await newBooking.save();

    res.status(201).json({ message: "Booking successful!", booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: "Error booking slot", error });
  }
});

// 📌 Get all bookings (for Admin Dashboard)
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
});

// 📌 Apply Penalty for Expired Bookings
router.put("/apply-penalty/:id", async (req, res) => {
  try {
    const { penalty } = req.body;
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { penalty, status: "Penalty Applied" } },
      { new: true }
    );
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: "Error applying penalty", error });
  }
});

module.exports = router;