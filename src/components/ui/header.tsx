import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogOut, 
  User, 
  Settings, 
  HelpCircle,
  Wifi,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
  onSignOut: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignOut,
  onProfileClick,
  onSettingsClick,
}) => {
  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-isp-blue-100 text-isp-blue-800',
      subadmin: 'bg-isp-teal-100 text-isp-teal-800',
      client: 'bg-isp-gray-100 text-isp-gray-800',
    } as const;
    
    return (
      <Badge className={variants[role as keyof typeof variants] || variants.client}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wifi className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-isp-blue-700">
                  PrimeBill ISP
                </h1>
                <p className="text-xs text-isp-gray-500 font-medium">
                  Network Management
                </p>
              </div>
            </div>
          </div>

          {/* User Profile Controls */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Help Icon */}
              <Button variant="ghost" size="sm" className="text-isp-gray-500 hover:text-isp-blue-600">
                <HelpCircle className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 hover:bg-isp-gray-50 rounded-lg px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="bg-isp-blue-100 text-isp-blue-700 text-sm font-medium">
                        {getInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || user.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(user.role)}
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={onProfileClick}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={onSettingsClick}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={onSignOut}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};