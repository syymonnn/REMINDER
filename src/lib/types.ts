export type Group = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type ReminderStatus = "todo" | "done";
export type ReminderPriority = "low" | "med" | "high";

export type Reminder = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  group_id: string | null;
  tags: string[];
  status: ReminderStatus;
  priority: ReminderPriority;
  created_at: string;
  updated_at: string;
};
