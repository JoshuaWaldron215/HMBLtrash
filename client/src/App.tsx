import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/protected-route";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import Driver from "@/pages/driver";
import DriverMap from "@/pages/driver-map";
import DriverHistory from "@/pages/driver-history";
import DriverProfile from "@/pages/driver-profile";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Landing page - shows different content based on auth status */}
      <Route path="/" component={Home} />
      
      {/* Protected customer routes */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={['customer']}>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/checkout">
        <ProtectedRoute allowedRoles={['customer']}>
          <Checkout />
        </ProtectedRoute>
      </Route>
      
      <Route path="/subscribe">
        <ProtectedRoute allowedRoles={['customer']}>
          <Subscribe />
        </ProtectedRoute>
      </Route>
      
      {/* Protected admin routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']}>
          <Admin />
        </ProtectedRoute>
      </Route>
      
      {/* Protected driver routes */}
      <Route path="/driver">
        <ProtectedRoute allowedRoles={['driver']}>
          <Driver />
        </ProtectedRoute>
      </Route>
      
      <Route path="/driver/map">
        <ProtectedRoute allowedRoles={['driver']}>
          <DriverMap />
        </ProtectedRoute>
      </Route>
      
      <Route path="/driver/history">
        <ProtectedRoute allowedRoles={['driver']}>
          <DriverHistory />
        </ProtectedRoute>
      </Route>
      
      <Route path="/driver/profile">
        <ProtectedRoute allowedRoles={['driver']}>
          <DriverProfile />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
