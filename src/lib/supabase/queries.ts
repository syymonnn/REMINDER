import { supabase } from "./client";
import type { Group, Reminder, ReminderPriority, ReminderStatus } from "@/lib/types";

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user;
}

export async function listGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Group[];
}

export async function createGroup(name: string, color = "neutral"): Promise<Group> {
  const user = await getSessionUser();
  const { data, error } = await supabase
    .from("groups")
    .insert({ user_id: user.id, name, color })
    .select("*")
    .single();
  if (error) throw error;
  return data as Group;
}

export async function updateGroup(id: string, input: { name?: string; color?: string }): Promise<Group> {
  const { data, error } = await supabase
    .from("groups")
    .update({ ...(input.name ? { name: input.name } : {}), ...(input.color ? { color: input.color } : {}) })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Group;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw error;
}

export async function listRemindersRange(startISO: string, endISO: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .gte("due_at", startISO)
    .lt("due_at", endISO)
    .order("due_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Reminder[];
}

export async function listRemindersOpenRange(startISO: string, endISO: string): Promise<Reminder[]> {
  // include null due_at items as "inbox" — fetched separately in UI if needed
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .or(`due_at.gte.${startISO},due_at.is.null`)
    .lt("due_at", endISO)
    .order("due_at", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data ?? []) as Reminder[];
}

export async function upsertReminder(input: {
  id?: string;
  title: string;
  notes?: string | null;
  due_at?: string | null;
  group_id?: string | null;
  tags?: string[];
  status?: ReminderStatus;
  priority?: ReminderPriority;
}): Promise<Reminder> {
  const user = await getSessionUser();
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    user_id: user.id,
    title: input.title,
    notes: input.notes ?? null,
    due_at: input.due_at ?? null,
    group_id: input.group_id ?? null,
    tags: input.tags ?? [],
    status: input.status ?? "todo",
    priority: input.priority ?? "med",
  };

  const { data, error } = await supabase
    .from("reminders")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Reminder;
}

export async function deleteReminder(id: string) {
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleReminderDone(id: string, done: boolean): Promise<Reminder> {
  const { data, error } = await supabase
    .from("reminders")
    .update({ status: done ? "done" : "todo" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Reminder;
}
