import { useState, useEffect } from 'react';
import { venueService, bookingService, authService } from '../services/api';
import VenueMap from './VenueMap';

const Table = ({ updateBalance }) => {
const loggedInUser = JSON.parse(localStorage.getItem('user'));
const userId = loggedInUser?.user?.id;
console.log('userId', userId)
const [selectedStatus, setSelectedStatus] = useState('all');
const [selectedLocation, setSelectedLocation] = useState('all');
const [selectedCapacity, setSelectedCapacity] = useState('all');
const [venues, setVenues] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedVenue, setSelectedVenue] = useState(null);
const [showMap, setShowMap] = useState(false);
const [showBookingModal, setShowBookingModal] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [bookingData, setBookingData] = useState({
venueId: '',
userId: userId,
startDate: '',
numberOfGuests: 1,
bookingType: 'day' // 'day' or 'night'
});
const [isSubmitting, setIsSubmitting] = useState(false);
const [bookingError, setBookingError] = useState(null);
const [bookings, setBookings] = useState([]);
const [bookingConflict, setBookingConflict] = useState(false);

console.log('bookingData', bookingData)

useEffect(() => {
const fetchVenues = async () => {
try {
const data = await venueService.getVenues();
console.log(data);
setVenues(data);
setLoading(false);
} catch (err) {
setError(err.message);
setLoading(false);
}
};

fetchVenues();
}, []);

// Fetch bookings
useEffect(() => {
const fetchBookings = async () => {
try {
const data = await bookingService.getBookings();
setBookings(data);
} catch (err) {
// Optionally handle error
}
};

fetchBookings();
}, []);

// Add new useEffect for checking booking end dates
useEffect(() => {
const checkBookingEndDates = async () => {
try {
const bookings = await bookingService.getBookings();
const currentDate = new Date();

// Find bookings that have ended
const endedBookings = bookings.filter(booking => {
const endDate = new Date(booking.endDate);
return endDate < currentDate && booking.status !== 'cancelled';
});

// Update venue status for ended bookings
for (const booking of endedBookings) {
if (booking.venueId) {
// Update venue status to Available
await venueService.updateVenue(booking.venueId, { status: 'Available' });
}
}

// Refresh venues list if any bookings ended
if (endedBookings.length > 0) {
const updatedVenues = await venueService.getVenues();
setVenues(updatedVenues);
}
} catch (error) {
console.error('Error checking booking end dates:', error);
}
};

// Check every minute
const interval = setInterval(checkBookingEndDates, 60000);

// Initial check
checkBookingEndDates();

return () => clearInterval(interval);
}, []);

// Get unique locations from venues
const locations = [...new Set(venues.map(venue => venue.location))];

// Define capacity ranges
const capacityRanges = [
{ label: 'All Capacities', value: 'all' },
{ label: '100-200 people', value: '100-200', min: 100, max: 200 },
{ label: '300-400 people', value: '300-400', min: 300, max: 400 },
{ label: '500-600 people', value: '500-600', min: 500, max: 600 },
{ label: '700-800 people', value: '700-800', min: 700, max: 800 },
{ label: '900-1000 people', value: '900-1000', min: 900, max: 1000 },
{ label: '1000+ people', value: '1000+', min: 1000, max: Infinity }
];

const filteredVenues = venues.filter(venue => {
const statusMatch = selectedStatus === 'all' || venue.status === selectedStatus;
const locationMatch = selectedLocation === 'all' || venue.location === selectedLocation;

let capacityMatch = true;
if (selectedCapacity !== 'all') {
const range = capacityRanges.find(r => r.value === selectedCapacity);
if (range) {
capacityMatch = venue.capacity >= range.min && venue.capacity <= range.max;
}
}

return statusMatch && locationMatch && capacityMatch;
});

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isVenueBooked = (venueId) => {
  if (!bookingData.startDate) return false;
  const selectedDate = new Date(bookingData.startDate);
  const conflicts = bookings.filter(b => {
    const bVenueId = (typeof b.venueId === 'object' && b.venueId !== null)
      ? (b.venueId._id || b.venueId.id || b.venueId.toString())
      : b.venueId;
    if (String(bVenueId) !== String(venueId)) return false;
    if (b.status !== 'confirmed') return false;
    if (b.bookingType !== bookingData.bookingType) return false;
    const bDate = new Date(b.startDate);
    return isSameDay(selectedDate, bDate);
  });
  return conflicts.length > 0;
};

const handleMarkerClick = (venue) => {
setSelectedVenue(venue);
// Scroll to the venue in the table
const element = document.getElementById(`venue-${venue._id}`);
if (element) {
element.scrollIntoView({ behavior: 'smooth', block: 'center' });
element.classList.add('bg-indigo-50');
setTimeout(() => {
element.classList.remove('bg-indigo-50');
}, 2000);
}
};

const handleBookingClick = (venue, e) => {
e.stopPropagation();
setSelectedVenue(venue);
setBookingData({
...bookingData,
venueId: venue._id
});
setShowBookingModal(true);
};

const handleBookingSubmit = async (e) => {
e.preventDefault();
setShowBookingModal(false);
setShowPaymentModal(true);
};

const handlePaymentConfirm = async () => {
setIsSubmitting(true);
setBookingError(null);

try {
const selectedVenue = venues.find(v => v._id === bookingData.venueId);
if (!selectedVenue) {
setBookingError('Please select a venue');
return;
}

// Convert date to proper format
const startDate = new Date(bookingData.startDate);

// Set time based on booking type
if (bookingData.bookingType === 'day') {
startDate.setHours(9, 0, 0, 0); // 9 AM
} else {
startDate.setHours(18, 0, 0, 0); // 6 PM
}

const totalPrice = calculateTotalPrice();
const user = JSON.parse(localStorage.getItem('user'));

// Check if user has sufficient balance
if (user?.user?.balance < totalPrice) {
setBookingError('Insufficient balance');
return;
}

const payload = {
venueId: bookingData.venueId,
userId: bookingData.userId,
startDate: startDate.toISOString(),
numberOfGuests: bookingData.numberOfGuests,
totalPrice: totalPrice,
bookingType: bookingData.bookingType
};

// Create booking
await bookingService.createBooking(payload);

// Calculate new balance
const newBalance = user.user.balance - totalPrice;

// Update user balance in backend
await authService.updateUserBalance(user.user.id, newBalance);

// Update user balance in localStorage and state
const updatedUser = {
...user,
user: {
...user.user,
balance: newBalance
}
};
localStorage.setItem('user', JSON.stringify(updatedUser));
updateBalance(newBalance);

setShowPaymentModal(false);
setBookingData({
venueId: '',
userId: userId,
startDate: '',
numberOfGuests: 1,
bookingType: 'day'
});
// Refresh venues list to update status
const updatedVenues = await venueService.getVenues();
setVenues(updatedVenues);
} catch (error) {
setBookingError(error.message || 'Failed to create booking');
} finally {
setIsSubmitting(false);
}
};

const availableVenues = venues.filter(venue => venue.status === 'Available');

const calculateTotalPrice = () => {
if (!bookingData.venueId) {
return 0;
}

const selectedVenue = venues.find(v => v._id === bookingData.venueId);
if (!selectedVenue) return 0;

return bookingData.bookingType === 'day' ? selectedVenue.dayPrice : selectedVenue.nightPrice;
};

// Check for booking conflict whenever relevant fields change
useEffect(() => {
  if (!showBookingModal) return;
  console.log('All bookings:', bookings);
  console.log('Current selection:', bookingData);
  if (!bookingData.venueId || !bookingData.startDate) {
    setBookingConflict(false);
    return;
  }
  const conflict = isVenueBooked(bookingData.venueId);
  setBookingConflict(conflict);
}, [bookingData.venueId, bookingData.startDate, bookingData.bookingType, showBookingModal, bookings]);

if (loading) {
return (
<div className="flex justify-center items-center h-64">
<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
</div>
);
}

if (error) {
return (
<div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
<div className="flex">
<div className="flex-shrink-0">
<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
</svg>
</div>
<div className="ml-3">
<p className="text-sm text-red-700">Error: {error}</p>
</div>
</div>
</div>
);
}

return (
<div className="bg-white rounded-2xl shadow-lg p-6">
<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
<div>
<h2 className="text-2xl font-bold text-gray-900">Venue List</h2>
<p className="mt-1 text-sm text-gray-500">Browse and book available venues</p>
</div>
<div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
<div className="flex items-center">
<label htmlFor="location-filter" className="text-sm font-medium text-gray-700 mr-2">
Location:
</label>
<select
id="location-filter"
value={selectedLocation}
onChange={(e) => setSelectedLocation(e.target.value)}
className="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg transition-all duration-200"
>
<option value="all">All Locations</option>
{locations.map(location => (
<option key={location} value={location}>{location}</option>
))}
</select>
</div>
<div className="flex items-center">
<label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mr-2">
Status:
</label>
<select
id="status-filter"
value={selectedStatus}
onChange={(e) => setSelectedStatus(e.target.value)}
className="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg transition-all duration-200"
>
<option value="all">All Status</option>
<option value="Available">Available</option>
<option value="Booked">Booked</option>
<option value="Maintenance">Maintenance</option>
</select>
</div>
<div className="flex items-center">
<label htmlFor="capacity-filter" className="text-sm font-medium text-gray-700 mr-2">
Capacity:
</label>
<select
id="capacity-filter"
value={selectedCapacity}
onChange={(e) => setSelectedCapacity(e.target.value)}
className="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg transition-all duration-200"
>
{capacityRanges.map(range => (
<option key={range.value} value={range.value}>{range.label}</option>
))}
</select>
</div>
<button
onClick={() => setShowMap(!showMap)}
className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
>
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
</svg>
<span>{showMap ? 'Hide Map' : 'Show Map'}</span>
</button>
</div>
</div>

{showMap && (
<div className="mb-8 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
<VenueMap
venues={filteredVenues}
selectedVenue={selectedVenue}
onMarkerClick={handleMarkerClick}
/>
</div>
)}

<div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
<table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Venue Name
</th>
<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Location
</th>
<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Capacity
</th>
<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Day Price
</th>
<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Night Price
</th>
<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Status
</th>
<th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Actions
</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{filteredVenues.map((venue) => {
const booked = isVenueBooked(venue._id);
return (
<tr
key={venue._id}
id={`venue-${venue._id}`}
className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${selectedVenue?._id === venue._id ? 'bg-indigo-50' : ''}`}
onClick={() => setSelectedVenue(venue)}
>
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center">
<div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
<svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
</svg>
</div>
<div className="ml-4">
<div className="text-sm font-medium text-gray-900">{venue.name}</div>
<div className="text-sm text-gray-500">{venue.location}</div>
</div>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm text-gray-900">{venue.location}</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm text-gray-900">{venue.capacity}</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm text-gray-900">${venue.dayPrice.toLocaleString()}</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm text-gray-900">${venue.nightPrice.toLocaleString()}</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${booked ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
{booked ? 'Booked' : 'Available'}
</span>
</td>
<td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
<button
onClick={(e) => handleBookingClick(venue, e)}
disabled={booked}
className={`inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-all duration-200 ${booked ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
>
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
</svg>
<span>{booked ? 'Booked' : 'Book Now'}</span>
</button>
</td>
</tr>
);
})}
</tbody>
</table>
</div>

{filteredVenues.length === 0 && (
<div className="text-center py-12">
<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
<svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
</div>
<h3 className="text-lg font-medium text-gray-900">No venues found</h3>
<p className="mt-2 text-sm text-gray-500">Try adjusting your filters to find what you're looking for.</p>
</div>
)}

{showBookingModal && (
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
<div className="flex justify-between items-center mb-6">
<div>
<h3 className="text-2xl font-bold text-gray-900">Book Your Venue</h3>
<p className="text-sm text-gray-500 mt-1">Secure your perfect event space</p>
</div>
<button
onClick={() => setShowBookingModal(false)}
className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
>
<span className="sr-only">Close</span>
<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
</div>

<form onSubmit={handleBookingSubmit} className="space-y-5">
<div className="space-y-1">
<label htmlFor="venue" className="block text-sm font-medium text-gray-700">
Select Venue <span className="text-red-500">*</span>
</label>
<select
id="venue"
value={bookingData.venueId}
onChange={(e) => setBookingData({ ...bookingData, venueId: e.target.value })}
className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg transition-all duration-200"
required
>
<option value="">Select a venue</option>
{venues.map(venue => {
const booked = isVenueBooked(venue._id);
return (
<option key={venue._id} value={venue._id} disabled={booked}>
{venue.name} - {venue.location} {booked ? '(Booked)' : ''}
</option>
);
})}
</select>
</div>

<div className="space-y-1">
<label htmlFor="bookingType" className="block text-sm font-medium text-gray-700">
Booking Type <span className="text-red-500">*</span>
</label>
<select
id="bookingType"
value={bookingData.bookingType}
onChange={(e) => setBookingData({ ...bookingData, bookingType: e.target.value })}
className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-lg transition-all duration-200"
required
>
<option value="day">Day Booking</option>
<option value="night">Night Booking</option>
</select>
</div>

<div className="space-y-1">
<label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
Date <span className="text-red-500">*</span>
</label>
<div className="relative">
<input
type="date"
id="startDate"
value={bookingData.startDate}
onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
className="mt-1 block w-full border border-gray-200 rounded-lg py-2.5 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
required
/>
<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
<svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
</svg>
</div>
</div>
</div>

<div className="space-y-1">
<label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700">
Number of Guests <span className="text-red-500">*</span>
</label>
<input
type="number"
id="numberOfGuests"
min="1"
value={bookingData.numberOfGuests}
onChange={(e) => setBookingData({ ...bookingData, numberOfGuests: parseInt(e.target.value) })}
className="mt-1 block w-full border border-gray-200 rounded-lg py-2.5 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
required
/>
</div>

{bookingConflict && (
<div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-2 text-sm font-medium">
This venue is already booked for the selected date and slot.
</div>
)}

<div className="bg-gray-50 p-4 rounded-lg">
<div className="flex justify-between items-center">
<span className="text-sm font-medium text-gray-700">Total Price:</span>
<span className="text-lg font-semibold text-indigo-600">
${calculateTotalPrice().toLocaleString()}
</span>
</div>
<p className="text-xs text-gray-500 mt-1">
Price is based on {bookingData.bookingType === 'day' ? 'day' : 'night'} booking rate
</p>
</div>

{bookingError && (
<div className="bg-red-50 border-l-4 border-red-400 p-4">
<div className="flex">
<div className="flex-shrink-0">
<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
</svg>
</div>
<div className="ml-3">
<p className="text-sm text-red-700">{bookingError}</p>
</div>
</div>
</div>
)}

<div className="pt-2 flex justify-end space-x-3">
<button
type="button"
onClick={() => setShowBookingModal(false)}
className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
disabled={isSubmitting}
>
Cancel
</button>
<button
type="submit"
className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 hover:shadow-md disabled:opacity-50"
disabled={isSubmitting || bookingConflict}
>
{isSubmitting ? 'Processing...' : 'Confirm Booking'}
</button>
</div>
</form>
</div>
</div>
)}

{showPaymentModal && (
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
<div className="flex justify-between items-center mb-6">
<div>
<h3 className="text-2xl font-bold text-gray-900">Payment Confirmation</h3>
<p className="text-sm text-gray-500 mt-1">Please confirm your payment details</p>
</div>
<button
onClick={() => setShowPaymentModal(false)}
className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
>
<span className="sr-only">Close</span>
<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>
</button>
</div>

<div className="space-y-6">
<div className="bg-gray-50 p-4 rounded-lg">
<h4 className="text-sm font-medium text-gray-700 mb-3">Booking Summary</h4>
<div className="space-y-2">
<div className="flex justify-between">
<span className="text-sm text-gray-600">Venue:</span>
<span className="text-sm font-medium text-gray-900">
{venues.find(v => v._id === bookingData.venueId)?.name}
</span>
</div>
<div className="flex justify-between">
<span className="text-sm text-gray-600">Date:</span>
<span className="text-sm font-medium text-gray-900">
{new Date(bookingData.startDate).toLocaleDateString()}
</span>
</div>
<div className="flex justify-between">
<span className="text-sm text-gray-600">Booking Type:</span>
<span className="text-sm font-medium text-gray-900 capitalize">
{bookingData.bookingType}
</span>
</div>
<div className="flex justify-between">
<span className="text-sm text-gray-600">Number of Guests:</span>
<span className="text-sm font-medium text-gray-900">
{bookingData.numberOfGuests}
</span>
</div>
<div className="border-t border-gray-200 pt-2 mt-2">
<div className="flex justify-between">
<span className="text-sm font-medium text-gray-700">Total Amount:</span>
<span className="text-lg font-semibold text-indigo-600">
${calculateTotalPrice().toLocaleString()}
</span>
</div>
</div>
</div>
</div>

<div className="bg-blue-50 p-4 rounded-lg">
<div className="flex items-start">
<div className="flex-shrink-0">
<svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
</svg>
</div>
<div className="ml-3">
<h3 className="text-sm font-medium text-blue-800">Payment Information</h3>
<div className="mt-2 text-sm text-blue-700">
<p>Your current balance: ${JSON.parse(localStorage.getItem('user'))?.user?.balance}</p>
<p>Amount to be deducted: ${calculateTotalPrice().toLocaleString()}</p>
<p>Remaining balance: ${(JSON.parse(localStorage.getItem('user'))?.user?.balance - calculateTotalPrice()).toLocaleString()}</p>
</div>
</div>
</div>
</div>

{bookingError && (
<div className="bg-red-50 border-l-4 border-red-400 p-4">
<div className="flex">
<div className="flex-shrink-0">
<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
</svg>
</div>
<div className="ml-3">
<p className="text-sm text-red-700">{bookingError}</p>
</div>
</div>
</div>
)}

<div className="pt-2 flex justify-end space-x-3">
<button
type="button"
onClick={() => setShowPaymentModal(false)}
className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
disabled={isSubmitting}
>
Cancel
</button>
<button
type="button"
onClick={handlePaymentConfirm}
className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 hover:shadow-md disabled:opacity-50"
disabled={isSubmitting}
>
{isSubmitting ? 'Processing...' : 'Confirm Payment'}
</button>
</div>
</div>
</div>
</div>
)}
</div>
);
};

export default Table;