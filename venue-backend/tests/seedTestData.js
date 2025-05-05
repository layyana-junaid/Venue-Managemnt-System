import seedVenue from './seedData.js';

// Run the seed function
seedVenue()
  .then(venueId => {
    console.log('Venue created successfully with ID:', venueId);
    console.log('\nYou can now use this venue ID to test bookings:');
    console.log('Example booking request:');
    console.log(JSON.stringify({
      venueId: venueId,
      date: "2024-03-20",
      slot: "day"
    }, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  }); 