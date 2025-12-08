import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/Payment.css';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51S68IADc9q6ZN2kARwK36wnvlKqTeCj8FI1EFYDjttXkPtogajpVWOquydDJ4C045dkmltrRnXuFW1whyEoeeKTY00oY0QURUr');

const CheckoutForm = ({ bookingId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.log('Stripe not loaded yet');
      toast.error('Payment system is not ready. Please wait a moment.');
      return;
    }

    setProcessing(true);

    try {
      console.log('Confirming payment...');
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      console.log('Payment result:', { error, paymentIntent });

      if (error) {
        console.error('Payment error:', error);
        toast.error(error.message || 'Payment failed. Please try again.');
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded, confirming with backend...');
        // Confirm payment on backend
        const response = await api.post('/payment/confirm-payment', {
          bookingId,
          paymentIntentId: paymentIntent.id
        });
        
        console.log('Backend confirmation response:', response.data);
        
        if (response.data.success) {
          toast.success('Payment successful!');
          onSuccess(bookingId);
        } else {
          toast.error(response.data.message || 'Payment confirmation failed');
          setProcessing(false);
        }
      } else {
        console.log('Payment not succeeded, status:', paymentIntent?.status);
        toast.error('Payment was not completed. Please try again.');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Payment Details</h3>
      
      {!stripe || !elements ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <LoadingSpinner size="medium" />
          <p style={{ marginTop: '1rem' }}>Loading payment form...</p>
        </div>
      ) : (
        <div className="payment-element-wrapper">
          <PaymentElement />
        </div>
      )}
      
      <div className="payment-amount">
        <span>Total Amount:</span>
        <span className="amount">₹{amount}</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="payment-submit-btn"
      >
        {processing ? 'Processing...' : `Pay ₹${amount}`}
      </button>
      
      <div className="payment-footer">
        <p><span className="secure-icon">🔒</span> Secured by Stripe</p>
        <p>This is a test payment. Use test card: 4242 4242 4242 4242</p>
      </div>
    </form>
  );
};

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Create payment intent
        const response = await api.post('/payment/create-payment-intent', {
          bookingId
        });

        if (response.data.success) {
          setClientSecret(response.data.data.clientSecret);
          setAmount(response.data.data.amount);
          console.log('Payment initialized:', { 
            amount: response.data.data.amount 
          });
        }

        // Get booking details
        const bookingResponse = await api.get(`/bookings/${bookingId}`);
        setBooking(bookingResponse.data.data.booking);
      } catch (error) {
        console.error('Payment initialization error:', error);
        toast.error(error.response?.data?.message || 'Failed to initialize payment');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [bookingId, navigate]);

  const handlePaymentSuccess = (bookingId) => {
    navigate(`/booking-confirmation/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="payment-loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!clientSecret || !booking) {
    return (
      <div className="payment-error">
        <div className="payment-error-content">
          <h2>Payment initialization failed</h2>
          <button onClick={() => navigate('/')}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#dc2626',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="payment-container">
      <div className="payment-wrapper">
        <div className="payment-left">
          <div className="payment-header">
            <h1>Complete Payment</h1>
            <p>Booking ID: {bookingId}</p>
          </div>

          {booking && (
            <div className="card-section booking-summary">
              <h2>Booking Summary</h2>
              <div className="booking-summary-details">
                <p><strong>Seats:</strong> {booking.seats?.map(s => `${s.row}${s.seatNumber}`).join(', ') || 'N/A'}</p>
                <p><strong>Total Seats:</strong> {booking.seats?.length || 0}</p>
                <p><strong>Status:</strong> <span className="status">{booking.bookingStatus || booking.status || 'Pending'}</span></p>
              </div>
            </div>
          )}
        </div>

        <div className="payment-right">
          <div className="card-section payment-form-container">
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm 
                bookingId={bookingId} 
                amount={amount}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;