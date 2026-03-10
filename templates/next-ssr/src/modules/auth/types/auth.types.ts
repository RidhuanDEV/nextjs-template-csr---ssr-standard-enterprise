export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  user: AuthUser;
}
