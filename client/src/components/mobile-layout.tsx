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
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-3">
              <Truck className="w-8 h-8 text-primary" />
              <div>
                <h2 className="font-bold text-lg">Acapella Trash</h2>
                <p className="text-sm text-muted-foreground">powered by HMBL</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.map((item) => (
                    <li key={item.path}>
                      <button
                        onClick={() => setLocation(item.path)}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full ${
                          item.active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden">
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
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="lg:px-8">
          <main className={`${showBottomNav ? 'pb-20 lg:pb-8' : 'pb-4'}`}>
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <nav className="app-bottom-nav lg:hidden">
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