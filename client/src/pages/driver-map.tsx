import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Navigation, 
  Check, 
  Route,
  Clock,
  ChevronLeft,
  Info,
  Phone
} from 'lucide-react';
import MobileLayout, { 
  MobileCard, 
  MobileButton, 
  MobileSection, 
  StatusBadge 
} from '@/components/mobile-layout';
import { Button } from '@/components/ui/button';
import { authenticatedRequest } from '@/lib/auth';
import { useLocation } from 'wouter';

export default function DriverMap() {
  const [, setLocation] = useLocation();
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  // Fetch today's optimized route
  const { data: todayRoute = [] } = useQuery({
    queryKey: ['/api/driver/route'],
    queryFn: () => authenticatedRequest('GET', '/api/driver/route').then(res => res.json()),
  });

  const currentStop = todayRoute[currentStopIndex];
  const nextStop = todayRoute[currentStopIndex + 1];

  const handleNavigateToStop = (stop: any) => {
    const encodedAddress = encodeURIComponent(stop.address);
    window.open(`https://maps.google.com/maps?daddr=${encodedAddress}`, '_blank');
  };

  const handleNextStop = () => {
    if (currentStopIndex < todayRoute.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    }
  };

  const handlePrevStop = () => {
    if (currentStopIndex > 0) {
      setCurrentStopIndex(currentStopIndex - 1);
    }
  };

  return (
    <MobileLayout 
      title="Map View"
      showBackButton={true}
      onBack={() => setLocation('/driver')}
    >
      {todayRoute.length > 0 ? (
        <>
          {/* Current Stop Focus */}
          <MobileSection>
            <div className="text-center mb-4">
              <div className="inline-flex items-center bg-blue-100 rounded-full px-3 py-1 text-sm font-medium text-blue-800">
                Stop {currentStopIndex + 1} of {todayRoute.length}
              </div>
            </div>

            {currentStop && (
              <MobileCard className="border-l-4 border-blue-500 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {currentStop.routeOrder || currentStopIndex + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{currentStop.address}</h3>
                      <p className="text-sm text-gray-600">{currentStop.bags} bags • {currentStop.serviceType}</p>
                    </div>
                  </div>
                  <StatusBadge 
                    status={currentStop.status} 
                    className={currentStop.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {currentStop.status}
                  </StatusBadge>
                </div>

                {currentStop.estimatedArrival && (
                  <div className="flex items-center text-sm text-blue-700 mb-3">
                    <Clock className="w-4 h-4 mr-1" />
                    ETA: {new Date(currentStop.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {currentStop.specialInstructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                    <div className="flex items-start text-amber-800 text-sm">
                      <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{currentStop.specialInstructions}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleNavigateToStop(currentStop)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                  
                  {currentStop.status !== 'completed' && (
                    <Button 
                      variant="outline"
                      className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  )}
                </div>
              </MobileCard>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="outline" 
                onClick={handlePrevStop}
                disabled={currentStopIndex === 0}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                {currentStopIndex + 1} / {todayRoute.length}
              </span>
              
              <Button 
                variant="outline" 
                onClick={handleNextStop}
                disabled={currentStopIndex === todayRoute.length - 1}
                className="flex items-center"
              >
                Next
                <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
              </Button>
            </div>
          </MobileSection>

          {/* Next Stop Preview */}
          {nextStop && (
            <MobileSection>
              <h3 className="text-lg font-semibold mb-3">Next Stop</h3>
              <MobileCard className="border-l-4 border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm mr-3">
                      {nextStop.routeOrder || currentStopIndex + 2}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{nextStop.address}</h4>
                      <p className="text-sm text-gray-600">{nextStop.bags} bags • {nextStop.serviceType}</p>
                      {nextStop.distanceFromPrevious && (
                        <p className="text-xs text-gray-500">{nextStop.distanceFromPrevious.toFixed(1)} miles away</p>
                      )}
                    </div>
                  </div>
                </div>
              </MobileCard>
            </MobileSection>
          )}

          {/* Route Overview */}
          <MobileSection>
            <h3 className="text-lg font-semibold mb-3">Route Overview</h3>
            <MobileCard className="bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {todayRoute.filter((stop: any) => stop.status === 'completed').length}
                  </div>
                  <div className="text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {todayRoute.filter((stop: any) => stop.status !== 'completed').length}
                  </div>
                  <div className="text-gray-600">Remaining</div>
                </div>
              </div>
            </MobileCard>
          </MobileSection>
        </>
      ) : (
        <MobileSection>
          <MobileCard className="text-center py-8">
            <div className="text-gray-500 mb-2">
              <Route className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No route assigned for today</p>
              <p className="text-sm">Check back later or contact dispatch</p>
            </div>
          </MobileCard>
        </MobileSection>
      )}
    </MobileLayout>
  );
}