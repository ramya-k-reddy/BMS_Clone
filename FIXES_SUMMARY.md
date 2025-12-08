# Seat Availability & Movie Details Fixes

## Issues Fixed

### 1. Movie Details Not Displaying (Showing N/A)
**Problem**: Movie details page was showing "N/A" for director, cast, release date, and rating.

**Root Cause**: The API returns `{ success: true, data: { movie: {...} } }` but the frontend was accessing `movieRes.data.data` instead of `movieRes.data.data.movie`.

**Fix**: Updated line 30 in `client/src/pages/MovieDetails.js`:
```javascript
// Before
setMovie(movieRes.data.data);

// After
setMovie(movieRes.data.data.movie);
```

### 2. Seat Availability Error ("Some selected seats are no longer available")
**Problem**: Users were getting seat availability errors even when seats appeared available.

**Root Cause**: Reserved seats from previous booking attempts (expired after 10 minutes) were not being cleaned up, causing false conflicts.

**Fixes Applied**:

#### a) Added cleanup in booking initiation (`server/routes/bookings.js`)
```javascript
// Clean up expired reservations before checking availability
const now = new Date();
const expiredReservations = show.seats.reserved.filter(seat => 
  new Date(seat.expiresAt) <= now
);

if (expiredReservations.length > 0) {
  console.log(`Cleaning up ${expiredReservations.length} expired reservations`);
  show.seats.reserved = show.seats.reserved.filter(seat => 
    new Date(seat.expiresAt) > now
  );
  await show.save();
}
```

#### b) Added cleanup when fetching single show (`server/routes/shows.js`)
```javascript
// Clean up expired reservations
const now = new Date();
const expiredCount = show.seats.reserved.filter(seat => 
  new Date(seat.expiresAt) <= now
).length;

if (expiredCount > 0) {
  console.log(`Cleaning up ${expiredCount} expired reservations from show ${show._id}`);
  show.seats.reserved = show.seats.reserved.filter(seat => 
    new Date(seat.expiresAt) > now
  );
  await show.save();
}
```

#### c) Added bulk cleanup when listing shows (`server/routes/shows.js`)
```javascript
// Clean up expired reservations for all shows
const now = new Date();
let totalCleaned = 0;

for (const show of shows) {
  if (show.seats?.reserved?.length > 0) {
    const expiredCount = show.seats.reserved.filter(seat => 
      new Date(seat.expiresAt) <= now
    ).length;
    
    if (expiredCount > 0) {
      totalCleaned += expiredCount;
      await Show.findByIdAndUpdate(show._id, {
        'seats.reserved': show.seats.reserved.filter(seat => 
          new Date(seat.expiresAt) > now
        )
      });
    }
  }
}
```

### 3. Past Shows Appearing in Listings
**Problem**: Shows with past dates were appearing in the movie details page.

**Fix**: Added default date filter in `server/routes/shows.js`:
```javascript
} else {
  // If no date is specified, only show future shows
  filter.showDate = { $gte: new Date() };
}
```

## How the Seat Reservation System Works

1. **User selects seats** → Frontend sends selection
2. **Backend reserves seats temporarily** → Adds to `show.seats.reserved[]` with 10-minute expiry
3. **User proceeds to payment** → Stripe payment intent created
4. **Payment succeeds** → Seats moved from `reserved` to `booked`, confirmation email sent
5. **Payment fails/timeout** → Reserved seats released automatically, cancellation email sent
6. **Expired reservations** → Now cleaned up automatically before any seat availability checks

## Testing

1. Navigate to any movie details page - you should now see director, cast, release date, and rating
2. Select seats and proceed to payment - you should not see "seats no longer available" errors
3. Only future shows should appear in the show listings
4. Expired reservations are automatically cleaned up from the database

## Files Modified

1. `client/src/pages/MovieDetails.js` - Fixed movie object extraction
2. `server/routes/bookings.js` - Added expired reservation cleanup before availability check
3. `server/routes/shows.js` - Added expired reservation cleanup in GET endpoints, added future date filter
