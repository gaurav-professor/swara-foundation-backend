const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  title: { type: String, enum: ['Mr', 'Mrs', 'Miss', 'Ms', 'Other'], required: true },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfRequest: { type: Date, default: Date.now }, // Added Date of Request field
  description: String,
  weight: String,
  address: String,
  pincode: String,
  date: String,
  timeSlot: String,
  status: { type: String, default: 'Uncomplete' },
  isActive: { type: Boolean, default: true },
  attendedBy: { type: String, default: "" },
  pickupRemarks: { type: String, default: "" },
  deleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Donation', donationSchema);
