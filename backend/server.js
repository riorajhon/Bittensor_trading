import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import subnetsRouter from './routes/subnets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bittensor-dashboard';
const clientDist = path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json());
app.use('/api/subnets', subnetsRouter);

app.get('/api/price', async (req, res) => {
  try {
    const r = await fetch('https://taostats.io/api/price/price');
    const json = await r.json();
    res.json(json);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Serve built client (after npm run build in client/)
const clientBuilt = fs.existsSync(clientDist);
if (clientBuilt) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (e) {
    console.error('MongoDB connection error:', e.message);
  }
  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    if (clientBuilt) console.log(`Client served at http://localhost:${PORT}`);
  });
}

start();
