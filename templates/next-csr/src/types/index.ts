export type Role = 'admin' | 'manager' | 'user';

export type Permission =
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'dashboard:read';
