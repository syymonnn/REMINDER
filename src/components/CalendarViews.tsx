"use client";

import React, { useMemo } from "react";
import type { Reminder } from "@/lib/types";
import { monthGridDays, fmtTime } from "@/lib/date";
import { addDays, format, startOfDay } from "date-fns";

type Mode = "day" | "week" | "month";

function inSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function groupByDay(reminders: Reminder[]) {
  const map = new Map<string, Reminder[]>();
  reminders.forEach(r => {
    if (!r.due_at) return;
    const k = format(new Date(r.due_at), "yyyy-MM-dd");
    map.set(k, [...(map.get(k) ?? []), r]);
  });
  for (const [k, arr] of map) {
    arr.sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
    map.set(k, arr);
  }
  return map;
}

export default function CalendarViews({
  mode,
  cursor,
  reminders,
  onPickDay,
  onSetCursor,
}: {
  mode: Mode;
  cursor: Date;
  reminders: Reminder[];
  onPickDay: (d: Date) => void;
  onSetCursor: (d: Date) => void;
}) {
  const byDay = useMemo(() => groupByDay(reminders), [reminders]);

  if (mode === "day") {
    const key = format(cursor, "yyyy-MM-dd");
    const list = byDay.get(key) ?? [];
    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="font-semibold">{format(cursor, "EEEE dd MMMM")}</div>
          <button className="sy-btn" onClick={() => onPickDay(cursor)}>Open timeline</button>
        </div>
        <div className="mt-4 space-y-2">
          {list.length ? list.map(r => (
            <div key={r.id} className="rounded-[14px] border border-white/10 bg-white/4 p-3">
              <div className="text-sm font-semibold">{r.title}</div>
              <div className="mt-1 text-xs text-white/60">{r.due_at ? fmtTime(new Date(r.due_at)) : ""} • {r.priority} • {r.status}</div>
              {r.notes ? <div className="mt-2 text-xs text-white/60 line-clamp-2">{r.notes}</div> : null}
            </div>
          )) : (
            <div className="rounded-[14px] border border-white/10 bg-white/4 p-6 text-white/60">No items.</div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "week") {
    const start = startOfDay(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return (
      <div>
        <div className="font-semibold">{format(cursor, "EEEE dd MMMM")} (week)</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-7 gap-2">
          {days.map(d => {
            const k = format(d, "yyyy-MM-dd");
            const list = byDay.get(k) ?? [];
            const done = list.filter(r => r.status === "done").length;
            return (
              <div key={k} className="rounded-[14px] border border-white/10 bg-white/4 p-3">
                <button className="w-full text-left" onClick={() => { onSetCursor(d); onPickDay(d); }}>
                  <div className="text-xs text-white/60">{format(d, "EEE")}</div>
                  <div className="text-lg font-semibold">{format(d, "d")}</div>
                  <div className="text-xs text-white/55">{done}/{list.length} done</div>
                </button>
                <div className="mt-2 space-y-2">
                  {list.slice(0, 4).map(r => (
                    <div key={r.id} className="rounded-[12px] border border-white/10 bg-black/35 p-2">
                      <div className="text-xs font-semibold truncate">{r.title}</div>
                      {r.due_at ? <div className="text-[11px] text-white/55">{fmtTime(new Date(r.due_at))}</div> : null}
                    </div>
                  ))}
                  {list.length > 4 ? <div className="text-[11px] text-white/50">+{list.length - 4} more</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // month
  const days = monthGridDays(cursor);
  const month = cursor.getMonth();
  const weekNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="font-semibold">{format(cursor, "MMMM yyyy")}</div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-white/55">
        {weekNames.map(w => <div key={w} className="px-2">{w}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map(d => {
          const k = format(d, "yyyy-MM-dd");
          const list = byDay.get(k) ?? [];
          const done = list.filter(r => r.status === "done").length;
          const isOther = d.getMonth() !== month;
          const isToday = inSameDay(d, new Date());
          return (
            <button
              key={k}
              onClick={() => onPickDay(d)}
              className={[
                "rounded-[14px] border p-3 text-left transition",
                "border-white/10 bg-white/4 hover:bg-white/7",
                isOther ? "opacity-40" : "",
                isToday ? "border-[rgba(184,255,44,0.40)] bg-[rgba(184,255,44,0.08)]" : ""
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{format(d, "d")}</div>
                {list.length ? <div className="sy-pill">{done}/{list.length}</div> : null}
              </div>
              <div className="mt-2 space-y-1">
                {list.slice(0, 2).map(r => (
                  <div key={r.id} className="text-[11px] text-white/70 truncate">
                    {r.due_at ? fmtTime(new Date(r.due_at)) + " " : ""}{r.title}
                  </div>
                ))}
                {list.length > 2 ? <div className="text-[11px] text-white/45">+{list.length - 2} more</div> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
