import React, { ReactNode, useState } from 'react';
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
  MapPin,
  X,
  LogOut,
  CreditCard,
  History,
  Users,
  Package,
  BarChart3,
  Route,
  ClipboardList,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  
  // Role-based navigation items
  const getNavigationItems = () => {
    if (!user) return [];
    
    if (user.role === 'customer') {
      return [
        { 
          icon: Home, 
          label: 'Home', 
          path: '/dashboard',
          active: location === '/dashboard'
        },
        { 
          icon: Calendar, 
          label: 'Next Pickup', 
          path: '/dashboard/next-pickup',
          active: location === '/dashboard/next-pickup'
        },
        { 
          icon: History, 
          label: 'Pickup History', 
          path: '/dashboard/history',
          active: location === '/dashboard/history'
        },
        { 
          icon: CreditCard, 
          label: 'Billing', 
          path: '/dashboard/billing',
          active: location === '/dashboard/billing'
        },
        { 
          icon: Settings, 
          label: 'Settings', 
          path: '/dashboard/settings',
          active: location === '/dashboard/settings'
        }
      ];
    }
    
    if (user.role === 'driver') {
      return [
        { 
          icon: ClipboardList, 
          label: 'My Route', 
          path: '/driver',
          active: location === '/driver'
        },
        { 
          icon: Map, 
          label: 'Map View', 
          path: '/driver/map',
          active: location === '/driver/map'
        },
        { 
          icon: History, 
          label: 'Pickup History', 
          path: '/driver/history',
          active: location === '/driver/history'
        },
        { 
          icon: User, 
          label: 'Profile', 
          path: '/driver/profile',
          active: location === '/driver/profile'
        }
      ];
    }
    
    if (user.role === 'admin') {
      return [
        { 
          icon: BarChart3, 
          label: 'Dashboard', 
          path: '/admin',
          active: location === '/admin'
        },
        { 
          icon: Users, 
          label: 'Subscribers', 
          path: '/admin/subscribers',
          active: location === '/admin/subscribers'
        },
        { 
          icon: Package, 
          label: 'One-Time Requests', 
          path: '/admin/requests',
          active: location === '/admin/requests'
        },
        { 
          icon: Route, 
          label: 'Route Optimization', 
          path: '/admin/routes',
          active: location === '/admin/routes'
        },
        { 
          icon: Truck, 
          label: 'Driver Assignments', 
          path: '/admin/drivers',
          active: location === '/admin/drivers'
        },
        { 
          icon: ClipboardList, 
          label: 'Pickup Reports', 
          path: '/admin/reports',
          active: location === '/admin/reports'
        },
        { 
          icon: Settings, 
          label: 'Settings', 
          path: '/admin/settings',
          active: location === '/admin/settings'
        }
      ];
    }
    
    return [
      { 
        icon: Home, 
        label: 'Home', 
        path: '/',
        active: location === '/'
      }
    ];
  };
  
  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-3">
                <Truck className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="font-bold text-lg">Acapella Trash</h2>
                  <p className="text-sm text-muted-foreground">powered by HMBL</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="px-6 py-4">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setLocation(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full ${
                      item.active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-border mt-4 pt-4">
                  <button
                    onClick={logout}
                    className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-6 w-6 shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        desktopSidebarOpen ? 'lg:w-72' : 'lg:w-16'
      }`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between">
            {desktopSidebarOpen && (
              <div className="flex items-center space-x-3">
                <Truck className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="font-bold text-lg">Acapella Trash</h2>
                  <p className="text-sm text-muted-foreground">powered by HMBL</p>
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
              className="shrink-0"
            >
              {desktopSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
          <nav className="flex flex-1 flex-col">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full ${
                    item.active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={desktopSidebarOpen ? '' : item.label}
                >
                  <item.icon className="h-6 w-6 shrink-0" />
                  {desktopSidebarOpen && item.label}
                </button>
              ))}
            </div>
            <div className="mt-auto border-t border-border pt-4">
              <button
                onClick={logout}
                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-red-600 hover:bg-red-50"
                title={desktopSidebarOpen ? '' : 'Sign Out'}
              >
                <LogOut className="h-6 w-6 shrink-0" />
                {desktopSidebarOpen && 'Sign Out'}
              </button>
            </div>
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
                  onClick={() => setSidebarOpen(true)}
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
      <div className={`transition-all duration-300 ${
        desktopSidebarOpen ? 'lg:pl-72' : 'lg:pl-16'
      }`}>
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
            {navigationItems.slice(0, 4).map((item) => (
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