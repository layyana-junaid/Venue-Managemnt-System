import Venue from '../models/Venue.js';

// Get all venues (filter by location)
export const getAllVenues = async (req, res) => {
  try {
    const { location } = req.query;
    const filter = location ? { location } : {};
    const venues = await Venue.find(filter);
    res.status(200).json(venues);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single venue
export const getVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.status(200).json(venue);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new venue
export const createVenue = async (req, res) => {
  try {
    const venueData = {
      ...req.body,
      status: 'Available' // Always set initial status as Available
    };
    const venue = new Venue(venueData);
    const savedVenue = await venue.save();
    res.status(201).json(savedVenue);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update venue status
export const updateVenueStatus = async (venueId, status) => {
  try {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }
    venue.status = status;
    await venue.save();
    return venue;
  } catch (error) {
    throw error;
  }
};

// Delete venue
export const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.status(200).json({ message: 'Venue deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update venue
export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Don't allow status to be updated through this endpoint
    delete updateData.status;
    
    const venue = await Venue.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.status(200).json(venue);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};