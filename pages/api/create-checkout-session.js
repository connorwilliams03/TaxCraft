import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? '';
const appUrlFromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? '';
const resolvedAppUrl = appUrlFromEnv || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId, email } = req.body ?? {};

  if (!priceId || !userId) {
    return res.status(400).json({ error: 'Missing priceId or userId' });
  }

  if (!stripe || !resolvedAppUrl) {
    console.error('Stripe environment variables are missing.');
    return res.status(500).json({ error: 'Stripe configuration missing on the server.' });
  }

  const successUrl = `${resolvedAppUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${resolvedAppUrl}/billing`;

  try {
    const sessionArgs = {
      mode: 'subscription',
      metadata: { userId, priceId },
    };

    sessionArgs['payment_method_types'] = ['card'];
    sessionArgs['line_items'] = [{ price: priceId, quantity: 1 }];
    sessionArgs['success_url'] = successUrl;
    sessionArgs['cancel_url'] = cancelUrl;
    sessionArgs['customer_email'] = email;

    const session = await stripe.checkout.sessions.create(sessionArgs);

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to create checkout session' });
  }
}
