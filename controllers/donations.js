// controllers/donations.js
const Donation = require('../models/Donation');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');


module.exports = function (io) {
  return {
    createDonation: async (req, res) => {
      try {
        const newDonation = new Donation(req.body);
        await newDonation.save();
        io.emit('donationAdded', newDonation); // Emit to all clients
        res.status(201).json(newDonation);

        // Prepare nodemailer transport with hardcoded credentials
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'eliopace68@gmail.com',
            pass: 'wouo tbjd wayt oeek' // Direct use as specified
          }
        });

        const mailOptions = {
          from: 'eliopace68@gmail.com',
          to: newDonation.email,
          subject: 'Thank you for your donation',
          html: `<p>Thank you for reaching out to Swara Foundation and placing your trust in us. We are deeply committed to serving and uplifting the lives of children.</p>
                 <p>Your chosen date is <b>${newDonation.date}(YYYY-MM-DD)</b>, and the time slot <b>${newDonation.timeSlot}</b> has been noted. Your support inspires us to work harder every day.</p>
                 <p>Thank you for being a part of our journey.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Confirmation email sent:', info.response);
          }
        });

      } catch (err) {
        console.error('Error in creating donation:', err);
        res.status(400).json({ message: err.message });
      }
    },
    getDonations: async (req, res) => {
      try {
        const donations = await Donation.find().sort({ date: 1, timeSlot: 1 });
        res.status(200).json(donations);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    deleteDonation: async (req, res) => {
      try {
        const donation = await Donation.findById(req.params.id);
        donation.deleted = true;
        await donation.save();
        io.emit('donationUpdated', donation); // Emit to all clients
        res.status(200).json({ message: 'Donation moved to trash' });
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    completeDonation: async (req, res) => {
      try {
        const donation = await Donation.findById(req.params.id);
        donation.status = 'Completed';
        donation.completedAt = new Date();
        await donation.save();
        io.emit('donationUpdated', donation); // Emit to all clients
        res.status(200).json(donation);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    restoreDonation: async (req, res) => {
      try {
        const donation = await Donation.findById(req.params.id);
        donation.deleted = false;
        await donation.save();
        io.emit('donationUpdated', donation); // Emit to all clients
        res.status(200).json(donation);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    checkAvailability: async (req, res) => {
      try {
        const { date, timeSlot, pincode } = req.query;

        // Find donations with the same date and time slot
        const existingDonation = await Donation.findOne({ date, timeSlot, deleted: false });

        if (existingDonation) {
          // If pincode is different and time slot is the same, deny
          if (existingDonation.pincode !== pincode) {
            res.status(200).json({ available: false });
          } else {
            // If pincode, date, and time slot are the same, allow
            res.status(200).json({ available: true });
          }
        } else {
          // If no existing donation with the same date and time slot, allow
          res.status(200).json({ available: true });
        }
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    updateDonation: async (req, res) => {
      try {
        const updatedDonation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        io.emit('donationUpdated', updatedDonation); // Emit to all clients
        res.status(200).json(updatedDonation);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    downloadDonationsExcel: async (req, res) => {
      try {
        const { columns } = req.body;
        const donations = await Donation.find();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Donations');

        // Add columns dynamically based on selected columns
        worksheet.columns = columns.map(col => ({
          header: col.charAt(0).toUpperCase() + col.slice(1),
          key: col,
          width: 20
        }));

        // Add rows
        donations.forEach(donation => {
          const row = {};
          columns.forEach(col => {
            row[col] = donation[col];
          });
          worksheet.addRow(row);
        });

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('donations.xlsx');
        res.send(buffer);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
    // SEND CUSTOM MESSAGE EMAILS TO EVERYONE
    sendEmails: async (req, res) => {
      const { message } = req.body; // Get message from request body
  
      try {
        // Fetch all email addresses from the database
        const donations = await Donation.find();
        const emails = donations.map(donation => donation.email);
  
        // Setup nodemailer transport
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'eliopace68@gmail.com',
            pass: 'wouo tbjd wayt oeek' // Replace with actual password
          }
        });
  
        // Mail options
        const mailOptions = {
          from: 'eliopace68@gmail.com',
          to: emails.join(','), // Join emails into a comma-separated string
          subject: 'Upcoming Event Notification',
          text: message
        };
  
        // Send the email
        await transporter.sendMail(mailOptions);
        res.status(200).send('Emails sent successfully'); // Send success response
      } catch (error) {
        console.error('Error sending emails:', error); // Log error
        res.status(500).send('Failed to send emails'); // Send error response
      }
    },
  };

};
