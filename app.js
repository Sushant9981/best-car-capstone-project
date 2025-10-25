const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3030;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const reviewsJsonPath = path.join(__dirname, 'reviews.json');
const dealersJsonPath = path.join(__dirname, 'dealerships.json');

let reviews_data = null;
let dealerships_data = null;

try {
  reviews_data = JSON.parse(fs.readFileSync(reviewsJsonPath, 'utf8'));
} catch (err) {
  console.error(`❌ Could not read reviews.json:`, err.message);
}

try {
  dealerships_data = JSON.parse(fs.readFileSync(dealersJsonPath, 'utf8'));
} catch (err) {
  console.error(`❌ Could not read dealerships.json:`, err.message);
}

const mongoUri = process.env.MONGO_URI || 'mongodb://mongo_db:27017/dealershipsDB';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully:', mongoUri);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

const Reviews = require('./review');
const Dealerships = require('./dealership');

(async () => {
  if (!reviews_data || !dealerships_data) {
    console.warn('⚠️ Skipping seeding because JSON files were not loaded.');
    return;
  }

  try {
    await mongoose.connection.asPromise();
    await Reviews.deleteMany({});
    await Dealerships.deleteMany({});

    await Reviews.insertMany(reviews_data.reviews || reviews_data);
    await Dealerships.insertMany(dealerships_data.dealerships || dealerships_data);

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
})();

app.get('/', (req, res) => res.send('Welcome to the Mongoose API'));

app.get('/fetchReviews', async (req, res) => {
  try {
    const docs = await Reviews.find();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const dealerId = parseInt(req.params.id);
    const docs = await Reviews.find({ dealership: dealerId });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

app.get('/fetchDealers', async (req, res) => {
  try {
    const dealers = await Dealerships.find();
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealers' });
  }
});

app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const state = req.params.state;
    const dealersByState = await Dealerships.find({ state: state });
    res.json(dealersByState);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealers by state' });
  }
});

app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const dealerId = parseInt(req.params.id);
    const dealer = await Dealerships.findOne({ id: dealerId });
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealer by id' });
  }
});

app.post('/insert_review', async (req, res) => {
  const data = req.body;
  try {
    const documents = await Reviews.find().sort({ id: -1 });
    const new_id = (documents[0]?.id ?? 0) + 1;
    const review = new Reviews({ id: new_id, ...data });
    const savedReview = await review.save();
    res.json(savedReview);
  } catch (error) {
    res.status(500).json({ error: 'Error inserting review' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});