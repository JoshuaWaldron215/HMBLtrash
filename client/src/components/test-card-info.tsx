import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestCardInfoProps {
  testMode?: boolean;
  testCards?: {
    successful: string;
    declined: string;
    expired: string;
    insufficientFunds: string;
    cvcFailed: string;
    processingError?: string;
    fraudulent?: string;
  };
}

export default function TestCardInfo({ testMode = false, testCards }: TestCardInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullNumbers, setShowFullNumbers] = useState(false);
  const { toast } = useToast();

  if (!testMode || !testCards) {
    return null;
  }

  const cardScenarios = [
    {
      label: 'Successful Payment',
      number: testCards.successful,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      description: 'Payment will succeed'
    },
    {
      label: 'Card Declined',
      number: testCards.declined,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      description: 'Generic decline'
    },
    {
      label: 'Expired Card',
      number: testCards.expired,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      description: 'Card is expired'
    },
    {
      label: 'Insufficient Funds',
      number: testCards.insufficientFunds,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      description: 'Not enough funds'
    },
    {
      label: 'CVC Check Failed',
      number: testCards.cvcFailed,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      description: 'CVC verification failed'
    },
    ...(testCards.processingError ? [{
      label: 'Processing Error',
      number: testCards.processingError,
      icon: AlertCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      description: 'Payment processing error'
    }] : []),
    ...(testCards.fraudulent ? [{
      label: 'Fraudulent Transaction',
      number: testCards.fraudulent,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      description: 'Flagged as fraudulent'
    }] : [])
  ];

  const formatCardNumber = (number: string) => {
    if (showFullNumbers) {
      return number.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    return `****  ****  ****  ${number.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Test card number copied successfully",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Test Payment Mode</CardTitle>
            <Badge variant="outline" className="text-xs">
              No Real Charges
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Hide' : 'Show'} Test Cards
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              Use these test card numbers to simulate different payment scenarios. 
              Use any valid expiry date and CVC.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Test Card Numbers</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullNumbers(!showFullNumbers)}
              className="flex items-center gap-2 text-xs"
            >
              {showFullNumbers ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showFullNumbers ? 'Hide' : 'Show'} Full Numbers
            </Button>
          </div>
          
          <div className="grid gap-3">
            {cardScenarios.map((scenario) => {
              const Icon = scenario.icon;
              return (
                <div
                  key={scenario.label}
                  className={`flex items-center justify-between p-3 rounded-md border ${scenario.bgColor}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${scenario.color}`} />
                    <div>
                      <div className="font-medium text-sm">{scenario.label}</div>
                      <div className="text-xs text-gray-600">{scenario.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono px-2 py-1 bg-white rounded border">
                      {formatCardNumber(scenario.number)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(scenario.number)}
                      className="p-1 h-6 w-6"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h5 className="font-medium text-sm mb-2">Additional Test Details</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Use any valid expiry date (e.g., 12/25)</li>
              <li>• Use any 3-digit CVC (e.g., 123)</li>
              <li>• Use any billing ZIP code (e.g., 12345)</li>
              <li>• Payments simulate real Stripe responses</li>
              <li>• No actual charges will be made</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}