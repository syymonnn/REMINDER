"use client";

import React, { useMemo } from "react";
import type { Reminder } from "@/lib/types";
import { Card } from "@/components/ui";
import { ResponsiveContainer, PieChart, Pie, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { addDays, format, startOfDay } from "date-fns";

function dayKey(d: Date) {
  return format(d, "MM-dd");
}

export default function WeeklyInsights({ day, reminders, view }: { day: Date; reminders: Reminder[]; view: "day" | "week" }) {
  const now = new Date();

  const { done, todo, overdue } = useMemo(() => {
    const t = reminders.filter(r => r.status !== "done").length;
    const d = reminders.filter(r => r.status === "done").length;
    const o = reminders.filter(r => r.status !== "done" && r.due_at && new Date(r.due_at).getTime() < now.getTime()).length;
    return { done: d, todo: t, overdue: o };
  }, [reminders, now]);

  

  const pie = useMemo(() => ([
    { name: "Done", value: done },
    { name: "Pending", value: todo },
  ]), [done, todo]);

  const byDay = useMemo(() => {
    const start = startOfDay(day);
    const keys = Array.from({ length: view === "week" ? 7 : 1 }, (_, i) => addDays(start, i));
    const rows = keys.map(d => ({ label: dayKey(d), created: 0, done: 0 }));
    const idx = new Map(rows.map((r, i) => [r.label, i]));
    reminders.forEach(r => {
      if (!r.due_at) return;
      const k = dayKey(new Date(r.due_at));
      const i = idx.get(k);
      if (i === undefined) return;
      rows[i].created += 1;
      if (r.status === "done") rows[i].done += 1;
    });
    return rows;
  }, [day, reminders, view]);

  // visual styling tokens
  const doneColor = "#60A5FA"; // blue
  const pendingColor = "#F59E0B"; // amber
  const createdGradientId = "grad-created";
  const doneGradientId = "grad-done";
  const total = done + todo;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Daily brief</div>
            <div className="text-xs text-white/55">Oggi: must-do, slot deep work, follow-up (heuristic).</div>
          </div>
          <div className={`sy-pill ${overdue ? "sy-pill-active" : ""}`}>{overdue ? `${overdue} overdue` : "on track"}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-[14px] p-4" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs text-white/60">Done</div>
            <div className="mt-2 text-2xl sm:text-3xl font-semibold text-white">{done}</div>
          </div>
          <div className="rounded-[14px] p-4" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs text-white/60">Pending</div>
            <div className="mt-2 text-2xl sm:text-3xl font-semibold text-white">{todo}</div>
          </div>
          <div className="rounded-[14px] p-4" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs text-white/60">Total</div>
            <div className="mt-2 text-2xl sm:text-3xl font-semibold text-white">{done + todo}</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xs text-white/60 mb-2">Progress</div>
          <div className="rounded-full p-[2px]" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="h-4 sm:h-3 rounded-full bg-white/6 overflow-hidden">
              <div
                className="h-4 sm:h-3 rounded-full"
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? 'linear-gradient(90deg,#34D399,#10B981)' : `linear-gradient(90deg, ${doneColor}, ${pendingColor})`,
                  transition: 'width 400ms ease, box-shadow 300ms ease',
                  boxShadow: pct === 100 ? '0 0 18px rgba(16,185,129,0.14)' : 'none',
                }}
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-white/55">
            {total === 0 ? 'No tasks yet' : `${done} done • ${todo} pending • total ${total} — ${pct}% complete`}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Report</div>
          <div className="text-xs text-white/55">Summary of recent activity</div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-[220px] rounded-[12px] p-3 shadow-soft" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))' }}>
            <div className="text-xs text-white/60 mb-2">Done vs Pending</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id={doneGradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={doneColor} stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id={createdGradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={pendingColor} stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.75" />
                  </linearGradient>
                </defs>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={4}>
                  {pie.map((p, idx) => (
                    <Cell key={idx} fill={p.name === 'Done' ? `url(#${doneGradientId})` : `url(#${createdGradientId})`} />
                  ))}
                </Pie>
                <Tooltip wrapperStyle={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8 }} contentStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[220px] rounded-[12px] p-3 shadow-soft" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))' }}>
            <div className="text-xs text-white/60 mb-2">Done vs created</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay} margin={{ left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.55)" fontSize={11} />
                <Tooltip wrapperStyle={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8 }} contentStyle={{ color: '#fff' }} />
                <defs>
                  <linearGradient id="bar-created-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="bar-done-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <Bar dataKey="created" radius={[6, 6, 0, 0]} fill="url(#bar-created-grad)" />
                <Bar dataKey="done" radius={[6, 6, 0, 0]} fill="url(#bar-done-grad)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}
