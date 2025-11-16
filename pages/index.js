import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ FIXED REDIRECT HANDLING
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.push("/dashboard");
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router]);

  // Send Magic Link
  async function signInWithEmail() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/v1/callback`,
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
    <main className="page">
      <section className="hero-left card">
        <h1 className="title">Simple UK self-employed tax planner with a premium dashboard.</h1>
        <p>Save yearly summaries</p>
        <p>Charts and exportable reports</p>
        <p>Invoice & expense tracking (Pro)</p>
      </section>

      <section className="hero-right card">
        <h2>Sign in / Sign up</h2>

        {message && <p>{message}</p>}

        <input
          className="text-input"
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          className="btn-primary"
          type="button"
          onClick={signInWithEmail}
          disabled={loading}
        >
          {loading ? "Sending..." : "Sign in via Magic Link"}
        </button>

        <p className="small-text">
          For security purposes, you can only request this after 60 seconds.
        </p>
      </section>
    </main>
  );
}
