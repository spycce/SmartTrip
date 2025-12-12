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
  coordinates: Object,
  transportHubs: {
    airport: { name: String, address: String },
    busStand: { name: String, address: String },
    taxiStand: { name: String, address: String },
    railwayStation: { name: String, address: String }
  },
  reviews: [{
    userId: String,
    userName: String,
    rating: Number, // 1-5
    comment: String,
    date: { type: Date, default: Date.now }
  }]
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
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
  if (!user) return res.status(400).send('Login failed: User not found in database');
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

app.post('/api/trips/:id/reviews', auth, async (req, res) => {
  const { userName, rating, comment } = req.body;

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).send('Trip not found');

    const newReview = {
      userId: req.user.id,
      userName,
      rating: Number(rating),
      comment,
      date: new Date()
    };

    trip.reviews = trip.reviews || [];
    trip.reviews.unshift(newReview); // Add to beginning

    await trip.save();
    res.json(trip.reviews);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).send('Error adding review');
  }
});

app.put('/api/trips/:id/reviews/:reviewId', auth, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).send('Trip not found');

    const review = trip.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).send('Review not found');

    if (review.userId !== req.user.id) {
      return res.status(403).send('Not authorized to edit this review');
    }

    review.rating = rating;
    review.comment = comment;
    await trip.save();
    res.json(trip.reviews);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).send('Error updating review');
  }
});

app.delete('/api/trips/:id/reviews/:reviewId', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).send('Trip not found');

    const review = trip.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).send('Review not found');

    if (review.userId !== req.user.id) {
      return res.status(403).send('Not authorized to delete this review');
    }

    review.deleteOne();
    await trip.save();
    res.json(trip.reviews);
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).send('Error deleting review');
  }
});

// Gemini Endpoint (Server-side proxy example)
// OpenRouter Endpoint (Proxy)
app.post('/api/trip/generate', auth, async (req, res) => {
  if (!OPENROUTER_API_KEY) return res.status(500).send('API Key missing');

  const { prompt } = req.body;
  console.log('Generating trip with prompt length:', prompt?.length);
  console.log('API Key present:', !!OPENROUTER_API_KEY);

  try {
    const response = await require('axios').post("https://openrouter.ai/api/v1/chat/completions", {
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "SmartTrip Planner",
        "Content-Type": "application/json"
      }
    });

    const content = response.data.choices[0]?.message?.content;
    res.json({ text: content });
  } catch (err) {
    console.error('OpenRouter Error:', err.response?.data || err.message);
    const upstreamError = err.response?.data?.error?.message || err.message;
    res.status(500).send(`OpenRouter Error: ${upstreamError}`);
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));