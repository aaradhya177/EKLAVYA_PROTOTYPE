export type UserRole = "athlete" | "coach" | "federation_admin" | "sys_admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  athlete_id: string | null;
  is_active: boolean;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};
