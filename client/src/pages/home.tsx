import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Truck, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle,
  MapPin,
  ArrowRight,
  Trash2,
  Recycle,
  Shield,
  Zap
} from 'lucide-react';
import MobileLayout, { MobileCard, MobileButton, MobileSection } from '@/components/mobile-layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const serviceFeatures = [
  {
    icon: Truck,
    title: "Professional Pickup",
    description: "Reliable weekly service at your doorstep"
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Book one-time or recurring pickups"
  },
  {
    icon: Shield,
    title: "Fully Insured",
    description: "Licensed and bonded for your peace of mind"
  },
  {
    icon: Zap,
    title: "7 Days a Week",
    description: "Service available every day of the week"
  }
];

const pricingOptions = [
  {
    type: 'subscription',
    packageType: 'basic',
    title: 'Basic Package',
    price: '$35',
    period: '/month',
    popular: false,
    features: ['Weekly trash pickup', 'Up to 6 trash bags', '1 bag of recycling', 'Residential properties only'],
    subtitle: 'Perfect for small households',
    buttonText: 'Get Started'
  },
  {
    type: 'subscription',
    packageType: 'clean-carry',
    title: 'Clean & Carry',
    price: '$60',
    period: '/month',
    popular: true,
    features: ['Weekly trash pickup', 'Up to 6 trash bags', '1 bag of recycling', '1 furniture item included', 'Weekly bin power washing'],
    subtitle: 'Most popular choice',
    buttonText: 'Choose Plan'
  },
  {
    type: 'subscription',
    packageType: 'heavy-duty',
    title: 'Heavy Duty',
    price: '$75',
    period: '/month',
    popular: false,
    features: ['Twice weekly pickup', 'Up to 6 bags per pickup', '1 recycling bag per pickup', '1 furniture item per week', 'Weekly power washing'],
    subtitle: 'For busy households',
    buttonText: 'Choose Plan'
  },
  {
    type: 'subscription',
    packageType: 'premium',
    title: 'Premium Property',
    price: '$150',
    period: '/month',
    popular: false,
    features: ['Twice weekly pickup', 'Up to 6 bags per pickup', '1 recycling bag per pickup', '1 furniture item per week', 'Weekly power washing', 'Monthly lawn mowing'],
    subtitle: 'Complete property care',
    buttonText: 'Choose Plan'
  },
  {
    type: 'cleanout',
    title: 'Cleanout Services',
    price: 'Call for Quote',
    period: '',
    popular: false,
    features: ['House cleanouts', 'Basement & attic clearing', 'Estate cleanouts', 'Construction debris'],
    subtitle: 'Custom cleaning solutions',
    buttonText: 'Call (267) 401-4292',
    isSpecial: true
  }
];



export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<'subscription' | 'one-time' | null>(null);
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect authenticated users to their appropriate dashboard
      const targetPath = user.role === 'admin' ? '/admin' : 
                         user.role === 'driver' ? '/driver' : '/dashboard';
      window.location.href = targetPath;
    }
  }, [isAuthenticated, isLoading, user]);

  const handleBooking = (serviceType: 'subscription' | 'one-time') => {
    setSelectedService(serviceType);
    setLocation('/register');
  };

  const handleLogin = () => {
    setLocation('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If user is authenticated, they'll be redirected in useEffect
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Public Navigation Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8 text-primary" />
              <div className="leading-tight">
                <h1 className="font-bold text-lg leading-tight">Acapella Trash</h1>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">powered by HMBL</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin}>
                Sign In
              </Button>
              <Button onClick={() => setLocation('/register')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div className="app-gradient-bg text-white">
        <MobileSection className="text-center py-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-10 rounded-full mb-4">
              <Truck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Acapella Trash</h1>
            <p className="text-xl text-white text-opacity-90">powered by HMBL</p>
          </div>
          <p className="text-lg text-white text-opacity-90 mb-6 leading-relaxed">
            Professional waste removal service for Philadelphia. Where anything is possible and no job is too big or small — we will get it done.
          </p>
          
          {/* NEW Service Announcement */}
          <div className="bg-orange-500 bg-opacity-20 border border-orange-400 border-opacity-30 rounded-lg p-4 mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium mr-2">NEW!</span>
              <span className="text-white font-semibold">Now Offering Cleanout Services</span>
            </div>
            <p className="text-white text-opacity-90 text-sm mb-3">
              House cleanouts • Basements • Attics • Estate cleanouts • Garages
            </p>
            <MobileButton 
              variant="outline"
              className="border-orange-400 text-orange-100 hover:bg-orange-500 hover:text-white bg-orange-500 bg-opacity-10"
              onClick={() => window.open('tel:2674014292')}
            >
              Call (267) 401-4292 for Quote
            </MobileButton>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <MobileButton 
              variant="primary" 
              className="bg-white text-black hover:bg-white hover:bg-opacity-90"
              onClick={() => handleBooking('subscription')}
            >
              Start Weekly Service
            </MobileButton>
            <MobileButton 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
              onClick={() => handleBooking('one-time')}
            >
              One-Time Pickup
            </MobileButton>
          </div>
        </MobileSection>
      </div>

      {/* Features Section */}
      <MobileSection>
        <h2 className="text-2xl font-bold text-center mb-8">Why Choose Acapella?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviceFeatures.map((feature, index) => (
            <MobileCard key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary bg-opacity-10 rounded-full mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </MobileCard>
          ))}
        </div>
      </MobileSection>

      {/* Pricing Section */}
      <MobileSection className="bg-muted/30">
        <h2 className="text-2xl font-bold text-center mb-2">Choose Your Service Plan</h2>
        <p className="text-center text-muted-foreground mb-8">Professional trash removal for Philadelphia metro area</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {pricingOptions.map((option, index) => (
            <MobileCard 
              key={`${option.type}-${(option as any).packageType || index}`} 
              className={`relative shadow-lg hover:shadow-xl transition-all duration-300 ${option.popular ? 'border-primary border-2 shadow-primary/20' : 'border border-border'} ${(option as any).isSpecial ? 'border-orange-500 border-2' : ''}`}
            >
              {option.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {(option as any).isSpecial && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    NEW Service!
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                {(option as any).subtitle && (
                  <p className="text-sm text-muted-foreground mb-3">{(option as any).subtitle}</p>
                )}
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-3xl font-bold text-primary">{option.price}</span>
                  <span className="text-muted-foreground ml-1">{option.period}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <CheckCircle className="w-4 h-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-left">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {(option as any).isSpecial ? (
                <MobileButton 
                  variant="outline"
                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={() => window.open('tel:2674014292')}
                >
                  {option.buttonText}
                </MobileButton>
              ) : (
                <MobileButton 
                  variant={option.popular ? 'primary' : 'outline'}
                  className={`w-full ${option.popular ? 'bg-primary hover:bg-primary/90 text-white' : 'border-2 hover:border-primary hover:text-primary'}`}
                  onClick={() => handleBooking(option.type as 'subscription' | 'one-time')}
                >
                  {option.buttonText}
                </MobileButton>
              )}
            </MobileCard>
          ))}
        </div>
      </MobileSection>

      {/* How It Works */}
      <MobileSection>
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Book Your Service</h3>
              <p className="text-sm text-muted-foreground">Choose subscription or one-time pickup</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Place Your Bags</h3>
              <p className="text-sm text-muted-foreground">Put bags at your curb by 7 AM</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">We Pick Up</h3>
              <p className="text-sm text-muted-foreground">Professional pickup by our team</p>
            </div>
          </div>
        </div>
      </MobileSection>



      {/* CTA Section */}
      <MobileSection className="text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8">
          Join hundreds of satisfied customers in your neighborhood
        </p>
        <div className="space-y-3">
          <MobileButton 
            variant="primary" 
            className="w-full"
            onClick={() => handleBooking('subscription')}
          >
            Start Weekly Service
          </MobileButton>
          <MobileButton 
            variant="outline" 
            className="w-full"
            onClick={() => handleBooking('one-time')}
          >
            Book One-Time Pickup
          </MobileButton>
        </div>
      </MobileSection>

      {/* Footer */}
      <footer className="bg-muted/20 mt-12">
        <MobileSection className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Truck className="w-6 h-6 mr-2" />
            <span className="font-semibold">Acapella Trash</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Professional residential trash pickup service
          </p>
        </MobileSection>
      </footer>
      </main>
    </div>
  );
}