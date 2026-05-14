const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const uploadRoutes = require('./routes/upload');
const jobsRoutes = require('./routes/jobs');
const socket = require('./socket');
const rateLimit = require('./middleware/rateLimit');

const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Rate limiting for upload and cancel endpoints
app.use('/upload', rateLimit);
app.use('/cancel', rateLimit);

app.get('/', (req, res) => {
  res.send('Live Status Tracker server is running');
});

// Routes
app.use('/', uploadRoutes);
app.use('/', jobsRoutes);

// Basic error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});
socket.init(io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
