require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

async function checkMovieStructure() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB\n');

    const movies = await Movie.find({}).lean();
    
    console.log('Movies found:', movies.length);
    console.log('\n');
    
    movies.forEach((movie, index) => {
      console.log(`\n${index + 1}. ${movie.title}`);
      console.log('   Genre type:', typeof movie.genre, 'Value:', movie.genre);
      console.log('   Language type:', typeof movie.language, 'Value:', movie.language);
      console.log('   Format type:', typeof movie.format, 'Value:', movie.format);
      console.log('   Cast type:', typeof movie.cast, 'Value:', Array.isArray(movie.cast) ? `Array with ${movie.cast.length} items` : movie.cast);
    });

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMovieStructure();
