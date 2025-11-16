const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Movie = require('./models/Movie');
const Theater = require('./models/Theater');
const Show = require('./models/Show');

// Demo data
const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@bookmyshow.com',
    password: 'admin123',
    phone: '9876543210',
    role: 'admin'
  },
  {
    name: 'Theater Owner',
    email: 'owner@theater.com',
    password: 'owner123',
    phone: '9876543211',
    role: 'theater-owner'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    phone: '9876543212',
    role: 'user',
    preferences: {
      favoriteGenres: ['Action', 'Drama'],
      preferredLanguages: ['English', 'Hindi'],
      city: 'Mumbai'
    }
  }
];

const demoMovies = [
  {
    title: 'Avengers: Endgame',
    description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos\' actions.',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: ['English', 'Hindi', 'Tamil'],
    duration: 181,
    releaseDate: new Date('2024-01-15'),
    director: 'Anthony Russo, Joe Russo',
    cast: [
      { name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man', image: '' },
      { name: 'Chris Evans', role: 'Steve Rogers / Captain America', image: '' },
      { name: 'Mark Ruffalo', role: 'Bruce Banner / Hulk', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
    rating: {
      imdb: 8.4,
      userRating: 4.5,
      totalRatings: 250
    },
    certification: 'U/A',
    format: ['2D', '3D', 'IMAX'],
    status: 'now-showing'
  },
  {
    title: 'RRR',
    description: 'A fictional story about two legendary revolutionaries and their journey away from home before they started fighting for their country in 1920s.',
    genre: ['Action', 'Drama', 'History'],
    language: ['Telugu', 'Hindi', 'English'],
    duration: 187,
    releaseDate: new Date('2024-01-20'),
    director: 'S.S. Rajamouli',
    cast: [
      { name: 'N.T. Rama Rao Jr.', role: 'Komaram Bheem', image: '' },
      { name: 'Ram Charan', role: 'Alluri Sitarama Raju', image: '' },
      { name: 'Alia Bhatt', role: 'Sita', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/wE0ZkqOKujPu5MEtl8ZyEkNUbzz.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/8I37NtDffNV7AZlDa7uDvvqhovU.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=GY4BgdUSpbE',
    rating: {
      imdb: 7.9,
      userRating: 4.3,
      totalRatings: 180
    },
    certification: 'U/A',
    format: ['2D', '3D', 'IMAX'],
    status: 'now-showing'
  },
  {
    title: 'Spider-Man: No Way Home',
    description: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: ['English', 'Hindi'],
    duration: 148,
    releaseDate: new Date('2024-02-01'),
    director: 'Jon Watts',
    cast: [
      { name: 'Tom Holland', role: 'Peter Parker / Spider-Man', image: '' },
      { name: 'Zendaya', role: 'MJ', image: '' },
      { name: 'Benedict Cumberbatch', role: 'Dr. Stephen Strange', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
    rating: {
      imdb: 8.2,
      userRating: 4.4,
      totalRatings: 320
    },
    certification: 'U/A',
    format: ['2D', '3D', 'IMAX'],
    status: 'coming-soon'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theater.deleteMany({}),
      Show.deleteMany({})
    ]);

    console.log('Cleared existing data');

    // Create users
    const users = await Promise.all(
      demoUsers.map(async (userData) => {
        const user = new User(userData);
        return await user.save();
      })
    );

    console.log('Created demo users');

    // Create movies
    const movies = await Movie.insertMany(demoMovies);
    console.log('Created demo movies');

    // Create a demo theater
    const theaterOwner = users.find(user => user.role === 'theater-owner');
    
    const demoTheater = {
      name: 'PVR Cinemas Phoenix Mall',
      address: {
        street: 'High Street Phoenix Mall, Senapati Bapat Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400013',
        landmark: 'Lower Parel'
      },
      location: {
        type: 'Point',
        coordinates: [72.8311, 19.0137] // [longitude, latitude]
      },
      owner: theaterOwner._id,
      contact: {
        phone: '9876543220',
        email: 'pvr.phoenix@example.com'
      },
      screens: [
        {
          screenNumber: 1,
          name: 'Screen 1 - Gold Class',
          capacity: 120,
          screenType: 'Regular',
          seatLayout: {
            rows: 10,
            seatsPerRow: 12,
            seatCategories: [
              {
                category: 'Premium',
                price: 350,
                rows: { from: 'A', to: 'C' }
              },
              {
                category: 'Gold',
                price: 250,
                rows: { from: 'D', to: 'G' }
              },
              {
                category: 'Silver',
                price: 180,
                rows: { from: 'H', to: 'J' }
              }
            ],
            blockedSeats: [
              { row: 'F', seatNumber: 6 },
              { row: 'F', seatNumber: 7 }
            ]
          },
          amenities: ['AC', 'Recliner', 'Food Service']
        },
        {
          screenNumber: 2,
          name: 'Screen 2 - IMAX',
          capacity: 200,
          screenType: 'IMAX',
          seatLayout: {
            rows: 15,
            seatsPerRow: 14,
            seatCategories: [
              {
                category: 'Executive',
                price: 450,
                rows: { from: 'A', to: 'E' }
              },
              {
                category: 'Premium',
                price: 350,
                rows: { from: 'F', to: 'J' }
              },
              {
                category: 'Gold',
                price: 250,
                rows: { from: 'K', to: 'O' }
              }
            ],
            blockedSeats: []
          },
          amenities: ['AC', 'IMAX', 'Dolby Atmos']
        }
      ],
      amenities: ['Parking', 'Food Court', 'ATM', 'Air Conditioning'],
      images: [
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
        'https://images.unsplash.com/photo-1596727147348-eb4c325bae71?w=800'
      ],
      verificationStatus: 'verified'
    };

    const theater = new Theater(demoTheater);
    await theater.save();
    console.log('Created demo theater');

    // Create demo shows
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const demoShows = [];
    
    movies.forEach((movie, index) => {
      // Create shows for next 7 days
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const showDate = new Date(today);
        showDate.setDate(today.getDate() + dayOffset);
        
        // Create 4 shows per day (morning, afternoon, evening, night)
        ['10:00', '14:30', '18:00', '21:30'].forEach((time, timeIndex) => {
          const screen = theater.screens[timeIndex % 2]; // Alternate between screens
          
          demoShows.push({
            movie: movie._id,
            theater: theater._id,
            screen: {
              screenNumber: screen.screenNumber,
              name: screen.name
            },
            showDate: new Date(showDate),
            showTime: time,
            language: movie.language[0], // Use first language
            format: movie.format[0], // Use first format
            pricing: screen.seatLayout.seatCategories.map(cat => ({
              category: cat.category,
              price: cat.price
            })),
            seats: {
              total: screen.capacity,
              available: screen.capacity - (screen.seatLayout.blockedSeats?.length || 0),
              booked: [],
              blocked: (screen.seatLayout.blockedSeats || []).map(seat => ({
                seatId: `${seat.row}${seat.seatNumber}`,
                row: seat.row,
                seatNumber: seat.seatNumber,
                reason: 'Maintenance'
              }))
            }
          });
        });
      }
    });

    const shows = await Show.insertMany(demoShows);
    console.log(`Created ${shows.length} demo shows`);

    // Update theater and movies with show references
    await theater.updateOne({ 
      $push: { shows: { $each: shows.map(show => show._id) } } 
    });

    for (const movie of movies) {
      const movieShows = shows.filter(show => 
        show.movie.toString() === movie._id.toString()
      );
      await movie.updateOne({ 
        $push: { shows: { $each: movieShows.map(show => show._id) } } 
      });
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Created:');
    console.log(`- ${users.length} users (admin, theater-owner, regular user)`);
    console.log(`- ${movies.length} movies`);
    console.log(`- 1 theater with 2 screens`);
    console.log(`- ${shows.length} shows`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@bookmyshow.com / admin123');
    console.log('Theater Owner: owner@theater.com / owner123');
    console.log('User: john@example.com / user123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seeder
seedDatabase();