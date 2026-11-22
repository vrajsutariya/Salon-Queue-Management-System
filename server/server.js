import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import salonRoutes from './routes/salonRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import barberRoutes from './routes/barberRoutes.js';
import { seedDatabase } from './seeds/seedData.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_queue';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// 1. Middlewares
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// 2. Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Attach socket.io to req for controllers/routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 3. API Routes
app.use('/api/salon', salonRoutes);
app.use('/api/services', (req, res, next) => {
  // redirect or forward to salon/services
  req.url = '/services';
  salonRoutes(req, res, next);
});
app.use('/api/barbers', barberRoutes);
app.use('/api/queue', queueRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'healthy',
    service: 'Salon Queue Management API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoStatus,
    activeSocketClients: io.engine.clientsCount,
  });
});

// Root fallback route
app.get('/', (req, res) => {
  res.json({
    message: 'Crown & Blade Salon Queue Management System API is running.',
    healthCheck: '/api/health',
    endpoints: [
      '/api/salon/live-status',
      '/api/services',
      '/api/barbers',
      '/api/queue/join',
      '/api/queue/:id',
    ],
  });
});

// 4. Database Connection & Server Startup
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[MongoDB] Successfully connected to database');
    await seedDatabase();
  } catch (err) {
    console.warn('[MongoDB] Warning: MongoDB connection failed. Running in offline/memory mode.');
    console.warn(`[MongoDB] Details: ${err.message}`);
  }

  server.listen(PORT, () => {
    console.log(`[Server] Crown & Blade Server listening on http://localhost:${PORT}`);
    console.log(`[Server] Live status at http://localhost:${PORT}/api/salon/live-status`);
  });
};

startServer();

export { app, server, io };
