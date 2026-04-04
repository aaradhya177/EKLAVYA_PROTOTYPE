export type CoachDashboardRoute =
  | "/coach"
  | "/coach/athletes"
  | `/coach/athletes/${string}`
  | "/coach/training-load"
  | "/coach/risk"
  | "/coach/settings";

export type FederationPortalRoute =
  | "/federation"
  | "/federation/athletes"
  | `/federation/athletes/${string}`
  | "/federation/grants"
  | "/federation/talent"
  | "/federation/settings";

export type WebRoute = "/" | "/login" | "/support" | CoachDashboardRoute | FederationPortalRoute;
