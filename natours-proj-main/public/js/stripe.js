import axios from 'axios';
const stripe = Stripe(
  'pk_test_51HZrMgI74mn0IeIcyiByScP6BTwQWqm0hmOWbnbrC6SKE2Ai3FIYNoPg1j408qCssCSHhN0XEVtLCbOQ8iHLlcpN00GFrDnReh'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
  }
};
