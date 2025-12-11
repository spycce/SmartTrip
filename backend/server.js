const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { GoogleGenAI } = require('@google/genai');

// --- Models ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const tripSchema = new mongoose.Schema({
  userId: String,
  from: String,
  to: String,
  startDate: Date,
  endDate: Date,
  mode: String,
  totalDays: Number,
  summary: String,
  totalCost: Number,
  expenses: Array,
  itinerary: Array,
  coordinates: Object
});
const Trip = mongoose.model('Trip', tripSchema);

// --- Config ---
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/smarttrip';
const API_KEY = process.env.API_KEY;

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// --- Middleware ---
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access Denied');
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// --- Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  try {
    await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ user: { id: user._id, name, email }, token });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(400).send('Error registering user');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send('User not found');
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).send('Invalid password');

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ user: { id: user._id, name: user.name, email }, token });
});

app.get('/api/trips', auth, async (req, res) => {
  const trips = await Trip.find({ userId: req.user.id });
  res.json(trips.map(trip => ({ ...trip.toObject(), id: trip._id })));
});

app.post('/api/trips', auth, async (req, res) => {
  const trip = new Trip({ ...req.body, userId: req.user.id });
  const savedTrip = await trip.save();
  res.json({ ...savedTrip.toObject(), id: savedTrip._id });
});

app.delete('/api/trips/:id', auth, async (req, res) => {
  await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  res.send('Deleted');
});

// Gemini Endpoint (Server-side proxy example)
app.post('/api/chat/generate-summary', auth, async (req, res) => {
  if (!API_KEY) return res.status(500).send('API Key missing');
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });
    res.json({ text: response.text });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));