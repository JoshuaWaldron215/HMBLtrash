import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Calendar } from "lucide-react";
import { useLocation } from "wouter";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType?: 'subscription' | 'one-time';
}

export default function BookingModal({ isOpen, onClose, serviceType = 'one-time' }: BookingModalProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<'subscription' | 'one-time'>(serviceType);
  const [bagCount, setBagCount] = useState('4');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [, setLocation] = useLocation();

  const bagPrices = {
    '4': 30,
    '8': 45,
    '10': 50,
    '25': 100
  };

  const getPrice = () => {
    if (selectedServiceType === 'subscription') {
      return 20;
    }
    return bagPrices[bagCount as keyof typeof bagPrices];
  };

  const handleProceedToPayment = () => {
    const bookingData = {
      serviceType: selectedServiceType,
      bagCount: parseInt(bagCount),
      amount: getPrice(),
      address,
      scheduledDate: date,
      specialInstructions: instructions
    };

    // Store booking data in localStorage for checkout
    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Navigate to appropriate checkout page
    if (selectedServiceType === 'subscription') {
      setLocation('/subscribe');
    } else {
      setLocation('/checkout');
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-service-text">Book Your Pickup</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Service Type */}
          <div>
            <Label className="text-sm font-medium text-service-text mb-2 block">Service Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={selectedServiceType === 'subscription' ? 'default' : 'outline'}
                onClick={() => setSelectedServiceType('subscription')}
                className={selectedServiceType === 'subscription' 
                  ? 'bg-service-primary text-white hover:bg-service-accent' 
                  : 'border-service-primary text-service-primary hover:bg-service-primary hover:text-white'
                }
              >
                Subscription
              </Button>
              <Button
                type="button"
                variant={selectedServiceType === 'one-time' ? 'default' : 'outline'}
                onClick={() => setSelectedServiceType('one-time')}
                className={selectedServiceType === 'one-time' 
                  ? 'bg-service-primary text-white hover:bg-service-accent' 
                  : 'border-service-primary text-service-primary hover:bg-service-primary hover:text-white'
                }
              >
                One-Time
              </Button>
            </div>
          </div>

          {/* Bag Count (for one-time only) */}
          {selectedServiceType === 'one-time' && (
            <div>
              <Label className="text-sm font-medium text-service-text mb-2 block">Bag Count</Label>
              <Select value={bagCount} onValueChange={setBagCount}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Up to 4 bags - $30</SelectItem>
                  <SelectItem value="8">Up to 8 bags - $45</SelectItem>
                  <SelectItem value="10">Up to 10 bags - $50</SelectItem>
                  <SelectItem value="25">Up to 25 bags - $100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Address */}
          <div>
            <Label htmlFor="address" className="text-sm font-medium text-service-text mb-2 block">Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="Enter your pickup address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-service-text mb-2 block">
              {selectedServiceType === 'subscription' ? 'First Pickup Date' : 'Preferred Date'}
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Special Instructions */}
          <div>
            <Label htmlFor="instructions" className="text-sm font-medium text-service-text mb-2 block">Special Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Any special instructions for pickup..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full h-24 resize-none"
            />
          </div>

          {/* Total */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-service-text">Total</span>
              <span className="text-2xl font-bold text-service-primary">
                ${getPrice()}{selectedServiceType === 'subscription' ? '/month' : ''}
              </span>
            </div>
            <Button 
              onClick={handleProceedToPayment}
              className="w-full bg-service-primary text-white hover:bg-service-accent"
              disabled={!address || !date}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Proceed to Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
