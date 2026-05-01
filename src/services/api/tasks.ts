import { api } from "./client";
import type { Task } from "@/types";

export const tasksApi = {
  async list(): Promise<Task[]> {
    const { data } = await api.get("/tasks");
    return data;
  },
  async create(input: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const { data } = await api.post("/tasks", input);
    return data;
  },
  async update(id: string, patch: Partial<Task>): Promise<Task> {
    if (patch.status) {
       const { data } = await api.put(`/tasks/${id}/status`, { status: patch.status });
       return data;
    }
    // We didn't implement full task update in backend, let's assume status for now
    const { data } = await api.put(`/tasks/${id}`, patch);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
