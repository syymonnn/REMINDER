"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Reminder } from "@/lib/types";
import { createGroup, deleteReminder, listGroups, listRemindersOpenRange, toggleReminderDone, upsertReminder, updateGroup, deleteGroup } from "@/lib/supabase/queries";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: listGroups,
  });
}

export function useRemindersRange(startISO: string, endISO: string) {
  return useQuery({
    queryKey: ["reminders", startISO, endISO],
    queryFn: () => listRemindersOpenRange(startISO, endISO),
  });
}

export function useUpsertReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertReminder,
    onSuccess: (_data, _vars) => {
      // invalidate all reminders queries (simple + reliable)
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["calendarAgg"] });
    },
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["calendarAgg"] });
    },
  });
}

export function useToggleDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => toggleReminderDone(id, done),
    onMutate: async ({ id, done }) => {
      // optimistic update
      await qc.cancelQueries({ queryKey: ["reminders"] });
      const keys = qc.getQueryCache().findAll({ queryKey: ["reminders"] }).map(q => q.queryKey);
      const snapshots: Array<[any, any]> = [];
      for (const k of keys) {
        const prev = qc.getQueryData<Reminder[]>(k);
        snapshots.push([k, prev]);
        if (prev) {
          qc.setQueryData<Reminder[]>(k, prev.map(r => r.id === id ? { ...r, status: done ? "done" : "todo" } : r));
        }
      }
      return { snapshots };
    },
    onError: (_e, _vars, ctx) => {
      ctx?.snapshots?.forEach(([k, v]: any) => qc.setQueryData(k, v));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["calendarAgg"] });
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) => createGroup(name, color ?? "neutral"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, color }: { id: string; name?: string; color?: string }) => updateGroup(id, { name, color }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}
