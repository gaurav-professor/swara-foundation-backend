// controllers/donations.js
const Donation = require('../models/Donation');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const moment = require('moment');  // Importing moment


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
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
  <header style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
    <img src="https://i.imgur.com/EZEiPz2.jpeg" alt="Swara Foundation Logo" style="max-height: 50px;">
    <h1 style="margin: 10px 0; color: #333;">Swara Foundation</h1>
  </header>
  <section style="padding: 20px 0;">
    <p>Dear ${newDonation.title} ${newDonation.firstName} ${newDonation.lastName},</p>
    <p>Thank you for reaching out to Swara Foundation and placing your trust in us. Your generosity is a beacon of hope for the children we support.</p>
    <p>We have successfully scheduled your donation for <b>${moment(newDonation.date).format('DD-MM-YYYY')}</b>, during the time slot <b>${newDonation.timeSlot.split('-').map(time =>
      moment(time, 'HH').format('h A')
    ).join(' - ')}</b>. Your commitment to our cause is truly inspiring.</p>
    <p>We are excited to connect with you on the chosen date and look forward to the positive impact your support will bring. Thank you for being an integral part of our journey and for making a difference in the lives of those who need it most.</p>
    <p>With heartfelt gratitude,</p>
    <p>The Swara Foundation Team</p>
  </section>
  <footer style="text-align: center; padding: 10px 0; border-top: 1px solid #ddd;">
    <p style="margin: 10px 0;">Stay connected with us:</p>
    <a href="https://www.facebook.com/swarafoundation" style="margin: 0 10px;">
      <img src="https://img.icons8.com/color/48/000000/facebook.png" alt="Facebook" style="max-height: 30px;">
    </a>
    <a href="https://www.instagram.com/swarafoundation" style="margin: 0 10px;">
      <img src="https://img.icons8.com/color/48/000000/instagram-new.png" alt="Instagram" style="max-height: 30px;">
    </a>
    <a href="https://www.linkedin.com/company/swara-foundation" style="margin: 0 10px;">
      <img src="https://img.icons8.com/color/48/000000/linkedin.png" alt="LinkedIn" style="max-height: 30px;">
    </a>
  </footer>
</div>
`
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
    
        // Check if there are email addresses to send to
        if (emails.length === 0) {
          return res.status(400).send('No email addresses found.');
        }
    
        // Setup nodemailer transport
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'eliopace68@gmail.com',
            pass: 'wouo tbjd wayt oeek' // Replace with actual password
          }
        });
    
        // Function to send email in batches
        const sendEmailBatch = async (batch) => {
          const mailOptions = {
            from: 'eliopace68@gmail.com',
            to: batch.join(','), // Join emails into a comma-separated string
            subject: 'Upcoming Event Notification',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
            <header style="text-align: center; padding: 10px 0; border-bottom: 1px solid #ddd;">
              <img src="https://i.imgur.com/EZEiPz2.jpeg" alt="Swara Foundation Logo" style="max-height: 50px;">
              <h1 style="margin: 10px 0; color: #333;">Swara Foundation</h1>
            </header>
            <section style="padding: 20px 0;">
              <p style="font-size: 16px; line-height: 1.6;">${message}</p>
            </section>
                <footer style="text-align: center; padding: 10px 0; border-top: 1px solid #ddd;">
              <p style="margin: 10px 0;">Follow us on:</p>
              <a href="https://www.facebook.com/swarafoundation" style="margin: 0 10px;">
                <img src="https://img.icons8.com/color/48/000000/facebook.png" alt="Facebook" style="max-height: 30px;">
              </a>
              <a href="https://www.instagram.com/swarafoundation" style="margin: 0 10px;">
                <img src="https://img.icons8.com/color/48/000000/instagram-new.png" alt="Instagram" style="max-height: 30px;">
              </a>
              <a href="https://www.linkedin.com/company/swara-foundation" style="margin: 0 10px;">
                <img src="https://img.icons8.com/color/48/000000/linkedin.png" alt="LinkedIn" style="max-height: 30px;">
              </a>
            </footer>
          </div>
        `
          };
    
          await transporter.sendMail(mailOptions);
        };
    
        // Send emails in batches of 50 to avoid limits
        const batchSize = 50;
        for (let i = 0; i < emails.length; i += batchSize) {
          const batch = emails.slice(i, i + batchSize);
          await sendEmailBatch(batch);
        }
    
        res.status(200).send('Emails sent successfully'); // Send success response
      } catch (error) {
        console.error('Error sending emails:', error); // Log error
        res.status(500).send('Failed to send emails'); // Send error response
      }
    }
    
    
  };

};