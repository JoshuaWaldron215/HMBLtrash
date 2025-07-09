import React, { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { 
  Home, 
  Calendar, 
  Truck, 
  Settings, 
  User,
  PlusCircle,
  Menu,
  Bell,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  title?: string;
  rightAction?: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function MobileLayout({ 
  children, 
  showBottomNav = true, 
  title,
  rightAction,
  showBackButton = false,
  onBack
}: MobileLayoutProps) {
  const [location, setLocation] = useLocation();
  
  const navigationItems = [
    { 
      icon: Home, 
      label: 'Home', 
      path: '/dashboard',
      active: location === '/dashboard' || location === '/'
    },
    { 
      icon: Calendar, 
      label: 'Bookings', 
      path: '/dashboard',
      active: location === '/bookings'
    },
    { 
      icon: Truck, 
      label: 'Driver', 
      path: '/driver',
      active: location === '/driver'
    },
    { 
      icon: User, 
      label: 'Admin', 
      path: '/admin',
      active: location === '/admin'
    },
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2"
              >
                ←
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            {title && (
              <h1 className="text-lg font-semibold">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {rightAction}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 ${showBottomNav ? 'pb-20' : 'pb-4'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="app-bottom-nav">
          <div className="flex justify-around">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`app-tab-button ${
                  item.active ? 'active' : 'inactive'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

// Mobile-specific components
export function MobileCard({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`app-card ${className}`}>
      {children}
    </div>
  );
}

export function MobileButton({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  ...props 
}: { 
  children: ReactNode,
  variant?: 'primary' | 'secondary' | 'success' | 'outline',
  size?: 'default' | 'lg' | 'sm',
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClass = 'touch-manipulation';
  const variantClass = {
    primary: 'app-button-primary',
    secondary: 'app-button-secondary',
    success: 'app-button-success',
    outline: 'app-button-outline'
  }[variant];
  
  const sizeClass = {
    default: 'px-6 py-4',
    lg: 'px-8 py-5 text-lg',
    sm: 'px-4 py-3 text-sm'
  }[size];
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function MobileInput({ 
  label, 
  error, 
  className = '',
  ...props 
}: { 
  label?: string,
  error?: string,
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input 
        className={`app-input w-full ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function MobileSection({ 
  title, 
  children, 
  className = '' 
}: { 
  title?: string,
  children: ReactNode,
  className?: string
}) {
  return (
    <section className={`app-section ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ 
  status, 
  children 
}: { 
  status: 'pending' | 'assigned' | 'completed',
  children: ReactNode
}) {
  const statusClass = {
    pending: 'app-status-pending',
    assigned: 'app-status-assigned',
    completed: 'app-status-completed'
  }[status];
  
  return (
    <span className={statusClass}>
      {children}
    </span>
  );
}

export function FloatingActionButton({ 
  onClick, 
  children, 
  className = '' 
}: { 
  onClick: () => void,
  children: ReactNode,
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`app-floating-button ${className}`}
    >
      {children}
    </button>
  );
}