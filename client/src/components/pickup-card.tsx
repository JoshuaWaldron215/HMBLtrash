import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trash2, Clock, User, Navigation, Check } from "lucide-react";
import { Pickup } from "@shared/schema";

interface PickupCardProps {
  pickup: Pickup;
  userRole: string;
  onAssign?: (driverId: number) => void;
  onComplete?: () => void;
  onNavigate?: (address: string) => void;
  drivers?: Array<{ id: number; username: string }>;
}

export default function PickupCard({ 
  pickup, 
  userRole, 
  onAssign, 
  onComplete, 
  onNavigate, 
  drivers 
}: PickupCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'No time set';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-service-primary/10 rounded-full flex items-center justify-center">
              <span className="text-service-primary font-semibold text-sm">#{pickup.id}</span>
            </div>
            <div>
              <p className="font-medium text-service-text">
                {pickup.serviceType === 'subscription' ? 'Weekly Subscription' : 'One-Time Pickup'}
              </p>
              <p className="text-sm text-service-secondary">${pickup.amount}</p>
            </div>
          </div>
          <Badge className={getStatusColor(pickup.status)}>
            {pickup.status}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-service-secondary" />
            <p className="text-sm text-service-secondary">{pickup.address}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Trash2 className="h-4 w-4 text-service-secondary" />
            <p className="text-sm text-service-secondary">{pickup.bagCount} bags</p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-service-secondary" />
            <p className="text-sm text-service-secondary">
              {formatDate(pickup.scheduledDate)} at {formatTime(pickup.scheduledDate)}
            </p>
          </div>
        </div>

        {pickup.specialInstructions && (
          <div className="mb-4 p-3 bg-service-background rounded-lg">
            <p className="text-sm text-service-text">{pickup.specialInstructions}</p>
          </div>
        )}
        
        {/* Action buttons based on user role */}
        {userRole === 'admin' && pickup.status === 'pending' && (
          <div className="flex space-x-2">
            <select 
              onChange={(e) => onAssign?.(parseInt(e.target.value))}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Assign to driver...</option>
              {drivers?.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.username}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {userRole === 'driver' && pickup.status === 'assigned' && (
          <div className="flex space-x-2">
            <Button 
              onClick={() => onNavigate?.(pickup.address)}
              className="flex-1 bg-service-primary text-white hover:bg-service-accent"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Navigate
            </Button>
            <Button 
              onClick={onComplete}
              className="flex-1 bg-service-success text-white hover:bg-green-600"
            >
              <Check className="mr-2 h-4 w-4" />
              Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
