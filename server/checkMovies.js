const mongoose = require('mongoose');
require('dotenv').config();

const Movie = require('./models/Movie');

async function checkMovies() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');

    const movies = await Movie.find({}).select('title director cast releaseDate').limit(5);
    
    console.log('\nMovie Data:');
    movies.forEach(movie => {
      console.log(`\nTitle: ${movie.title}`);
      console.log(`Director: ${movie.director || 'NOT SET'}`);
      console.log(`Cast: ${movie.cast?.length > 0 ? movie.cast.map(c => c.name).join(', ') : 'NOT SET'}`);
      console.log(`Release Date: ${movie.releaseDate || 'NOT SET'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMovies();
