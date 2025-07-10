import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, Menu, X } from "lucide-react";
import { isAuthenticated, logout, getStoredUser } from "@/lib/auth";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = getStoredUser();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Trash2 className="text-service-primary text-2xl mr-3" />
            <div>
              <h1 className="text-xl font-bold text-service-text">Acapella Trash Removal</h1>
              <p className="text-xs text-service-secondary -mt-1">powered by LEMDROIDS</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link href="/#services" className="text-service-secondary hover:text-service-primary transition-colors">
              Services
            </Link>
            <Link href="/#pricing" className="text-service-secondary hover:text-service-primary transition-colors">
              Pricing
            </Link>
            <Link href="/#contact" className="text-service-secondary hover:text-service-primary transition-colors">
              Contact
            </Link>
          </div>
          
          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {authenticated ? (
              <>
                <Link href={user?.role === 'admin' ? '/admin' : user?.role === 'driver' ? '/driver' : '/dashboard'}>
                  <Button variant="ghost" className="text-service-secondary hover:text-service-primary">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-service-secondary hover:text-service-primary"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-service-secondary hover:text-service-primary">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-service-primary text-white hover:bg-service-accent">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-200">
            <div className="space-y-2">
              <Link href="/#services" className="block px-3 py-2 text-service-secondary hover:text-service-primary">
                Services
              </Link>
              <Link href="/#pricing" className="block px-3 py-2 text-service-secondary hover:text-service-primary">
                Pricing
              </Link>
              <Link href="/#contact" className="block px-3 py-2 text-service-secondary hover:text-service-primary">
                Contact
              </Link>
              {authenticated ? (
                <>
                  <Link href={user?.role === 'admin' ? '/admin' : user?.role === 'driver' ? '/driver' : '/dashboard'}>
                    <Button variant="ghost" className="w-full justify-start text-service-secondary hover:text-service-primary">
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full justify-start text-service-secondary hover:text-service-primary"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full justify-start text-service-secondary hover:text-service-primary">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full justify-start bg-service-primary text-white hover:bg-service-accent">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
