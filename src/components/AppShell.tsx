"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar, LayoutGrid, LogOut, Plus, Sparkles, Settings } from "lucide-react";
import BackgroundAurora from "@/components/BackgroundAurora";
import { Button, Card, Input, Pill } from "@/components/ui";
import { useSession } from "@/hooks/useSession";
import AuthGate from "@/components/AuthGate";
import { supabase } from "@/lib/supabase/client";
import { isoDate, fromISODate, rangeForDay, rangeForWeek } from "@/lib/date";
import { useGroups, useRemindersRange } from "@/hooks/useData";
import ReminderEditorModal from "@/components/ReminderEditorModal";
import ReminderList from "@/components/ReminderList";
import WeeklyInsights from "@/components/WeeklyInsights";

// context feature removed

type View = "day" | "week";

export default function AppShell() {
  const { loading, session } = useSession();
  const router = useRouter();
  const sp = useSearchParams();

  const dayParam = sp.get("day");
  const [day, setDay] = useState<Date>(() => (dayParam ? fromISODate(dayParam) : new Date()));
  const [view, setView] = useState<View>("day");
  // context filtering removed
  const [q, setQ] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (dayParam) setDay(fromISODate(dayParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayParam]);

  const { start: dayStart, end: dayEnd } = rangeForDay(day);
  const { start: weekStart, end: weekEnd } = rangeForWeek(day, 1);

  const range = view === "day"
    ? { startISO: dayStart.toISOString(), endISO: dayEnd.toISOString() }
    : { startISO: weekStart.toISOString(), endISO: weekEnd.toISOString() };

  const groupsQ = useGroups();
  const remindersQ = useRemindersRange(range.startISO, range.endISO);

  const groups = groupsQ.data ?? [];
  const reminders = remindersQ.data ?? [];

  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      if (activeGroup !== "all" && r.group_id !== activeGroup) return false;
      if (q.trim()) {
        const blob = `${r.title} ${r.notes ?? ""} ${(r.tags || []).join(" ")}`.toLowerCase();
        if (!blob.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [reminders, activeGroup, q]);

  const todayLabel = format(day, "EEE dd MMM");

  const openCreate = () => {
    setEditingId(null);
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const selected = useMemo(() => {
    if (!editingId) return null;
    return reminders.find((r) => r.id === editingId) ?? null;
  }, [editingId, reminders]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const goDay = (d: Date) => {
    const iso = isoDate(d);
    router.push(`/app?day=${iso}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70">
        Loading…
      </div>
    );
  }

  if (!session) return <><BackgroundAurora /><div className="relative z-10"><AuthGate /></div></>;

  return (
    <div className="relative z-10 min-h-screen">
      <BackgroundAurora />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4">
        {/* Top bar */}
        <Card className="p-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-[16px] border border-white/10 bg-white/6 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white/85" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">SY Reminders</div>
                <div className="text-xs text-white/55 truncate">Minimal workflow. Premium UI. Zero noise.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block w-[320px]">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
              </div>

              <Button className="hidden sm:inline-flex" onClick={() => router.push("/calendar")}>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Calendar
                </span>
              </Button>

              <Button className="inline-flex items-center justify-center" onClick={() => router.push('/settings')} title="Settings" aria-label="Settings">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="primary" onClick={openCreate}>
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" /> New
                </span>
              </Button>

              <Button onClick={signOut}>
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> Logout
                </span>
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <Card className="p-4">
            <div className="text-white font-semibold">Navigator</div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button onClick={() => goDay(new Date(day.getTime() - 86400000))}>‹</Button>
              <div className="text-sm text-white/85">{todayLabel}</div>
              <Button onClick={() => goDay(new Date(day.getTime() + 86400000))}>›</Button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Pill active={view === "day"} onClick={() => setView("day")}>Day</Pill>
              <Pill active={view === "week"} onClick={() => setView("week")}>Week</Pill>
              <Pill active={false} onClick={() => router.push("/calendar")}>Calendar</Pill>
            </div>

            {/* Context selector removed */}

            <div className="mt-4">
              <div className="text-xs text-white/60 mb-2">Groups</div>
              <div className="flex flex-wrap gap-2">
                <Pill active={activeGroup === "all"} onClick={() => setActiveGroup("all")}>All</Pill>
                {groups.map((g) => (
                  <Pill key={g.id} active={activeGroup === g.id} onClick={() => setActiveGroup(g.id)}>
                    {g.name}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="mt-4 sy-hairline" />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-white/55">
                {remindersQ.isFetching ? "Syncing…" : "Synced"}
              </div>
              <div className="text-xs text-white/55">
                {filtered.length} items
              </div>
            </div>
          </Card>

          {/* Main */}
          <div className="space-y-4">
            <WeeklyInsights day={day} reminders={filtered} view={view} />

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-[14px] border border-white/10 bg-white/6 flex items-center justify-center">
                    <LayoutGrid className="h-4 w-4 text-white/80" />
                  </div>
                  <div>
                    <div className="font-semibold">Timeline</div>
                    <div className="text-xs text-white/55">Click item to edit. No refresh needed.</div>
                  </div>
                </div>

                <Button variant="primary" onClick={openCreate}>Add</Button>
              </div>

              <div className="mt-4">
                <ReminderList
                  reminders={filtered}
                  onEdit={openEdit}
                  day={day}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ReminderEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        groups={groups}
        initialDay={day}
        reminder={selected}
      />
    </div>
  );
}
