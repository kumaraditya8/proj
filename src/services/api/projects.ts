import { api } from "./client";
import type { Project } from "@/types";

export const projectsApi = {
  async list(): Promise<Project[]> {
    const { data } = await api.get("/projects");
    return data.map((p: any) => ({
      ...p,
      memberIds: p.members.map((m: any) => m.userId)
    }));
  },
  async get(id: string): Promise<Project | undefined> {
    const { data } = await api.get(`/projects/${id}`);
    return {
      ...data,
      memberIds: data.members.map((m: any) => m.userId)
    };
  },
  async create(input: Omit<Project, "id" | "createdAt" | "color" | "memberIds"> & { color?: string }): Promise<Project> {
    const { data } = await api.post("/projects", input);
    return {
      ...data,
      memberIds: data.members.map((m: any) => m.userId)
    };
  },
  async update(id: string, patch: Partial<Project>): Promise<Project> {
    const { data } = await api.put(`/projects/${id}`, patch);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async addMember(projectId: string, userId: string): Promise<Project> {
    await api.post(`/projects/${projectId}/members`, { userId });
    return this.get(projectId) as Promise<Project>;
  },

  async removeMember(projectId: string, userId: string, opts?: { unassignTasks?: boolean }): Promise<Project> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
    return this.get(projectId) as Promise<Project>;
  },

  async replaceMember(
    projectId: string,
    oldUserId: string,
    newUserId: string,
    opts?: { transferTasks?: boolean }
  ): Promise<Project> {
    await api.delete(`/projects/${projectId}/members/${oldUserId}`);
    await api.post(`/projects/${projectId}/members`, { userId: newUserId });
    return this.get(projectId) as Promise<Project>;
  },
};
