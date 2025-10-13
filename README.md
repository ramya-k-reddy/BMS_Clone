# BookMyShow Clone

A comprehensive movie ticket booking platform built with React, Node.js, MongoDB, and Stripe.

## 🎬 Features

### Core Features
- **User Authentication**: Secure JWT-based login/registration
- **Movie Management**: Browse movies with filters (genre, language, city)
- **Theater Management**: Multi-screen theater support with seat layouts
- **Real-time Seat Selection**: Live seat availability with Socket.IO
- **Payment Integration**: Stripe payment processing with multiple methods
- **Booking Management**: View, cancel, and track bookings
- **Admin Panel**: Movie and theater management

### Advanced Features
- **Live Seat Updates**: Real-time seat locking during selection
- **Dynamic Pricing**: Different seat categories with custom pricing
- **QR Code Tickets**: Digital tickets with QR codes
- **Responsive Design**: Mobile-first UI similar to BookMyShow
- **Search & Filters**: Advanced movie and show search
- **Booking History**: Complete booking management
- **Cancellation & Refunds**: Automated refund processing

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time features
- **JWT** for authentication
- **Stripe** for payment processing
- **bcryptjs** for password hashing

### Frontend
- **React** with functional components
- **React Router** for navigation
- **Socket.IO Client** for real-time updates
- **Tailwind CSS** for styling
- **Axios** for API calls

## 📁 Project Structure

```
bms/
├── server/                 # Backend API
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Auth & validation
│   ├── controllers/       # Business logic
│   └── server.js          # Main server file
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # React context
│   │   ├── utils/         # Helper functions
│   │   └── services/      # API services
│   └── public/           # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Stripe account for payments

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bms
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in server directory:
   ```env
   DB_URL=mongodb+srv://username:password@cluster.mongodb.net/bookmyshow?retryWrites=true&w=majority
   JWT_SECRET="your-super-secret-jwt-key"
   STRIPE_API_KEY="sk_test_your_stripe_test_api_key_here"
   PORT=5000
   NODE_ENV=development
   STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

### Running the Application

1. **Start the server** (from server directory)
   ```bash
   npm run dev
   ```

2. **Start the client** (from client directory)
   ```bash
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Movies
- `GET /api/movies` - Get movies with filters
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies/:id/reviews` - Add movie review

### Theaters
- `GET /api/theaters` - Get theaters
- `GET /api/theaters/:id` - Get theater details
- `POST /api/theaters` - Create theater (Owner/Admin)

### Shows
- `GET /api/shows` - Get shows with filters
- `GET /api/shows/movie/:movieId` - Get shows for movie
- `POST /api/shows` - Create show (Owner/Admin)

### Bookings
- `POST /api/bookings/initiate` - Initiate booking
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment
- `POST /api/payments/confirm-payment` - Confirm payment
- `POST /api/payments/refund` - Process refund

## 🎭 Key Features Deep Dive

### Real-time Seat Selection
- Users can see live seat availability
- Seats are temporarily locked during selection (10 minutes)
- Socket.IO broadcasts seat updates to all connected users
- Automatic seat release on payment timeout

### Payment Flow
1. User selects seats → Seats are temporarily reserved
2. Payment intent created with Stripe
3. User completes payment
4. Booking confirmed → QR code generated
5. Email/SMS confirmation sent

### Admin Features
- Add/Edit movies and theaters
- Manage show timings
- View booking analytics
- Handle cancellations and refunds

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet for security headers

## 📊 Database Schema

### Key Models
- **User**: Authentication and profile data
- **Movie**: Movie details with cast, genres, ratings
- **Theater**: Multi-screen theater with seat layouts
- **Show**: Movie screenings with pricing
- **Booking**: Ticket bookings with payment info

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
DB_URL=<production-mongodb-url>
JWT_SECRET=<secure-jwt-secret>
STRIPE_API_KEY=<live-stripe-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret>
```

### Docker Support
```dockerfile
# Dockerfile for backend and frontend
# Docker Compose for full stack deployment
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- [ ] Mobile app with React Native
- [ ] Advanced analytics dashboard
- [ ] Social login integration
- [ ] Movie recommendations
- [ ] Loyalty points system
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Advanced reporting

## 🐛 Known Issues

- None currently reported

## 📞 Support

For support, email support@bookmyshow-clone.com or create an issue in the repository.

---

**Note**: This is a demonstration project for educational purposes. Ensure proper security measures before deploying to production.