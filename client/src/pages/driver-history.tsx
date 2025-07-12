import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  Calendar, 
  MapPin, 
  Package, 
  Check, 
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';
import MobileLayout, { 
  MobileCard, 
  MobileSection, 
  StatusBadge 
} from '@/components/mobile-layout';
import { authenticatedRequest } from '@/lib/auth';
import { useLocation } from 'wouter';
import type { Pickup } from '@shared/schema';

export default function DriverHistory() {
  const [, setLocation] = useLocation();

  // Fetch driver pickup history
  const { data: pickups = [] } = useQuery({
    queryKey: ['/api/pickups'],
    queryFn: () => authenticatedRequest('GET', '/api/pickups').then(res => res.json() as Promise<Pickup[]>),
  });

  const completedPickups = pickups.filter(p => p.status === 'completed');
  const sortedPickups = completedPickups.sort((a, b) => 
    new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );

  // Group pickups by date
  const groupedPickups = sortedPickups.reduce((acc, pickup) => {
    const date = new Date(pickup.scheduledDate).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(pickup);
    return acc;
  }, {} as Record<string, Pickup[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <MobileLayout 
      title="Pickup History"
      showBackButton={true}
      onBack={() => setLocation('/driver')}
    >
      {/* Summary Stats */}
      <MobileSection>
        <div className="grid grid-cols-3 gap-4">
          <MobileCard className="text-center py-4">
            <div className="text-2xl font-bold text-green-600">{completedPickups.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </MobileCard>
          <MobileCard className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              {completedPickups.reduce((sum, pickup) => sum + pickup.bags, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Bags</div>
          </MobileCard>
          <MobileCard className="text-center py-4">
            <div className="text-2xl font-bold text-purple-600">4.9</div>
            <div className="text-sm text-gray-600">Rating</div>
          </MobileCard>
        </div>
      </MobileSection>

      {/* Pickup History */}
      <MobileSection>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <History className="w-5 h-5 mr-2 text-gray-600" />
          Recent Pickups
        </h2>

        {Object.keys(groupedPickups).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedPickups).map(([date, dayPickups]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(date)} ({dayPickups.length} pickups)
                </h3>
                
                <div className="space-y-2">
                  {dayPickups.map((pickup) => (
                    <MobileCard key={pickup.id} className="border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{pickup.address}</h4>
                            <p className="text-sm text-gray-600">{pickup.bags} bags • {pickup.serviceType}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(pickup.scheduledDate).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <StatusBadge 
                            status="completed"
                            className="bg-green-100 text-green-800 mr-2"
                          >
                            Completed
                          </StatusBadge>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <MobileCard className="text-center py-8">
            <div className="text-gray-500 mb-2">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No pickup history yet</p>
              <p className="text-sm">Complete your first pickup to see history</p>
            </div>
          </MobileCard>
        )}
      </MobileSection>

      {/* Performance Metrics */}
      <MobileSection>
        <h2 className="text-lg font-semibold mb-4">Performance This Week</h2>
        <div className="space-y-3">
          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">On-Time Rate</h4>
                  <p className="text-sm text-gray-600">Average pickup timing</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">96%</div>
                <div className="text-xs text-gray-500">+2% vs last week</div>
              </div>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Customer Rating</h4>
                  <p className="text-sm text-gray-600">Average customer feedback</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">4.9</div>
                <div className="text-xs text-gray-500">Based on 24 reviews</div>
              </div>
            </div>
          </MobileCard>
        </div>
      </MobileSection>
    </MobileLayout>
  );
}