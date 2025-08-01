import { useQuery } from "@tanstack/react-query";
import { getStoredToken, getStoredUser, setStoredUser, removeStoredToken, removeStoredUser } from "@/lib/auth";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const token = getStoredToken();
      if (!token) {
        return null;
      }
      
      try {
        // Validate token with server
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          // Token is invalid, clear storage
          removeStoredToken();
          removeStoredUser();
          return null;
        }
        
        const userData = await response.json();
        // Update stored user with server data
        setStoredUser(userData);
        return userData;
      } catch (error) {
        // Network error or invalid response, clear storage
        removeStoredToken();
        removeStoredUser();
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = () => {
    removeStoredToken();
    removeStoredUser();
    window.location.href = '/';
  };

  // Debug logging - can be removed in production
  // console.log('useAuth - user:', user, 'isLoading:', isLoading, 'isAuthenticated:', !!user);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    error
  };
}