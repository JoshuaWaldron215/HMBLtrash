import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authenticatedRequest } from '@/lib/auth';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Shield,
  TestTube
} from 'lucide-react';
import TestCardInfo from './test-card-info';

interface TestPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
  amount: number;
  serviceType: 'basic' | 'clean-carry' | 'heavy-duty' | 'premium' | 'one-time';
  testMode?: boolean;
  testCards?: any;
}

export default function TestPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  clientSecret,
  amount,
  serviceType,
  testMode = false,
  testCards 
}: TestPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    zip: ''
  });
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const { toast } = useToast();

  const handleCardDataChange = (field: string, value: string) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Limit to 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardData.number || !cardData.expiry || !cardData.cvc) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required payment fields",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentResult(null);

    try {
      if (testMode) {
        // Use test payment simulation
        const cardNumber = cardData.number.replace(/\s/g, '');
        const paymentIntentId = clientSecret.split('_secret_')[0];
        const paymentMethodId = `pm_test_${cardNumber}`;
        
        const response = await authenticatedRequest('POST', '/api/confirm-test-payment', {
          paymentIntentId,
          paymentMethodId
        });
        
        const result = await response.json();
        
        if (result.success) {
          setPaymentResult({
            success: true,
            message: "Payment successful! Your booking has been confirmed.",
            details: result
          });
          
          // Call success callback after showing success message
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
        } else {
          setPaymentResult({
            success: false,
            message: result.paymentIntent?.last_payment_error?.message || "Payment failed",
            details: result
          });
        }
      } else {
        // Real Stripe integration would go here
        throw new Error("Live Stripe integration not implemented");
      }
    } catch (error: any) {
      setPaymentResult({
        success: false,
        message: error.message || "Payment processing failed",
        details: error
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const useTestCard = (cardNumber: string) => {
    setCardData(prev => ({
      ...prev,
      number: formatCardNumber(cardNumber),
      expiry: '12/25',
      cvc: '123',
      name: 'Test User',
      zip: '12345'
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
            {testMode && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <TestTube className="w-4 h-4" />
                Test Mode
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {testMode 
              ? "Complete your payment using test card numbers. No real charges will be made."
              : "Complete your payment to finalize your booking."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Card Info */}
          {testMode && (
            <TestCardInfo testMode={testMode} testCards={testCards} />
          )}

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Service</span>
                  <span className="font-medium">
                    {serviceType === 'subscription' ? 'Weekly Subscription' : 'One-Time Pickup'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-medium">
                    ${amount.toFixed(2)}
                    {serviceType === 'subscription' && <span className="text-sm">/month</span>}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => handleCardDataChange('number', formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={cardData.expiry}
                      onChange={(e) => handleCardDataChange('expiry', formatExpiry(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      type="text"
                      placeholder="123"
                      value={cardData.cvc}
                      onChange={(e) => handleCardDataChange('cvc', e.target.value.replace(/\D/g, '').substring(0, 3))}
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Cardholder Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={cardData.name}
                    onChange={(e) => handleCardDataChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    type="text"
                    placeholder="12345"
                    value={cardData.zip}
                    onChange={(e) => handleCardDataChange('zip', e.target.value.replace(/\D/g, '').substring(0, 5))}
                    maxLength={5}
                    required
                  />
                </div>

                {/* Test Card Quick Actions */}
                {testMode && testCards && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Quick Test Cards</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => useTestCard(testCards.successful)}
                        className="text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => useTestCard(testCards.declined)}
                        className="text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Declined
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Result */}
                {paymentResult && (
                  <div className={`p-4 rounded-lg ${
                    paymentResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {paymentResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        paymentResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {paymentResult.message}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isProcessing || (paymentResult && paymentResult.success)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : paymentResult && paymentResult.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Payment Completed
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Pay ${amount.toFixed(2)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {testMode && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Test Mode Active</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                This is a test payment simulation. No real charges will be made.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}