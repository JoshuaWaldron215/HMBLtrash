import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Bell, 
  Shield, 
  LogOut,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useLocation } from 'wouter';
import MobileLayout, { 
  MobileCard, 
  MobileButton, 
  MobileSection,
  MobileInput
} from '@/components/mobile-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import type { User as UserType } from '@shared/schema';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserType>>({});
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/me'],
    queryFn: () => authenticatedRequest('GET', '/api/me').then(res => res.json() as Promise<UserType>),
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (userData: Partial<UserType>) => 
      authenticatedRequest('PATCH', '/api/me', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setIsEditing(false);
      setEditedUser({});
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedUser({});
      setIsEditing(false);
    } else {
      setEditedUser({
        username: user?.username || '',
        email: user?.email || '',
        // phone: user?.phone || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editedUser) {
      updateUserMutation.mutate(editedUser);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  if (isLoading) {
    return (
      <MobileLayout title="Settings">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Settings"
      showBackButton={true}
      onBack={() => setLocation('/dashboard')}
    >
      <MobileSection className="pt-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <MobileCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Profile Information</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={isEditing ? handleEditToggle : handleEditToggle}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-medium mb-2 block">
                Name
              </Label>
              {isEditing ? (
                <Input
                  id="username"
                  value={editedUser.username || ''}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{user?.username}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email || ''}
                  onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="role" className="text-sm font-medium mb-2 block">
                Account Type
              </Label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="capitalize">{user?.role}</span>
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <MobileButton
                  variant="primary"
                  onClick={handleSave}
                  disabled={updateUserMutation.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </MobileButton>
                <MobileButton
                  variant="outline"
                  onClick={handleEditToggle}
                  className="flex-1"
                >
                  Cancel
                </MobileButton>
              </div>
            )}
          </div>
        </MobileCard>

        {/* Notification Preferences */}
        <MobileCard className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about pickup updates
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email updates and receipts
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </div>
        </MobileCard>

        {/* Account Actions */}
        <MobileCard>
          <h3 className="font-semibold text-lg mb-4">Account Actions</h3>
          
          <div className="space-y-3">
            <MobileButton
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // TODO: Implement password change
                toast({
                  title: "Coming Soon",
                  description: "Password change feature will be available soon.",
                });
              }}
            >
              <Shield className="w-4 h-4 mr-3" />
              Change Password
            </MobileButton>

            <MobileButton
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                // TODO: Implement data export
                toast({
                  title: "Coming Soon",
                  description: "Data export feature will be available soon.",
                });
              }}
            >
              <User className="w-4 h-4 mr-3" />
              Export My Data
            </MobileButton>

            <MobileButton
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </MobileButton>
          </div>
        </MobileCard>
      </MobileSection>
    </MobileLayout>
  );
}