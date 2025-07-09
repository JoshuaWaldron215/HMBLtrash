import { useQuery } from "@tanstack/react-query";
import { getStoredToken, getStoredUser, removeStoredToken, removeStoredUser } from "@/lib/auth";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const token = getStoredToken();
      if (!token) return null;
      
      // Return stored user for now, in a real app you'd validate the token with the server
      return getStoredUser();
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = () => {
    removeStoredToken();
    removeStoredUser();
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    error
  };
}