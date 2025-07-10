import { useQuery } from "@tanstack/react-query";
import { getStoredToken, getStoredUser, removeStoredToken, removeStoredUser } from "@/lib/auth";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const token = getStoredToken();
      if (!token) {
        console.log('No token found in storage');
        return null;
      }
      
      const storedUser = getStoredUser();
      console.log('Retrieved stored user:', storedUser);
      console.log('Token exists:', !!token);
      
      // Return stored user for now, in a real app you'd validate the token with the server
      return storedUser;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = () => {
    removeStoredToken();
    removeStoredUser();
    window.location.href = '/';
  };

  console.log('useAuth - user:', user, 'isLoading:', isLoading, 'isAuthenticated:', !!user);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    error
  };
}