import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { registerSchema, type RegisterData } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setStoredToken, setStoredUser } from "@/lib/auth";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, dirtyFields },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange", // Enable real-time validation
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/register", data);
      const result = await response.json();
      
      setStoredToken(result.token);
      setStoredUser(result.user);
      
      // Invalidate auth query to trigger immediate update
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      
      toast({
        title: "Registration successful",
        description: "Welcome to Acapella Trash Removal! You can now book pickup services.",
      });

      // Small delay to ensure auth state updates before redirect
      setTimeout(() => {
        // All new registrations go to customer dashboard
        setLocation('/dashboard');
      }, 100);
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = "Please check your information and try again.";
      
      if (error.message.includes("already exists")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message.includes("Password")) {
        errorMessage = "Password requirements not met. Please check password strength.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center">
              <Trash2 className="h-6 w-6 text-primary mr-2" />
              <div className="text-center">
                <h1 className="text-lg font-bold">Acapella Trash</h1>
                <p className="text-xs text-muted-foreground">powered by LEMDROIDS</p>
              </div>
            </div>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Create your account
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Start your trash removal service today
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register("username")}
                className="w-full"
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                className="w-full"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                {...register("phone")}
                className="w-full"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">
                Address (Optional)
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter your address"
                {...register("address")}
                className="w-full"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {/* Password strength indicator */}
              {watchedPassword && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">Password strength:</div>
                  <div className="flex space-x-1">
                    <div className={`h-1 w-1/4 rounded ${watchedPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 w-1/4 rounded ${watchedPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 w-1/4 rounded ${/[A-Z]/.test(watchedPassword) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-1 w-1/4 rounded ${/\d/.test(watchedPassword) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {watchedPassword.length >= 8 && /[A-Z]/.test(watchedPassword) && /\d/.test(watchedPassword) ? 
                      "Strong password" : 
                      "Include uppercase, lowercase, and numbers for stronger security"
                    }
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  {...register("confirmPassword")}
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-service-primary text-white hover:bg-service-accent"
              disabled={isLoading || !isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
            
            {/* Registration benefits */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">What you get with registration:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ Schedule weekly subscriptions or one-time pickups</li>
                <li>✓ Track your pickup history and manage billing</li>
                <li>✓ Priority customer support and flexible scheduling</li>
                <li>✓ Secure payment processing and account management</li>
              </ul>
            </div>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
