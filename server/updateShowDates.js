const mongoose = require('mongoose');
const Show = require('./models/Show');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bookmyshow')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function updateShowDates() {
  try {
    // Get all shows
    const shows = await Show.find({});
    console.log(`Found ${shows.length} shows to update\n`);

    const now = new Date();

    let updatedCount = 0;

    for (const show of shows) {
      const showDate = new Date(show.showDate);
      const [hours, minutes] = show.showTime.split(':').map(Number);
      
      // Create full show datetime
      const showDateTime = new Date(showDate);
      showDateTime.setHours(hours, minutes, 0, 0);

      // If show datetime is in the past, update it to future
      if (showDateTime < now) {
        const daysAhead = Math.floor(Math.random() * 7) + 1; // 1-7 days
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + daysAhead);
        newDate.setHours(0, 0, 0, 0); // Reset time part

        show.showDate = newDate;
        show.status = 'scheduled';
        show.isActive = true;
        
        await show.save();
        updatedCount++;
        
        console.log(`✓ Updated show ${show._id}:`);
        console.log(`  Old: ${showDate.toISOString().split('T')[0]} ${show.showTime}`);
        console.log(`  New: ${newDate.toISOString().split('T')[0]} ${show.showTime}`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} shows`);
    console.log(`📊 ${shows.length - updatedCount} shows were already in the future`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating shows:', error);
    process.exit(1);
  }
}

updateShowDates();
