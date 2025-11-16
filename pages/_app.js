import '../styles/globals.css';
import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Listen for Supabase auth events (signin/signout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);

        if (event === "SIGNED_IN" && session) {
          router.push("/dashboard");
        }

        if (event === "SIGNED_OUT") {
          router.push("/");
        }
      }
    );

    // Handle magic links by checking the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      router.push("/dashboard");
    }

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <Component {...pageProps} />;
}
