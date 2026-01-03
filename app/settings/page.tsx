"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button } from "@/components/ui";
import { useCreateGroup, useGroups, useUpdateGroup, useDeleteGroup } from "@/hooks/useData";
import BackgroundAurora from "@/components/BackgroundAurora";
import AuthGate from "@/components/AuthGate";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function SettingsPage() {
  const groupsQ = useGroups();
  const createG = useCreateGroup();
  const updateG = useUpdateGroup();
  const deleteG = useDeleteGroup();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#B8FF2C");

  const { loading, session } = useSession();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/70">Loading…</div>;
  if (!session) return <><BackgroundAurora /><div className="relative z-10"><AuthGate /></div></>;

  return (
    <div className="relative z-10 min-h-screen">
      <BackgroundAurora />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card className="p-2 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-[16px] border border-white/10 bg-white/6 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white/85" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">Settings</div>
                <div className="text-xs text-white/55 truncate">Manage your groups and preferences.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block w-[320px]" />
              <Button onClick={() => router.push('/app')}>Back</Button>
              <Button onClick={() => router.push('/calendar')}>Calendar</Button>
              <Button onClick={signOut}>Logout</Button>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Groups</h2>

          <Card className="p-4 mb-6">
            <div className="text-sm text-white/80 mb-2">Create group</div>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 p-0 rounded" />
              <Button
                variant="primary"
                onClick={() => {
                  if (!name.trim()) return;
                  createG.mutate({ name: name.trim(), color });
                  setName("");
                }}
              >
                Add
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-white/80 mb-4">Your groups</div>
            <div className="space-y-3">
              {groupsQ.data?.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div style={{ background: g.color || "#ffffff22" }} className="h-8 w-8 rounded" />
                    <div className="min-w-0">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-white/60">{g.color}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      defaultValue={g.color || "#ffffff"}
                      onChange={(e) => updateG.mutate({ id: g.id, color: e.target.value })}
                      className="w-10 h-8 p-0 rounded"
                    />
                    <Button onClick={() => {
                      const newName = prompt("Rename group", g.name);
                      if (newName && newName.trim()) updateG.mutate({ id: g.id, name: newName.trim() });
                    }}>Rename</Button>
                    <Button onClick={() => { if (confirm("Delete group?")) deleteG.mutate(g.id); }}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
