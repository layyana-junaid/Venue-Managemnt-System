import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, enum: ["Gulshan", "North", "Johar", "Clifton"], required: true },
  dayPrice: { type: Number, required: true },
  nightPrice: { type: Number, required: true },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ["Available", "Booked"], default: "Available", required: true },
  images: [String],
  coordinates: { 
    lat: { type: Number, required: true },
    lng: { type: Number, required: true } 
  }
});

export default mongoose.model('Venue', venueSchema);