import Booking from '../models/Booking.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import { updateVenueStatus } from './venueController.js';

// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const { venueId, userId, startDate, numberOfGuests, totalPrice, bookingType } = req.body;
        
        // Validate bookingType
        if (!bookingType || !['day', 'night'].includes(bookingType)) {
            return res.status(400).json({ message: 'Booking type must be either "day" or "night"' });
        }

        // Check if venue exists
        const venue = await Venue.findById(venueId);
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }

        // Check for overlapping bookings
        const existingBookings = await Booking.find({
            venueId,
            status: 'confirmed',
            bookingType,
            startDate: new Date(startDate)
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({ 
                message: 'Venue is already booked for the selected date/time',
                conflictingBookings: existingBookings
            });
        }

        // Check if user has sufficient balance
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.balance < totalPrice) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct amount from user's balance
        user.balance -= totalPrice;
        await user.save();

        const booking = new Booking({
            venueId,
            userId,
            startDate,
            numberOfGuests,
            totalPrice,
            bookingType,
            status: 'confirmed'
        });

        const savedBooking = await booking.save();
        
        res.status(201).json({
            booking: savedBooking,
            newBalance: user.balance
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all bookings
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('venueId', 'name')  // Populate venue name
            .populate('userId', 'name');  // Populate user name
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a specific booking
export const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('venueId', 'name')  // Populate venue name
            .populate('userId', 'name');  // Populate user name
            
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a booking
export const updateBooking = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const oldStatus = booking.status;
        booking.status = status;
        const updatedBooking = await booking.save();

        // If booking is cancelled, update venue status back to Available and refund balance
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            await updateVenueStatus(booking.venueId, 'Available');
            
            // Refund the balance to the user
            const user = await User.findById(booking.userId);
            if (user) {
                user.balance += booking.totalPrice;
                await user.save();
                
                return res.status(200).json({
                    booking: updatedBooking,
                    newBalance: user.balance
                });
            }
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update venue status back to Available before deleting the booking
        await updateVenueStatus(booking.venueId, 'Available');
        
        await booking.deleteOne();
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 