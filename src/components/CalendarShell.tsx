"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, startOfDay } from "date-fns";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, LogOut, Sparkles, Settings } from "lucide-react";
import BackgroundAurora from "@/components/BackgroundAurora";
import { Button, Card, Input, Pill } from "@/components/ui";
import AuthGate from "@/components/AuthGate";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase/client";
import { addMonth, isoDate, monthGridDays, rangeForMonth, rangeForWeek } from "@/lib/date";
import { useRemindersRange } from "@/hooks/useData";
import CalendarViews from "@/components/CalendarViews";

type Mode = "day" | "week" | "month";

export default function CalendarShell() {
  const { loading, session } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [q, setQ] = useState("");

  const range = useMemo(() => {
    if (mode === "day") {
      const s = startOfDay(cursor);
      const e = addDays(s, 1);
      return { startISO: s.toISOString(), endISO: e.toISOString() };
    }
    if (mode === "week") {
      const { start, end } = rangeForWeek(cursor, 1);
      return { startISO: start.toISOString(), endISO: end.toISOString() };
    }
    const { start, end } = rangeForMonth(cursor);
    // fetch a bit more for month grid (6 weeks)
    const grid = monthGridDays(cursor);
    const startG = startOfDay(grid[0]).toISOString();
    const endG = addDays(startOfDay(grid[grid.length - 1]), 1).toISOString();
    return { startISO: startG, endISO: endG };
  }, [mode, cursor]);

  const remindersQ = useRemindersRange(range.startISO, range.endISO);
  const reminders = remindersQ.data ?? [];

  const filtered = useMemo(() => {
    if (!q.trim()) return reminders;
    const qq = q.toLowerCase();
    return reminders.filter(r => `${r.title} ${r.notes ?? ""} ${(r.tags || []).join(" ")}`.toLowerCase().includes(qq));
  }, [reminders, q]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/70">Loading…</div>;
  if (!session) return <><BackgroundAurora /><div className="relative z-10"><AuthGate /></div></>;

  const title = mode === "month"
    ? format(cursor, "MMMM yyyy")
    : mode === "week"
      ? `Week of ${format(cursor, "dd MMM")}`
      : format(cursor, "EEE dd MMM");

  return (
    <div className="relative z-10 min-h-screen">
      <BackgroundAurora />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4">
        <Card className="p-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-[16px] border border-white/10 bg-white/6 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white/85" />
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">Calendar</div>
                <div className="text-xs text-white/55 truncate">Day / Week / Month views (click a day → timeline).</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block w-[320px]">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
              </div>

              <Button className="inline-flex items-center justify-center" onClick={() => router.push('/settings')} title="Settings" aria-label="Settings">
                <Settings className="w-4 h-4" />
              </Button>
              <Button onClick={() => router.push("/app")}> 
                <span className="inline-flex items-center gap-2"><CalIcon className="h-4 w-4" /> Timeline</span>
              </Button>
              <Button onClick={signOut}><span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" /> Logout</span></Button>
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <Card className="p-4">
            <div className="text-white font-semibold">View</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill active={mode === "day"} onClick={() => setMode("day")}>Day</Pill>
              <Pill active={mode === "week"} onClick={() => setMode("week")}>Week</Pill>
              <Pill active={mode === "month"} onClick={() => setMode("month")}>Month</Pill>
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/60 mb-2">Navigate</div>
              <div className="flex items-center justify-between gap-2">
                <Button onClick={() => setCursor(mode === "month" ? addMonth(cursor, -1) : addDays(cursor, -1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm text-white/85 text-center flex-1">{title}</div>
                <Button onClick={() => setCursor(mode === "month" ? addMonth(cursor, 1) : addDays(cursor, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => setCursor(new Date())} className="w-full">Today</Button>
              </div>
            </div>

            <div className="mt-4 sy-hairline" />
            <div className="mt-4 text-xs text-white/55">
              {remindersQ.isFetching ? "Syncing…" : "Synced"} — {filtered.length} items
            </div>
          </Card>

          <Card className="p-4">
            <CalendarViews
              mode={mode}
              cursor={cursor}
              reminders={filtered}
              onPickDay={(d) => router.push(`/app?day=${isoDate(d)}`)}
              onSetCursor={setCursor}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
