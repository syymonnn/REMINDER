"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let sub: any;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
      const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s ?? null);
      });
      sub = listener.subscription;
    })();

    return () => sub?.unsubscribe?.();
  }, []);

  return { loading, session };
}
