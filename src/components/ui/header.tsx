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
  Shield,
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
      admin: 'bg-ocean-blue-100 text-ocean-blue-800 border border-ocean-blue-200',
      subadmin: 'bg-forest-green-100 text-forest-green-800 border border-forest-green-200',
      client: 'bg-sand-gold-100 text-sand-gold-800 border border-sand-gold-200',
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
    <header className="navbar-cyber shadow-cyber border-b border-ocean-blue-400/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ocean-blue-500 to-ocean-blue-600 rounded-lg flex items-center justify-center shadow-glow">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">
                  PrimeBill Kenya
                </h1>
                <p className="text-xs text-ocean-blue-200 font-medium">
                  Secure Network Solutions
                </p>
              </div>
            </div>
          </div>

          {/* User Profile Controls */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Help Icon */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-ocean-blue-200 hover:text-white hover:bg-ocean-blue-500/20 transition-all duration-200"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-3 hover:bg-ocean-blue-500/20 rounded-lg px-3 py-2 text-white transition-all duration-200"
                  >
                    <Avatar className="h-8 w-8 border-2 border-ocean-blue-400/30">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="bg-ocean-blue-100 text-ocean-blue-700 text-sm font-medium">
                        {getInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium text-white">
                        {user.name || user.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-ocean-blue-200">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(user.role)}
                      <ChevronDown className="h-4 w-4 text-ocean-blue-200" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-white border border-ocean-blue-200 shadow-cyber rounded-lg"
                >
                  <DropdownMenuLabel className="text-charcoal-grey-500">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-ocean-blue-100" />
                  
                  <DropdownMenuItem 
                    onClick={onProfileClick}
                    className="cursor-pointer hover:bg-ocean-blue-50 transition-colors"
                  >
                    <User className="mr-2 h-4 w-4 text-ocean-blue-600" />
                    <span className="text-charcoal-grey-500">Profile</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={onSettingsClick}
                    className="cursor-pointer hover:bg-ocean-blue-50 transition-colors"
                  >
                    <Settings className="mr-2 h-4 w-4 text-ocean-blue-600" />
                    <span className="text-charcoal-grey-500">Settings</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-ocean-blue-100" />
                  
                  <DropdownMenuItem 
                    onClick={onSignOut}
                    className="cursor-pointer text-alert-red-600 focus:text-alert-red-600 hover:bg-alert-red-50 transition-colors"
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