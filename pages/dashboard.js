import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Calculator from '../components/calculator';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => authListener.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div className="page">
      <header className="dash-header card">
        <div>Welcome back</div>
        <button
          className="btn-ghost"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/');
          }}
        >
          Sign out
        </button>
      </header>

      <main className="card grid">
        <section>
          <h2>Your Dashboard</h2>
          <Calculator />
        </section>
        <aside>
          <h3>Saved Reports</h3>
          <p className="muted">Coming soon</p>
        </aside>
      </main>
    </div>
  );
}
