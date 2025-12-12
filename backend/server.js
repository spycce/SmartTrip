const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { searchHotels } = require('./services/tripAdvisorService');
const multer = require('multer');

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
  }],
  isShared: { type: Boolean, default: false }
});
const Trip = mongoose.model('Trip', tripSchema);

const photoSchema = new mongoose.Schema({
  userId: String,
  tripId: mongoose.Schema.Types.ObjectId,
  image: Buffer,
  contentType: String,
  isShared: { type: Boolean, default: false },
  caption: String,
  createdAt: { type: Date, default: Date.now }
});
const Photo = mongoose.model('Photo', photoSchema);

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

// Multer Config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// --- Social & Photo Routes ---

// Public Landing Feed (Shared Trips & Photos)
app.get('/api/public/landing', async (req, res) => {
  try {
    const sharedTrips = await Trip.find({ isShared: true }).limit(6).sort({ startDate: -1 });
    const sharedPhotos = await Photo.find({ isShared: true }).limit(10).sort({ createdAt: -1 });

    // Convert photo buffers to base64 for frontend
    const photosWithBase64 = sharedPhotos.map(p => ({
      ...p.toObject(),
      image: `data:${p.contentType};base64,${p.image.toString('base64')}`
    }));

    res.json({ trips: sharedTrips, photos: photosWithBase64 });
  } catch (err) {
    console.error('Landing Feed Error:', err);
    res.status(500).send('Error fetching public feed');
  }
});

// Toggle Trip Sharing
app.post('/api/trips/:id/share', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).send('Trip not found');

    trip.isShared = !trip.isShared;
    await trip.save();
    res.json({ isShared: trip.isShared });
  } catch (err) {
    res.status(500).send('Error toggling share status');
  }
});

// Upload Photo to Trip
app.post('/api/trips/:id/photos', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No image uploaded');

    const newPhoto = new Photo({
      userId: req.user.id,
      tripId: req.params.id,
      image: req.file.buffer,
      contentType: req.file.mimetype,
      caption: req.body.caption || '',
      isShared: req.body.isShared === 'true'
    });

    await newPhoto.save();

    res.json({
      ...newPhoto.toObject(),
      image: `data:${newPhoto.contentType};base64,${newPhoto.image.toString('base64')}`
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).send('Error uploading photo');
  }
});

// Get Photos for a Trip
app.get('/api/trips/:id/photos', auth, async (req, res) => {
  try {
    const photos = await Photo.find({ tripId: req.params.id });

    const photosWithBase64 = photos.map(p => ({
      ...p.toObject(),
      image: `data:${p.contentType};base64,${p.image.toString('base64')}`
    }));

    res.json(photosWithBase64);
  } catch (err) {
    res.status(500).send('Error fetching photos');
  }
});

// Toggle Photo Sharing
app.put('/api/photos/:photoId/share', auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.photoId, userId: req.user.id });
    if (!photo) return res.status(404).send('Photo not found');

    photo.isShared = !photo.isShared;
    await photo.save();
    res.json({ isShared: photo.isShared });
  } catch (err) {
    res.status(500).send('Error updating photo share status');
  }
});

// Delete Photo
app.delete('/api/photos/:id', auth, async (req, res) => {
  try {
    await Photo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.send('Deleted');
  } catch (err) {
    res.status(500).send('Error deleting photo');
  }
});

// Update Photo Caption
app.put('/api/photos/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!photo) return res.status(404).send('Photo not found');

    photo.caption = req.body.caption;
    await photo.save();

    // Return properly formatted image similarly to other endpoints
    res.json({
      ...photo.toObject(),
      image: `data:${photo.contentType};base64,${photo.image.toString('base64')}`
    });
  } catch (err) {
    res.status(500).send('Error updating caption');
  }
});

// Fetch user albums (trips + cover photo)
app.get('/api/albums', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ startDate: -1 });
    const albums = await Promise.all(trips.map(async (trip) => {
      const photoCount = await Photo.countDocuments({ tripId: trip._id });
      const coverPhoto = await Photo.findOne({ tripId: trip._id }).sort({ createdAt: -1 });

      let coverImage = null;
      if (coverPhoto) {
        coverImage = `data:${coverPhoto.contentType};base64,${coverPhoto.image.toString('base64')}`;
      }

      return {
        tripId: trip._id,
        title: `${trip.from} to ${trip.to}`,
        startDate: trip.startDate,
        photoCount,
        coverImage
      };
    }));
    res.json(albums);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching albums');
  }
});

// Public Trip View
app.get('/api/public/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, isShared: true });
    if (!trip) return res.status(404).send('Trip not found or not shared');
    res.json({ ...trip.toObject(), id: trip._id });
  } catch (err) {
    res.status(500).send('Error fetching public trip');
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

// Hotel Search Endpoint
app.get('/api/hotels/search', async (req, res) => {
  const { city, checkIn, checkOut } = req.query;
  if (!city) return res.status(400).send('City is required');

  console.log(`Searching hotels in ${city}...`);
  try {
    const hotels = await searchHotels(city, checkIn, checkOut);
    res.json(hotels);
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).send('Search failed');
  }
});

// Hotel Details Endpoint
const { getHotelDetails } = require('./services/tripAdvisorService');
app.get('/api/hotels/details', async (req, res) => {
  const { hotelId, checkIn, checkOut, adults, rooms } = req.query;
  if (!hotelId) return res.status(400).send('HotelId is required');

  try {
    const details = await getHotelDetails(hotelId, checkIn, checkOut, adults, rooms);
    res.json(details);
  } catch (error) {
    console.error('Details fetch failed:', error);
    res.status(500).send('Failed to fetch hotel details');
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));