import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  LogOut,
  Edit3,
  Phone,
  Mail,
  Calendar,
  Truck,
  Star,
  Award,
  ChevronRight
} from 'lucide-react';
import MobileLayout, { 
  MobileCard, 
  MobileButton, 
  MobileSection 
} from '@/components/mobile-layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { authenticatedRequest } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

export default function DriverProfile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  // Fetch driver stats
  const { data: stats = {} } = useQuery({
    queryKey: ['/api/driver/stats'],
    queryFn: () => authenticatedRequest('GET', '/api/driver/stats').then(res => res.json()),
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  return (
    <MobileLayout 
      title="Profile"
      showBackButton={true}
      onBack={() => setLocation('/driver')}
    >
      {/* Profile Header */}
      <MobileSection>
        <MobileCard className="text-center py-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{user?.username}</h1>
          <p className="text-gray-600">{user?.email}</p>
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center bg-green-100 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-700">Active Driver</span>
            </div>
          </div>
        </MobileCard>
      </MobileSection>

      {/* Performance Stats */}
      <MobileSection>
        <h2 className="text-lg font-semibold mb-4">Performance</h2>
        <div className="grid grid-cols-2 gap-4">
          <MobileCard className="text-center py-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">156</div>
            <div className="text-sm text-gray-600">Completed Pickups</div>
          </MobileCard>
          <MobileCard className="text-center py-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">4.9</div>
            <div className="text-sm text-gray-600">Rating</div>
          </MobileCard>
        </div>
      </MobileSection>

      {/* Personal Information */}
      <MobileSection>
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <div className="space-y-3">
          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Email</h4>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </MobileCard>

          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Phone</h4>
                  <p className="text-sm text-gray-600">(555) 123-4567</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </MobileCard>

          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Start Date</h4>
                  <p className="text-sm text-gray-600">March 15, 2024</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </MobileCard>

          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Truck className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Vehicle</h4>
                  <p className="text-sm text-gray-600">Ford Transit - ABC123</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </MobileCard>
        </div>
      </MobileSection>

      {/* Settings */}
      <MobileSection>
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <div className="space-y-3">
          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Push Notifications</h4>
                  <p className="text-sm text-gray-600">Route updates and messages</p>
                </div>
              </div>
              <Switch 
                checked={notifications} 
                onCheckedChange={setNotifications}
              />
            </div>
          </MobileCard>

          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Location Sharing</h4>
                  <p className="text-sm text-gray-600">Share location with dispatch</p>
                </div>
              </div>
              <Switch 
                checked={locationSharing} 
                onCheckedChange={setLocationSharing}
              />
            </div>
          </MobileCard>

          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Privacy Settings</h4>
                  <p className="text-sm text-gray-600">Manage your privacy</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </MobileCard>
        </div>
      </MobileSection>

      {/* Actions */}
      <MobileSection>
        <div className="space-y-3">
          <MobileButton 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </MobileButton>
        </div>
      </MobileSection>
    </MobileLayout>
  );
}