"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, Button, Input } from "@/components/ui";
import { Mail, Sparkles } from "lucide-react";

export default function AuthGate() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [lastRedirect, setLastRedirect] = useState<string | undefined>(undefined);

  const send = async () => {
    setState("idle");
    const e = email.trim();
    if (!e) return;
    const base = (process.env.NEXT_PUBLIC_BASE_URL as string) || (typeof window !== "undefined" ? window.location.origin : undefined);
    const redirect = base ? `${base.replace(/\/$/, "")}/app` : undefined;
    // Debug: expose redirect used when sending magic link
    // eslint-disable-next-line no-console
    console.info("[AuthGate] sending magic link with redirect:", redirect);
    setLastRedirect(redirect);
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        emailRedirectTo: redirect,
      },
    });
    if (error) setState("error");
    else setState("sent");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-[520px] p-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-[16px] border border-white/10 bg-white/6 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white/85" />
          </div>
          <div>
            <div className="text-lg font-semibold">SY Reminders</div>
            <div className="text-sm text-white/60">Login via magic link (no password).</div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="text-xs text-white/60">Email</div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="h-4 w-4 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="pl-9"
              />
            </div>
            <Button variant="primary" onClick={send}>Send</Button>
          </div>
          {state === "sent" ? <div className="text-sm text-lime-200/90">Magic link sent. Check inbox.</div> : null}
          {state === "error" ? <div className="text-sm text-amber-200/90">Error sending link. Check Supabase Auth settings.</div> : null}
          {lastRedirect ? <div className="mt-2 text-xs text-white/50">DEBUG redirect: {lastRedirect}</div> : null}
        </div>

        <div className="mt-5 text-xs text-white/55">
          Supabase → Auth → URL Configuration: add Redirect URLs for localhost and Vercel.
        </div>
      </Card>
    </div>
  );
}
