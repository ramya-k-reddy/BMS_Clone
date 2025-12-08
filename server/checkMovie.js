const mongoose = require('mongoose');
const Movie = require('./models/Movie');
require('dotenv').config();

async function checkMovies() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB\n');

    // Get all movies
    const movies = await Movie.find({}, 'title genre language status').lean();
    
    console.log('📽️  All Movies in Database:');
    console.log('================================');
    movies.forEach((m, index) => {
      console.log(`${index + 1}. ${m.title} (${m.status})`);
    });
    
    console.log(`\nTotal: ${movies.length} movies\n`);

    // Search for Kantara specifically
    const kantara = await Movie.findOne({ title: /kantara/i }).lean();
    
    if (kantara) {
      console.log('✅ Kantara movie FOUND in database!');
      console.log('================================');
      console.log('Title:', kantara.title);
      console.log('Director:', kantara.director);
      console.log('Genre:', kantara.genre.join(', '));
      console.log('Language:', kantara.language.join(', '));
      console.log('Duration:', kantara.duration, 'minutes');
      console.log('Status:', kantara.status);
      console.log('Certification:', kantara.certification);
    } else {
      console.log('❌ Kantara movie NOT FOUND in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

checkMovies();
