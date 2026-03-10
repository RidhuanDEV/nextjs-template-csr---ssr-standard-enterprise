export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
