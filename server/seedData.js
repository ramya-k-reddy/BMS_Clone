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
    role: 'partner',
    approved: false
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
  },
  {
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    genre: ['Biography', 'Drama', 'History'],
    language: ['English', 'Hindi'],
    duration: 180,
    releaseDate: new Date('2024-01-25'),
    director: 'Christopher Nolan',
    cast: [
      { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer', image: '' },
      { name: 'Emily Blunt', role: 'Katherine Oppenheimer', image: '' },
      { name: 'Robert Downey Jr.', role: 'Lewis Strauss', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    rating: {
      imdb: 8.3,
      userRating: 4.6,
      totalRatings: 450
    },
    certification: 'A',
    format: ['2D', 'IMAX'],
    status: 'now-showing'
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.',
    genre: ['Action', 'Crime', 'Drama'],
    language: ['English', 'Hindi', 'Tamil'],
    duration: 152,
    releaseDate: new Date('2024-02-05'),
    director: 'Christopher Nolan',
    cast: [
      { name: 'Christian Bale', role: 'Bruce Wayne / Batman', image: '' },
      { name: 'Heath Ledger', role: 'Joker', image: '' },
      { name: 'Aaron Eckhart', role: 'Harvey Dent', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    rating: {
      imdb: 9.0,
      userRating: 4.8,
      totalRatings: 680
    },
    certification: 'U/A',
    format: ['2D', 'IMAX'],
    status: 'now-showing'
  },
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    language: ['English', 'Hindi'],
    duration: 148,
    releaseDate: new Date('2024-01-28'),
    director: 'Christopher Nolan',
    cast: [
      { name: 'Leonardo DiCaprio', role: 'Cobb', image: '' },
      { name: 'Joseph Gordon-Levitt', role: 'Arthur', image: '' },
      { name: 'Elliot Page', role: 'Ariadne', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    rating: {
      imdb: 8.8,
      userRating: 4.7,
      totalRatings: 590
    },
    certification: 'U/A',
    format: ['2D', 'IMAX'],
    status: 'now-showing'
  },
  {
    title: 'Interstellar',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    language: ['English', 'Hindi'],
    duration: 169,
    releaseDate: new Date('2024-02-10'),
    director: 'Christopher Nolan',
    cast: [
      { name: 'Matthew McConaughey', role: 'Cooper', image: '' },
      { name: 'Anne Hathaway', role: 'Brand', image: '' },
      { name: 'Jessica Chastain', role: 'Murph', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    rating: {
      imdb: 8.7,
      userRating: 4.6,
      totalRatings: 520
    },
    certification: 'U/A',
    format: ['2D', 'IMAX'],
    status: 'coming-soon'
  },
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    language: ['English', 'Hindi'],
    duration: 166,
    releaseDate: new Date('2024-02-15'),
    director: 'Denis Villeneuve',
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides', image: '' },
      { name: 'Zendaya', role: 'Chani', image: '' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    rating: {
      imdb: 8.5,
      userRating: 4.7,
      totalRatings: 380
    },
    certification: 'U/A',
    format: ['2D', '3D', 'IMAX'],
    status: 'coming-soon'
  },
  {
    title: 'Pathaan',
    description: 'An Indian spy takes on the leader of a gang of mercenaries who have nefarious plans to target his homeland.',
    genre: ['Action', 'Thriller'],
    language: ['Hindi', 'English', 'Tamil'],
    duration: 146,
    releaseDate: new Date('2024-01-22'),
    director: 'Siddharth Anand',
    cast: [
      { name: 'Shah Rukh Khan', role: 'Pathaan', image: '' },
      { name: 'Deepika Padukone', role: 'Rubina', image: '' },
      { name: 'John Abraham', role: 'Jim', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/kTOheVmqSBDIRGrQLv2SiSc89os.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/5LBMmBKGdgKR4vgHf6aoELquo7U.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=vqu4z34wENw',
    rating: {
      imdb: 5.7,
      userRating: 4.2,
      totalRatings: 280
    },
    certification: 'U/A',
    format: ['2D', '3D', 'IMAX'],
    status: 'now-showing'
  },
  {
    title: 'Jawan',
    description: 'A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in society.',
    genre: ['Action', 'Thriller'],
    language: ['Hindi', 'Tamil', 'Telugu'],
    duration: 169,
    releaseDate: new Date('2024-02-08'),
    director: 'Atlee',
    cast: [
      { name: 'Shah Rukh Khan', role: 'Azad / Vikram Rathore', image: '' },
      { name: 'Nayanthara', role: 'Narmada', image: '' },
      { name: 'Vijay Sethupathi', role: 'Kalee', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/aGVWVNRqKBZ2tP1rKXt2IiI0KWn.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/3mS6RqrqmYNq9bEgITZmfOfjGpq.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=CEEjr07CDY0',
    rating: {
      imdb: 6.5,
      userRating: 4.4,
      totalRatings: 340
    },
    certification: 'U/A',
    format: ['2D', '3D', 'IMAX'],
    status: 'now-showing'
  },
  {
    title: 'Guardians of the Galaxy Vol. 3',
    description: 'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe and one of their own.',
    genre: ['Action', 'Adventure', 'Comedy'],
    language: ['English', 'Hindi'],
    duration: 150,
    releaseDate: new Date('2024-02-12'),
    director: 'James Gunn',
    cast: [
      { name: 'Chris Pratt', role: 'Peter Quill / Star-Lord', image: '' },
      { name: 'Zoe Saldana', role: 'Gamora', image: '' },
      { name: 'Dave Bautista', role: 'Drax', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=u3V5KDHRQvk',
    rating: {
      imdb: 7.9,
      userRating: 4.5,
      totalRatings: 410
    },
    certification: 'U/A',
    format: ['2D', '3D', 'IMAX'],
    status: 'coming-soon'
  },
  {
    title: 'The Shawshank Redemption',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    genre: ['Drama'],
    language: ['English', 'Hindi'],
    duration: 142,
    releaseDate: new Date('2024-01-30'),
    director: 'Frank Darabont',
    cast: [
      { name: 'Tim Robbins', role: 'Andy Dufresne', image: '' },
      { name: 'Morgan Freeman', role: 'Ellis Boyd Redding', image: '' },
      { name: 'Bob Gunton', role: 'Warden Norton', image: '' }
    ],
    poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    bannerImage: 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=6hB3S9bIaco',
    rating: {
      imdb: 9.3,
      userRating: 4.9,
      totalRatings: 720
    },
    certification: 'A',
    format: ['2D'],
    status: 'now-showing'
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
    const theaterOwner = users.find(user => user.role === 'partner');
    
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
    console.log('Partner: owner@theater.com / owner123');
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