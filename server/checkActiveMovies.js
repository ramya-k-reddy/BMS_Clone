require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

async function checkActiveMovies() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB\n');

    // Check all movies
    const allMovies = await Movie.find({}).lean();
    console.log('All movies:');
    allMovies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title}`);
      console.log(`   isActive: ${movie.isActive}`);
      console.log(`   status: ${movie.status}`);
      console.log(`   genre: ${JSON.stringify(movie.genre)}`);
      console.log(`   language: ${JSON.stringify(movie.language)}`);
      console.log('');
    });

    // Check with isActive filter
    const activeMovies = await Movie.find({ isActive: true }).lean();
    console.log(`\nActive movies (isActive: true): ${activeMovies.length}`);
    activeMovies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (${movie.status})`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkActiveMovies();
