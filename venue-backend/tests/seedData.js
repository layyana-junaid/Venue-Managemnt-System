import mongoose from 'mongoose';
import Venue from '../models/Venue.js';

const seedVenue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create a test venue
    const testVenue = {
      name: "Grand Ballroom",
      location: "Gulshan",
      dayPrice: 5000,
      nightPrice: 8000,
      capacity: 100,
      images: ["ballroom1.jpg", "ballroom2.jpg"],
      coordinates: {
        lat: 24.8607,
        lng: 67.0011
      }
    };

    const venue = await Venue.create(testVenue);
    console.log('Test venue created with ID:', venue._id);
    
    await mongoose.connection.close();
    return venue._id;
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

export default seedVenue; 