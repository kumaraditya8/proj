import { api } from "./client";
import type { Role, User } from "@/types";

export const usersApi = {
  async list(): Promise<User[]> {
    const { data } = await api.get("/users");
    return data;
  },
  async notifications() {
    return []; // Not implemented in backend yet
  },
  async updateRole(id: string, role: Role): Promise<User> {
    const { data } = await api.put(`/users/${id}/role`, { role });
    return data;
  },
};
