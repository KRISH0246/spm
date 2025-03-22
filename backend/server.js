const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/smart_parking", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("🔥 MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Booking Schema
const bookingSchema = new mongoose.Schema({
  user: String,
  slot: String,
  startTime: Date,
  endTime: Date,
  status: { type: String, default: "Active" },
  penalty: { type: Number, default: 0 },
  paid: { type: Boolean, default: false } // ✅ Added "paid" status
});

const Booking = mongoose.model("Booking", bookingSchema);

// ✅ API: Check & Apply Penalty for Expired Bookings
const applyPenalties = async () => {
  const now = new Date();
  const expiredBookings = await Booking.find({ endTime: { $lt: now }, status: "Active" });

  for (let booking of expiredBookings) {
    const extraTime = Math.ceil((now - new Date(booking.endTime)) / (60 * 60 * 1000)); // Extra hours used
    const penaltyAmount = extraTime * 50; // ₹50 per extra hour

    await Booking.findByIdAndUpdate(booking._id, {
      status: "Expired",
      penalty: penaltyAmount
    });

    console.log(`🚨 Penalty Applied: ₹${penaltyAmount} for ${booking.user} (Slot ${booking.slot})`);
  }
};

// ✅ Run Penalty Check Every Minute
setInterval(applyPenalties, 60000);

// ✅ API: Get All Bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
});

// ✅ API: Book a Parking Slot
app.post("/api/book", async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();
    res.json({ message: "Booking successful!", booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: "Error booking slot", error });
  }
});

// ✅ API: Cancel a Booking
app.delete("/api/book/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling booking", error });
  }
});

// ✅ API: Create Stripe Payment Session
app.post("/api/payment", async (req, res) => {
  const { bookingId, amount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Parking Slot Booking - ${bookingId}`,
            },
            unit_amount: amount * 100, // Convert ₹ to paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/success?bookingId=${bookingId}`,
      cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe Error:", error);
    res.status(500).json({ message: "Payment failed", error });
  }
});

// ✅ API: Mark Booking as Paid After Successful Payment
app.post("/api/payment/success", async (req, res) => {
  const { bookingId } = req.body;

  try {
    await Booking.findByIdAndUpdate(bookingId, { paid: true });
    res.json({ message: "Payment recorded successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error updating payment status", error });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));