const mongoose = require('mongoose');
require('dotenv').config();

const Movie = require('./models/Movie');
const Show = require('./models/Show');

async function checkShows() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');

    const movieCount = await Movie.countDocuments({isActive: true});
    const showCount = await Show.countDocuments({});
    const futureShows = await Show.countDocuments({showDate: {$gte: new Date()}});
    
    console.log('\nCounts:');
    console.log('Active Movies:', movieCount);
    console.log('Total Shows:', showCount);
    console.log('Future Shows:', futureShows);
    
    const shows = await Show.find({}).select('showDate showTime movie').populate('movie', 'title').sort({showDate: 1}).limit(10);
    console.log('\nFirst 10 shows:');
    shows.forEach(s => {
      console.log(`${s.showDate.toISOString().split('T')[0]} ${s.showTime} - ${s.movie?.title || 'No movie'}`);
    });

    // Check movies with shows
    const moviesWithShows = await Movie.find({isActive: true}).populate('shows');
    console.log('\nMovies with shows count:');
    moviesWithShows.forEach(m => {
      const futureShowCount = m.shows.filter(s => new Date(s.showDate) >= new Date()).length;
      console.log(`${m.title}: ${m.shows.length} total, ${futureShowCount} future`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkShows();
