// server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Specify your frontend URL here
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

const donationRoutes = require('./routes/donations')(io);
app.use('/api/donations', donationRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect("mongodb+srv://annie29:anurag@cluster0.oo3kmna.mongodb.net/donation").then(() => {
  console.log('MongoDB connected successfully');
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Connection error', err.message);
});
