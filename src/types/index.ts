export type Role = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  projectId: string;
  dueDate: string; // ISO
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  color: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
