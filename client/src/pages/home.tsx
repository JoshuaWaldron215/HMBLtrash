import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Truck, CheckCircle, Star } from "lucide-react";
import Navbar from "@/components/navbar";
import BookingModal from "@/components/booking-modal";

export default function Home() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<'subscription' | 'one-time'>('one-time');

  const openBookingModal = (serviceType: 'subscription' | 'one-time') => {
    setSelectedServiceType(serviceType);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-service-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-service-text mb-6">
                Reliable Trash Pickup <span className="text-service-primary">Made Simple</span>
              </h1>
              <p className="text-lg text-service-secondary mb-8 leading-relaxed">
                Professional residential trash removal service with flexible scheduling. Choose weekly subscriptions or one-time pickups that fit your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => openBookingModal('one-time')}
                  className="bg-service-primary text-white hover:bg-service-accent"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Pickup
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-service-primary text-service-primary hover:bg-service-primary hover:text-white"
                >
                  View Pricing
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Professional waste management truck" 
                className="rounded-xl shadow-lg w-full h-auto" 
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-md">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">4.9/5</span>
                  <span className="text-service-secondary text-sm">Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-service-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-service-text mb-4">How It Works</h2>
            <p className="text-lg text-service-secondary">Simple, reliable trash removal in three easy steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white shadow-sm text-center">
              <CardContent className="p-6">
                <div className="bg-service-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-service-primary h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-service-text mb-2">Schedule</h3>
                <p className="text-service-secondary">Choose your pickup schedule - weekly subscription or one-time service</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm text-center">
              <CardContent className="p-6">
                <div className="bg-service-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="text-service-primary h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-service-text mb-2">We Collect</h3>
                <p className="text-service-secondary">Our professional drivers arrive on time and handle your trash pickup</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm text-center">
              <CardContent className="p-6">
                <div className="bg-service-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-service-primary h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-service-text mb-2">Done</h3>
                <p className="text-service-secondary">Track completion and get notifications when your pickup is finished</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-service-text mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-service-secondary">Choose the plan that works best for you</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Subscription Plan */}
            <Card className="bg-service-primary text-white shadow-lg relative overflow-hidden">
              <CardContent className="p-8">
                <div className="absolute top-0 right-0 bg-service-accent px-4 py-2 text-sm font-semibold">
                  Most Popular
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Weekly Subscription</h3>
                  <p className="text-blue-100">Regular weekly pickup service</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-blue-100">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Weekly pickup service
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Flexible scheduling
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Priority customer support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Cancel anytime
                  </li>
                </ul>
                <Button 
                  onClick={() => openBookingModal('subscription')}
                  className="w-full bg-white text-service-primary hover:bg-gray-100"
                >
                  Start Subscription
                </Button>
              </CardContent>
            </Card>
            
            {/* One-time Service */}
            <Card className="bg-white border-2 border-gray-200 shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-service-text mb-2">One-Time Pickup</h3>
                  <p className="text-service-secondary">Perfect for occasional cleanouts</p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-4 bg-service-background rounded-lg">
                    <span className="font-medium">Up to 4 bags</span>
                    <span className="text-xl font-bold text-service-primary">$30</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-service-background rounded-lg">
                    <span className="font-medium">Up to 8 bags</span>
                    <span className="text-xl font-bold text-service-primary">$45</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-service-background rounded-lg">
                    <span className="font-medium">Up to 10 bags</span>
                    <span className="text-xl font-bold text-service-primary">$50</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-service-background rounded-lg">
                    <span className="font-medium">Up to 25 bags</span>
                    <span className="text-xl font-bold text-service-primary">$100</span>
                  </div>
                </div>
                <Button 
                  onClick={() => openBookingModal('one-time')}
                  className="w-full bg-service-primary text-white hover:bg-service-accent"
                >
                  Book One-Time
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-service-text text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Truck className="text-service-primary h-8 w-8 mr-3" />
                <div>
                  <h3 className="text-xl font-bold">Acapella Trash Removal</h3>
                  <p className="text-sm text-gray-300">powered by HMBL</p>
                </div>
              </div>
              <p className="text-gray-300">Professional residential trash removal service with reliable pickup and transparent pricing.</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-service-primary transition-colors">Weekly Subscription</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">One-Time Pickup</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Bulk Removal</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Special Requests</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-service-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-service-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-service-primary transition-colors">Report Issue</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Acapella Trash Removal powered by HMBL. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        serviceType={selectedServiceType}
      />
    </div>
  );
}
