"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Group, Reminder, ReminderPriority } from "@/lib/types";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { X } from "lucide-react";
import { isoDate } from "@/lib/date";
import { useDeleteReminder, useUpsertReminder } from "@/hooks/useData";

// context feature removed

function buildDueAtISO(dueDate: string | null, dueTime: string | null) {
  if (!dueDate) return null;
  const [y, m, d] = dueDate.split("-").map(Number);
  const hh = dueTime ? Number(dueTime.split(":")[0]) : 9;
  const mm = dueTime ? Number(dueTime.split(":")[1]) : 0;
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}

export default function ReminderEditorModal({
  open,
  onClose,
  groups,
  initialDay,
  reminder,
}: {
  open: boolean;
  onClose: () => void;
  groups: Group[];
  initialDay: Date;
  reminder: Reminder | null;
}) {
  const upsert = useUpsertReminder();
  const del = useDeleteReminder();

  const isEdit = !!reminder;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [tags, setTags] = useState<string>("");
  const [priority, setPriority] = useState<ReminderPriority>("med");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<string | null>("10:00");
  const [monthlyWeeks, setMonthlyWeeks] = useState<number[]>([]);

  // removed context state
  const [dueEnabled, setDueEnabled] = useState(true);
  const [dueDate, setDueDate] = useState<string>(() => isoDate(initialDay));
  const [dueTime, setDueTime] = useState<string>(() => "09:30");

  useEffect(() => {
    if (!open) return;

    if (reminder) {
      setTitle(reminder.title);
      setNotes(reminder.notes ?? "");
      setGroupId(reminder.group_id);
      setPriority(reminder.priority);
      // previously handled context via tags; now store raw tags
      setTags((reminder.tags || []).join(", "));
      if (reminder.due_at) {
        const dt = new Date(reminder.due_at);
        setDueEnabled(true);
        setDueDate(isoDate(dt));
        setDueTime(dt.toISOString().slice(11, 16));
      } else {
        setDueEnabled(false);
        setDueDate(isoDate(initialDay));
        setDueTime("09:30");
      }
      // parse recurrence and duration from tags
      const recTag = (reminder.tags || []).find(t => t.startsWith("rec:"));
      if (recTag) {
        const parts = recTag.split(":");
        if (parts[1] === "daily") setRecurrence("daily");
        else if (parts[1] === "monthly") {
          setRecurrence("monthly");
          // monthly: maybe have weeks/days encoded after ':'
          if (parts[2]) {
            const payload = parts.slice(2).join(":");
            // format: weeks=1,3;days=Tue,Thu
            const weeksMatch = payload.match(/weeks=([0-9,\-]+)/);
            if (weeksMatch) setMonthlyWeeks(weeksMatch[1].split(",").map(s => Number(s)));
            const daysMatch = payload.match(/days=([A-Za-z,]+)/);
            if (daysMatch) setRecurrenceDays(daysMatch[1].split(",").map(s => s.trim()));
          }
        } else if (parts[1] === "weekly") {
          setRecurrence("weekly");
          if (parts[2]) setRecurrenceDays(parts[2].split(",").map(s => s.trim()));
        } else setRecurrence("none");
      } else {
        setRecurrence("none");
        setRecurrenceDays([]);
      }
      const durTag = (reminder.tags || []).find(t => t.startsWith("dur:"));
      if (durTag && reminder.due_at) {
        const mins = Number(durTag.replace("dur:", "")) || 0;
        const dt = new Date(reminder.due_at);
        const end = new Date(dt.getTime() + mins * 60 * 1000);
        setEndTime(end.toISOString().slice(11, 16));
      } else {
        // default end time = dueTime + 30
        if (reminder.due_at) {
          const dt = new Date(reminder.due_at);
          const end = new Date(dt.getTime() + 30 * 60 * 1000);
          setEndTime(end.toISOString().slice(11, 16));
        } else {
          setEndTime("10:00");
        }
      }
    } else {
      setTitle("");
      setNotes("");
      setGroupId(null);
      setPriority("med");
      setTags("");
      setDueEnabled(true);
      setDueDate(isoDate(initialDay));
      setDueTime("09:30");
      setRecurrence("none");
      setRecurrenceDays([]);
      setEndTime("10:00");
      setMonthlyWeeks([]);
    }
  }, [open, reminder, initialDay]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const save = async () => {
    if (!canSave) return;

    const tagList = tags
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 12);

    const finalTags = [...tagList];

    const due_at = dueEnabled ? buildDueAtISO(dueDate, dueTime) : null;

    // append recurrence + duration tags
    if (recurrence && recurrence !== "none") {
      if (recurrence === "daily") finalTags.push("rec:daily");
      else if (recurrence === "weekly") finalTags.push(`rec:weekly:${recurrenceDays.join(",")}`);
      else if (recurrence === "monthly") {
        // encode weeks and days: weeks=1,3;days=Tue,Thu
        const parts: string[] = [];
        if (monthlyWeeks.length) parts.push(`weeks=${monthlyWeeks.join(",")}`);
        if (recurrenceDays.length) parts.push(`days=${recurrenceDays.join(",")}`);
        finalTags.push(`rec:monthly:${parts.join(";")}`);
      }
    }

    // duration computed from endTime - dueTime
    if (dueEnabled && due_at && endTime) {
      const start = new Date(due_at);
      const [eh, em] = endTime.split(":").map(Number);
      const end = new Date(start);
      end.setHours(eh, em, 0, 0);
      let dur = Math.round((end.getTime() - start.getTime()) / 60000);
      if (dur <= 0) dur += 24 * 60; // if end before start, assume next day
      finalTags.push(`dur:${dur}`);
    }

    const created = await upsert.mutateAsync({
      id: reminder?.id,
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : null,
      due_at,
      group_id: groupId,
      tags: finalTags,
      priority,
      status: reminder?.status ?? "todo",
    });

    // If this is a recurrence with multiple target days, seed upcoming occurrences (next 4 weeks / 3 months)
    try {
      if (recurrence === 'weekly' && recurrenceDays.length) {
        const nameToDow: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
        const startBase = due_at ? new Date(due_at) : new Date();
        const weeks = 12;
        const toCreate: string[] = [];
        for (let w=0; w<weeks; w++) {
          for (const d of recurrenceDays) {
            const dow = nameToDow[d];
            if (dow === undefined) continue;
            const base = new Date(startBase);
            base.setDate(base.getDate() + w*7);
            // find next dow on/after base
            const diff = (dow - base.getDay() + 7) % 7;
            const dt = new Date(base);
            dt.setDate(base.getDate() + diff);
            // set time from dueTime
            if (dueTime) {
              const [hh, mm] = dueTime.split(":").map(Number);
              dt.setHours(hh, mm, 0, 0);
            }
            const iso = dt.toISOString();
            toCreate.push(iso);
          }
        }
        // dedupe and skip original
        const unique = Array.from(new Set(toCreate)).filter(d => d !== created.due_at);
        for (const iso of unique) {
          await upsert.mutateAsync({
            title: title.trim(),
            notes: notes.trim() ? notes.trim() : null,
            due_at: iso,
            group_id: groupId,
            tags: finalTags,
            priority,
            status: 'todo',
          });
        }
      } else if (recurrence === 'monthly' && (monthlyWeeks.length || recurrenceDays.length)) {
        const nameToDow: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
        const startBase = due_at ? new Date(due_at) : new Date();
        const months = 12;
        const toCreateDates: Date[] = [];
        for (let m=0; m<months; m++) {
          const monthDate = new Date(startBase.getFullYear(), startBase.getMonth() + m, 1);
          const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth()+1, 0).getDate();
          for (const dowName of recurrenceDays) {
            const dow = nameToDow[dowName];
            if (dow === undefined) continue;
            for (const wk of (monthlyWeeks.length ? monthlyWeeks : [1])) {
              if (wk === -1) {
                // last: find last dow in month
                for (let d = daysInMonth; d >= 1; d--) {
                  const day = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
                  if (day.getDay() === dow) {
                    toCreateDates.push(day);
                    break;
                  }
                }
              } else {
                // nth week: find first dow then add (wk-1)*7
                let firstDowDate: Date | null = null;
                for (let d=1; d<=7; d++) {
                  const day = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
                  if (day.getDay() === dow) { firstDowDate = day; break; }
                }
                if (firstDowDate) {
                  const target = new Date(firstDowDate);
                  target.setDate(firstDowDate.getDate() + (wk-1)*7);
                  if (target.getMonth() === monthDate.getMonth()) toCreateDates.push(target);
                }
              }
            }
          }
        }
        // set times and create
        const uniqIso = Array.from(new Set(toCreateDates.map(d => d.toISOString())));
        for (const isoRaw of uniqIso) {
          const d = new Date(isoRaw);
          if (dueTime) {
            const [hh, mm] = dueTime.split(":").map(Number);
            d.setHours(hh, mm, 0, 0);
          }
          const iso = d.toISOString();
          if (iso === created.due_at) continue;
          await upsert.mutateAsync({
            title: title.trim(),
            notes: notes.trim() ? notes.trim() : null,
            due_at: iso,
            group_id: groupId,
            tags: finalTags,
            priority,
            status: 'todo',
          });
        }
      }
    } catch (err) {
      // generation best-effort; ignore errors
      console.warn('seed recurrence failed', err);
    }

    onClose();
  };

  const remove = async () => {
    if (!reminder) return;
    await del.mutateAsync(reminder.id);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />
      <Card className="relative w-full sm:w-[620px] m-2 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/35">
          <div className="font-semibold">{isEdit ? "Edit reminder" : "New reminder"}</div>
          <button className="sy-btn" onClick={onClose} aria-label="close"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-white/60">Title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es: follow-up, deep work, palestra…" />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-white/60">Notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note rapide (opzionale)..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-xs text-white/60">Priority</div>
              <select className="sy-input w-full text-sm" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                <option value="low">low</option>
                <option value="med">med</option>
                <option value="high">high</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/60">Group</div>
              <select className="sy-input w-full text-sm" value={groupId ?? ""} onChange={(e) => setGroupId(e.target.value || null)}>
                <option value="">(none)</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
            <div className="space-y-2">
              <div className="text-xs text-white/60">Tags</div>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma separated (es: lavoro, sport, urgente)" />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-white/60">Schedule</div>
              <div className="flex items-center gap-2">
                <label className="sy-pill cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={dueEnabled} onChange={(e) => setDueEnabled(e.target.checked)} />
                  due
                </label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={!dueEnabled} />
                <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} disabled={!dueEnabled} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
            <div className="space-y-2">
              <div className="text-xs text-white/60">Recurrence</div>
              <select className="sy-input w-full text-sm" value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {recurrence === 'weekly' ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <button key={d} type="button" onClick={() => setRecurrenceDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])} className={`sy-pill ${recurrenceDays.includes(d) ? 'sy-pill-active' : ''}`}>{d}</button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-xs text-white/60">End time</div>
              <div className="flex items-center gap-2">
                <Input type="time" value={endTime ?? ''} onChange={(e) => setEndTime(e.target.value)} />
                <div className="flex gap-1">
                  <button type="button" className="sy-pill" onClick={() => {
                    // quick +30m
                    if (!dueEnabled) return;
                    const start = new Date(buildDueAtISO(dueDate, dueTime) || new Date().toISOString());
                    const cur = endTime ? endTime.split(":").map(Number) : [start.getHours(), start.getMinutes()];
                    const dt = new Date(start);
                    dt.setHours(cur[0], cur[1], 0, 0);
                    dt.setMinutes(dt.getMinutes() + 30);
                    setEndTime(dt.toISOString().slice(11,16));
                  }}>+30m</button>
                  <button type="button" className="sy-pill" onClick={() => {
                    // quick +60m
                    if (!dueEnabled) return;
                    const start = new Date(buildDueAtISO(dueDate, dueTime) || new Date().toISOString());
                    const cur = endTime ? endTime.split(":").map(Number) : [start.getHours(), start.getMinutes()];
                    const dt = new Date(start);
                    dt.setHours(cur[0], cur[1], 0, 0);
                    dt.setMinutes(dt.getMinutes() + 60);
                    setEndTime(dt.toISOString().slice(11,16));
                  }}>+1h</button>
                </div>
              </div>
            </div>
          </div>

          {recurrence === 'monthly' ? (
            <div className="mt-2">
              <div className="text-xs text-white/60">Which weeks</div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {[1,2,3,4].map(w => (
                  <button key={w} type="button" onClick={() => setMonthlyWeeks(prev => prev.includes(w) ? prev.filter(x=>x!==w) : [...prev, w])} className={`sy-pill ${monthlyWeeks.includes(w) ? 'sy-pill-active' : ''}`}>{w}ª</button>
                ))}
                <button type="button" onClick={() => setMonthlyWeeks(prev => prev.includes(-1) ? prev.filter(x=>x!==-1) : [...prev, -1])} className={`sy-pill ${monthlyWeeks.includes(-1) ? 'sy-pill-active' : ''}`}>Last</button>
              </div>

              <div className="mt-3 text-xs text-white/60">Days of week</div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <button key={d} type="button" onClick={() => setRecurrenceDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])} className={`sy-pill ${recurrenceDays.includes(d) ? 'sy-pill-active' : ''}`}>{d}</button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              {isEdit ? (
                <Button onClick={remove} className="border border-red-400/25 bg-red-400/10 hover:bg-red-400/14">
                  Delete
                </Button>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={save} disabled={!canSave || upsert.isPending}>
                {upsert.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
