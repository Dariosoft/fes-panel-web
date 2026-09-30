export const SESSION_STATUS = {
  anonymous: 'anonymous',
  authenticated: 'authenticated',
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
