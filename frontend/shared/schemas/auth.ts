import { z } from "zod";

export const UserRoleSchema = z.enum(["athlete", "coach", "federation_admin", "sys_admin"]);

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  role: UserRoleSchema,
  athlete_id: z.string().uuid().nullable(),
  is_active: z.boolean()
});

export const AuthTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal("bearer")
});

export const AuthSessionSchema = z.object({
  user: AuthUserSchema,
  tokens: AuthTokensSchema
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
