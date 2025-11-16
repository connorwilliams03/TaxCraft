import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      // Get the session after magic link
      const { data } = await supabase.auth.getSession();

      if (data?.session) {
        // User is logged in → redirect to dashboard
        router.replace("/dashboard");
      } else {
        // If no session yet, wait a moment
        setTimeout(handleCallback, 300);
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="page card">
      <h2>Signing you in…</h2>
      <p>Please wait a moment.</p>
    </div>
  );
}
