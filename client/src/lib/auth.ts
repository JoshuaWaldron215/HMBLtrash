
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
  method: string,
  url: string,
  data?: unknown
): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
<<<<<<< HEAD
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
=======
>>>>>>> c50a39e (Improve error handling and streamline data fetching across the platform)
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    logout();
    window.location.href = '/login';
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorText;
    } catch {
      // If it's not JSON, use the raw text
    }
    
    throw new Error(errorMessage);
  }

  return response;
};
