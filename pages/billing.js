import { useEffect, useState } from 'react';
import Router from 'next/router';
import { supabase } from '../lib/supabaseClient';

const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

export default function Billing() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const subscribe = async () => {
    if (!user) {
      Router.push('/');
      return;
    }

    if (!priceId) {
      setMessage('Price not configured. Set NEXT_PUBLIC_STRIPE_PRICE_ID.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        setMessage(data.error);
      }
    } catch (err) {
      console.error(err);
      setMessage('Unable to start checkout, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Billing</h2>
        <p className="muted">
          Upgrade to TaxCraft Pro for unlimited reports, saved scenarios, and PDF exports without watermark.
        </p>
        <button className="btn-primary" onClick={subscribe} disabled={loading}>
          {loading ? 'Redirecting...' : 'Subscribe to Pro'}
        </button>
        {message && <div className="message error">{message}</div>}
      </div>
    </div>
  );
}
