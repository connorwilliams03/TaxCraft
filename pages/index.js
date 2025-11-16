import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Handle Supabase magic link redirect
  useEffect(() => {
    const hash = window.location.hash;

    if (hash && hash.includes("access_token")) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          router.push("/dashboard");
        }
      });
    }
  }, []);

  async function signInWithEmail(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: '${process.env.NEXT_PUBLIC_APP_URL}/auth/v1/callback',
      },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a sign-in link.");
    }
    setLoading(false);
  }

  return (
    <div className="page-landing">
      <header className="hero">
        <div className="brand">TaxCraft</div>
        <p className="tag">Simple UK self-employed tax planner with a premium dashboard.</p>
      </header>

      <main className="hero-grid">

        {/* Left side */}
        <section className="hero-left card">
          <h2>Why TaxCraft?</h2>
          <ul>
            <li>Save yearly summaries</li>
            <li>Charts and exportable reports</li>
            <li>Invoice & expense tracking (Pro)</li>
          </ul>
          <Link href="/dashboard" className="btn">Try Demo Dashboard</Link>
        </section>

        {/* Right side */}
        <aside className="hero-right card">
          <h3>Sign in / Sign up</h3>
          <form onSubmit={signInWithEmail}>
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              required
            />

            <button className="btn-primary" type="submit" disabled={loading}>
              Sign in via Magic Link
            </button>
          </form>

          {message && <div className="message">{message}</div>}
        </aside>

      </main>
    </div>
  );
}
