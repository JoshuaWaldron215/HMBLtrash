import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import { Play, TestTube, Route, MapPin, Clock, DollarSign } from 'lucide-react';

export default function TestDashboard() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any>(null);

  // Create test pickups mutation
  const createPickupsMutation = useMutation({
    mutationFn: () => 
      authenticatedRequest('/api/test/create-pickups', { method: 'POST' }),
    onSuccess: (data) => {
      const result = data.json();
      setTestResults(result);
      toast({
        title: "Test Pickups Created",
        description: `Created ${result.pickups?.length || 0} test pickups with optimized route`,
      });
    },
  });

  // Run complete test mutation
  const completeTestMutation = useMutation({
    mutationFn: () => 
      authenticatedRequest('/api/test/complete-test', { method: 'POST' }),
    onSuccess: (data) => {
      const result = data.json();
      setTestResults(result);
      toast({
        title: "Complete Test Finished",
        description: "Route optimization system tested successfully",
      });
    },
  });

  // Get test workflow query
  const { data: workflowData, refetch: refetchWorkflow } = useQuery({
    queryKey: ['/api/test/workflow'],
    queryFn: () => authenticatedRequest('/api/test/workflow').then(res => res.json()),
    enabled: false,
  });

  const runWorkflowTest = () => {
    refetchWorkflow();
    toast({
      title: "Testing Workflow",
      description: "Running pickup workflow analysis...",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Route Optimization Test Dashboard</h1>
        <p className="text-muted-foreground">
          Test the complete pickup request to optimized route workflow
        </p>
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TestTube className="w-5 h-5 mr-2 text-blue-600" />
              Create Test Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create 5 test pickups with real SF addresses and run route optimization
            </p>
            <Button 
              onClick={() => createPickupsMutation.mutate()}
              disabled={createPickupsMutation.isPending}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {createPickupsMutation.isPending ? 'Creating...' : 'Create Test Pickups'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Route className="w-5 h-5 mr-2 text-green-600" />
              Test Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test pricing calculations and route summary generation
            </p>
            <Button 
              onClick={runWorkflowTest}
              variant="outline"
              className="w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              Test Workflow
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              Complete Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run full system test with data creation and route optimization
            </p>
            <Button 
              onClick={() => completeTestMutation.mutate()}
              disabled={completeTestMutation.isPending}
              variant="secondary"
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {completeTestMutation.isPending ? 'Testing...' : 'Run Complete Test'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Route className="w-5 h-5 mr-2 text-blue-600" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testResults.testData && (
                <div>
                  <h3 className="font-semibold mb-3">Created Pickups</h3>
                  <div className="space-y-2">
                    {testResults.testData.pickups?.map((pickup: any) => (
                      <div key={pickup.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Pickup #{pickup.id}</p>
                            <p className="text-sm text-muted-foreground">{pickup.address}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {pickup.bagCount} bags • {pickup.serviceType} • {pickup.priority}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">${pickup.amount}</p>
                            <p className="text-xs text-muted-foreground">{pickup.paymentStatus}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResults.testData?.route && (
                <div>
                  <h3 className="font-semibold mb-3">Optimized Route</h3>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Distance:</span>
                        <span className="font-medium">{testResults.testData.route.totalDistance} miles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Estimated Time:</span>
                        <span className="font-medium">{testResults.testData.route.estimatedTime} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Stops:</span>
                        <span className="font-medium">{testResults.testData.route.pickupIds?.length || 0}</span>
                      </div>
                      {testResults.testData.route.googleMapsUrl && (
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => window.open(testResults.testData.route.googleMapsUrl, '_blank')}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Open Route in Google Maps
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Results */}
      {workflowData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Workflow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {workflowData.pendingPickups}
                </div>
                <div className="text-sm text-muted-foreground">Pending Pickups</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {workflowData.immediateRequests}
                </div>
                <div className="text-sm text-muted-foreground">Immediate Requests</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ${workflowData.estimatedRevenue?.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Estimated Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Test the Driver Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Create Test Pickups" to generate sample pickup requests</li>
            <li>Login as driver@test.com (password: password123)</li>
            <li>Navigate to the Driver Dashboard (/driver)</li>
            <li>Test the "Complete" buttons for each pickup</li>
            <li>Verify the route summary shows total distance and time</li>
            <li>Test the Google Maps navigation links</li>
            <li>Check that the progress bar updates as pickups are completed</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}