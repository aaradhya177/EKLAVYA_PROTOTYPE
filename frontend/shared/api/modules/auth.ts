import { getClient } from "../client";
import type { AuthTokens, AuthUser, RegisterPayload } from "../types";

export const login = async (email: string, password: string): Promise<AuthTokens> =>
  (await getClient().post<AuthTokens>("/auth/login", { email, password })).data;

export const register = async (data: RegisterPayload): Promise<AuthUser> =>
  (await getClient().post<AuthUser>("/auth/register", data)).data;

export const refresh = async (refreshToken: string): Promise<AuthTokens> =>
  (await getClient().post<AuthTokens>("/auth/refresh", { refresh_token: refreshToken })).data;

export const logout = async (): Promise<void> => {
  await getClient().post("/auth/logout");
};
