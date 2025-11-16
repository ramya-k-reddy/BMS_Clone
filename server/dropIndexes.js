const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to MongoDB');
    
    // Drop the entire movies collection to remove all indexes
    await mongoose.connection.db.dropCollection('movies').catch(() => {
      console.log('Movies collection does not exist yet');
    });
    
    console.log('✅ Dropped movies collection and all indexes');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndexes();
