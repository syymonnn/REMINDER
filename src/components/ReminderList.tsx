"use client";

import React, { useMemo } from "react";
import { useGroups } from "@/hooks/useData";
import type { Reminder } from "@/lib/types";
import { fmtTime, isoDate } from "@/lib/date";
import { Button } from "@/components/ui";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useToggleDone, useUpsertReminder } from "@/hooks/useData";

function isOverdue(r: Reminder, now = new Date()) {
  if (r.status === "done") return false;
  if (!r.due_at) return false;
  return new Date(r.due_at).getTime() < now.getTime();
}

function pickRescheduleSlots(base: Date) {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  const tmr = new Date(base);
  tmr.setDate(tmr.getDate() + 1);
  tmr.setHours(9, 30, 0, 0);
  return [next, tmr] as const;
}

export default function ReminderList({ reminders, onEdit, day }: { reminders: Reminder[]; onEdit: (id: string) => void; day: Date }) {
  const toggle = useToggleDone();
  const upsert = useUpsertReminder();
  const groupsQ = useGroups();
  const now = new Date();

  function hexToRgba(hex: string, alpha = 1) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const priorityColorMap: Record<string, string> = {
    low: '#3B82F6',
    med: '#F59E0B',
    high: '#EF4444',
  };

  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const ta = a.due_at ? new Date(a.due_at).getTime() : 0;
      const tb = b.due_at ? new Date(b.due_at).getTime() : 0;
      return ta - tb;
    });
  }, [reminders]);

  const reschedule = async (r: Reminder) => {
    const [s1, s2] = pickRescheduleSlots(day);
    // choose slot 2 if next slot is too close
    const chosen = (s1.getTime() - now.getTime()) < 30 * 60 * 1000 ? s2 : s1;
    await upsert.mutateAsync({ id: r.id, title: r.title, notes: r.notes ?? null, due_at: chosen.toISOString(), group_id: r.group_id, tags: r.tags, status: r.status, priority: r.priority });
  };

  function parseRecurrence(tags: string[] | undefined) {
    if (!tags) return null;
    const rec = tags.find(t => t.startsWith('rec:'));
    if (!rec) return null;
    const parts = rec.split(':');
    if (parts[1] === 'daily') return { type: 'daily' as const };
    if (parts[1] === 'monthly') {
      // possible encoded payload after parts[2]: weeks=1,3;days=Tue,Thu
      const payload = parts.slice(2).join(':');
      const weeksMatch = payload.match(/weeks=([0-9,\-]+)/);
      const daysMatch = payload.match(/days=([A-Za-z,]+)/);
      const weeks = weeksMatch ? weeksMatch[1].split(',').map(s => Number(s)) : [];
      const days = daysMatch ? daysMatch[1].split(',').map(s => s.trim()) : [];
      return { type: 'monthly' as const, weeks, days };
    }
    if (parts[1] === 'weekly') return { type: 'weekly' as const, days: parts[2] ? parts[2].split(',').map(s => s.trim()) : [] };
    return null;
  }

  function parseDuration(tags: string[] | undefined) {
    if (!tags) return 0;
    const d = tags.find(t => t.startsWith('dur:'));
    if (!d) return 0;
    const n = Number(d.replace('dur:', ''));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  function addDaysSafe(dt: Date, days: number) {
    const d = new Date(dt);
    d.setDate(d.getDate() + days);
    return d;
  }

  function addMonthsSafe(dt: Date, months: number) {
    const d = new Date(dt);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // handle month overflow
    if (d.getDate() !== day) {
      d.setDate(0); // last day of previous month
    }
    return d;
  }

  function findNextOccurrence(base: Date, rec: any) {
    const start = new Date(base);
    if (rec.type === 'daily') {
      return addDaysSafe(start, 1);
    }
    if (rec.type === 'monthly') {
      // if simple monthly (no additional data) fallback to +1 month
      if (!rec.weeks || !rec.days || !rec.days.length) return addMonthsSafe(start, 1);
      // search next matching date within next 12 months
      const nameToDow: Record<string, number> = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
      for (let m = 0; m < 12; m++) {
        const monthDate = new Date(start.getFullYear(), start.getMonth() + m, 1);
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth()+1, 0).getDate();
        const candidates: Date[] = [];
        for (const dowName of rec.days) {
          const dow = nameToDow[dowName];
          if (dow === undefined) continue;
          for (const wk of (rec.weeks.length ? rec.weeks : [1])) {
            if (wk === -1) {
              for (let d = daysInMonth; d >= 1; d--) {
                const day = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
                if (day.getDay() === dow) { candidates.push(day); break; }
              }
            } else {
              let firstDowDate: Date | null = null;
              for (let d = 1; d <= 7; d++) {
                const day = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
                if (day.getDay() === dow) { firstDowDate = day; break; }
              }
              if (firstDowDate) {
                const target = new Date(firstDowDate);
                target.setDate(firstDowDate.getDate() + (wk-1)*7);
                if (target.getMonth() === monthDate.getMonth()) candidates.push(target);
              }
            }
          }
        }
        candidates.sort((a,b)=>a.getTime()-b.getTime());
        for (const c of candidates) {
          if (c.getTime() > start.getTime()) return c;
        }
      }
      return addMonthsSafe(start, 1);
    }
    if (rec.type === 'weekly') {
      // find next day in rec.days (strings like Mon,Tue)
      const daysMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
      const today = start.getDay();
      const wanted = (rec.days || []).map((d: string) => daysMap[d]).filter((n: any) => typeof n === 'number');
      if (!wanted.length) return addDaysSafe(start, 7);
      for (let i = 1; i <= 14; i++) {
        const cand = addDaysSafe(start, i);
        if (wanted.includes(cand.getDay())) return cand;
      }
      return addDaysSafe(start, 7);
    }
    return addDaysSafe(start, 1);
  }

  function overlaps(candidateStart: Date, durationMins: number, existing: Reminder[]) {
    if (!durationMins) return false;
    const candStart = candidateStart.getTime();
    const candEnd = candStart + durationMins * 60 * 1000;
    for (const e of existing) {
      if (!e.due_at) continue;
      const es = new Date(e.due_at).getTime();
      const dur = parseDuration(e.tags) || 0;
      const ee = es + dur * 60 * 1000;
      if (Math.max(es, candStart) < Math.min(ee, candEnd)) return true;
    }
    return false;
  }

  if (!sorted.length) {
    return (
      <div className="sy-card p-5 text-white/65">
        Nessun reminder nel range corrente (o filtrato via context/group).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((r) => {
        const overdue = isOverdue(r, now);
        return (
          <div
              key={r.id}
              className={[
                "rounded-[14px] border p-3 cursor-pointer transition",
                "hover:bg-white/7",
              ].join(" ")}
              onClick={() => onEdit(r.id)}
              style={(() => {
                const g = groupsQ.data?.find((gg) => gg.id === r.group_id);
                const groupColor = g?.color && String(g.color).startsWith('#') ? String(g.color) : g?.color ? String(g.color) : undefined;
                const pri = priorityColorMap[r.priority] ?? priorityColorMap.med;
                const aPri = hexToRgba(pri, r.status === 'done' ? 0.06 : 0.16);
                const aGroup = groupColor ? hexToRgba(groupColor, r.status === 'done' ? 0.04 : 0.12) : undefined;
                const gradient = aGroup ? `linear-gradient(135deg, ${aPri} 0%, ${aGroup} 100%)` : `linear-gradient(135deg, ${aPri} 0%, rgba(255,255,255,0.02) 100%)`;
                const borderC = r.status === 'done' ? 'rgba(255,255,255,0.06)' : (groupColor ? hexToRgba(groupColor, 0.22) : 'rgba(255,255,255,0.10)');
                return {
                  backgroundImage: gradient,
                  border: `1px solid ${borderC}`,
                } as React.CSSProperties;
              })()}
            >
            <div className="flex items-start gap-3">
                {/* group accent */}
                {/* group accent (kept subtle since card now has gradient) */}
                {(() => {
                  const g = groupsQ.data?.find((gg) => gg.id === r.group_id);
                  const color = g?.color && String(g.color) || undefined;
                  return color ? (
                    <div style={{ background: hexToRgba(color.startsWith('#') ? color : '#ffffff', 0.9) }} className="w-1.5 rounded-l-md -ml-3 mr-2" />
                  ) : null;
                })()}
                {/* priority dot */}
                <div className="mt-0.5 mr-2">
                  <span style={{ background: priorityColorMap[r.priority] }} className="inline-block w-2.5 h-2.5 rounded-full" />
                </div>
              <button
                className="rounded-full p-1.5 hover:bg-white/10"
                onClick={async (e) => {
                  e.stopPropagation();
                  const targetDone = r.status !== 'done';
                  try {
                    await toggle.mutateAsync({ id: r.id, done: targetDone });
                    // if we just marked done and the reminder is recurring, schedule next
                    if (targetDone) {
                      const rec = parseRecurrence(r.tags);
                      if (rec && r.due_at) {
                        const dur = parseDuration(r.tags);
                        let next = findNextOccurrence(new Date(r.due_at), rec);
                        // preserve time of day from original
                        const orig = new Date(r.due_at);
                        next.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
                        // avoid overlaps: try up to 30 attempts
                        let attempts = 0;
                        while (overlaps(next, dur, reminders) && attempts < 30) {
                          next = findNextOccurrence(next, rec);
                          next.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
                          attempts++;
                        }
                        // create next occurrence
                        if (attempts < 30) {
                          await upsert.mutateAsync({ title: r.title, notes: r.notes ?? null, due_at: next.toISOString(), group_id: r.group_id, tags: r.tags, status: 'todo', priority: r.priority });
                        }
                      }
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                aria-label="toggle"
              >
                <CheckCircle2 className={`h-5 w-5 ${r.status === "done" ? "text-lime-300" : "text-white/35"}`} />
              </button>

              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold ${r.status === "done" ? "text-white/50 line-through" : "text-white"}`}>
                  {r.title}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {r.due_at ? (
                    <span className="sy-pill inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {fmtTime(new Date(r.due_at))}
                    </span>
                  ) : (
                    <span className="sy-pill inline-flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> inbox
                    </span>
                  )}
                  <span className="sy-pill">{r.priority}</span>
                  {overdue ? <span className="sy-pill sy-pill-active">overdue</span> : null}
                  {(r.tags || []).slice(0, 3).map(t => <span key={t} className="sy-pill">{t}</span>)}
                </div>

                {r.notes ? <div className="mt-2 text-xs text-white/60 line-clamp-2">{r.notes}</div> : null}

                {overdue ? (
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <Button variant="primary" onClick={(e) => { e.stopPropagation(); reschedule(r); }}>
                      Auto-reschedule
                    </Button>
                    <span className="text-xs text-white/55">
                      Ti sposta in uno slot realistico (no dimenticanze).
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="text-xs text-white/40 hidden sm:block">
                {r.due_at ? isoDate(new Date(r.due_at)) : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
