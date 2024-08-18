// routes/donations.js
const express = require('express');
const router = express.Router();

module.exports = function(io) {
  const donationController = require('../controllers/donations')(io);

  router.post('/', donationController.createDonation);
  router.get('/', donationController.getDonations);
  router.put('/:id/delete', donationController.deleteDonation); 
  router.put('/:id/complete', donationController.completeDonation);
  router.get('/check-availability', donationController.checkAvailability);
  router.put('/:id/restore', donationController.restoreDonation);
  router.put('/:id', donationController.updateDonation);

  // Download
  router.post('/download/excel', donationController.downloadDonationsExcel);

  // Route to handle sending emails
  router.post('/send-emails', donationController.sendEmails);

  return router;
};
