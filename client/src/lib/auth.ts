
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem('token');
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

export const logout = (): void => {
  removeStoredToken();
  removeStoredUser();
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authenticatedRequest = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const headers = {
    ...getAuthHeaders(),
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...options?.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    window.location.href = '/login';
  }

  return response;
};
