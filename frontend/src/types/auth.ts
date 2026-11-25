export type AuthUser = {
  id: number;
  email: string;
  role: string;
};

export type AuthResponse = {
  success: boolean;
  user: AuthUser;
};
