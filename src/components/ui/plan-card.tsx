import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Check, 
  Zap, 
  Clock, 
  Wifi, 
  ChevronDown,
  CreditCard,
  Smartphone,
  Globe
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string;
  features?: string[];
  popular?: boolean;
  current?: boolean;
}

interface PlanCardProps {
  plan: Plan;
  onSelectPayment: (planId: string, paymentMethod: string) => void;
  loading?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSelectPayment,
  loading = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: Smartphone,
      description: 'Pay with your mobile money',
      color: 'text-green-600',
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Globe,
      description: 'Pay with PayPal account',
      color: 'text-blue-600',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay with Visa, MasterCard',
      color: 'text-purple-600',
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getSpeedLabel = (speed: number) => {
    if (speed >= 1000) {
      return `${speed / 1000}Gbps`;
    }
    return `${speed}Mbps`;
  };

  const getValidityLabel = (days: number) => {
    if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} Month${months > 1 ? 's' : ''}`;
    }
    return `${days} Days`;
  };

  const handlePaymentSelect = (paymentMethod: string) => {
    onSelectPayment(plan.id, paymentMethod);
    setIsDropdownOpen(false);
  };

  return (
    <Card 
      className={`professional-card relative ${
        plan.popular ? 'ring-2 ring-isp-blue-500 ring-opacity-50' : ''
      } ${plan.current ? 'bg-isp-blue-50 border-isp-blue-200' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-isp-blue-600 text-white px-4 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      {plan.current && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-isp-teal-600 text-white px-3 py-1">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-heading font-bold text-gray-900">
          {plan.name}
        </CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-isp-blue-700">
            {formatPrice(plan.price_kes)}
          </span>
          <span className="text-sm text-gray-500 ml-1">
            /{getValidityLabel(plan.validity_days)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Features */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Wifi className="h-4 w-4 text-isp-blue-600" />
              <span>{getSpeedLabel(plan.speed_limit_mbps)}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4 text-isp-teal-600" />
              <span>{getValidityLabel(plan.validity_days)}</span>
            </div>
          </div>

          {plan.description && (
            <p className="text-sm text-gray-600 text-center">
              {plan.description}
            </p>
          )}
        </div>

        {/* Features List */}
        {plan.features && plan.features.length > 0 && (
          <div className="space-y-3">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Check className="h-4 w-4 text-isp-teal-600" />
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4">
          {plan.current ? (
            <Button 
              variant="outline" 
              className="w-full" 
              disabled
            >
              Current Plan
            </Button>
          ) : (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-isp-blue-600 hover:bg-isp-blue-700 text-white' 
                      : 'bg-white hover:bg-isp-gray-50 text-isp-blue-600 border-isp-blue-200'
                  }`}
                  disabled={loading}
                >
                  <span>Select Plan</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                  {plan.popular && <Zap className="ml-2 h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                className="w-64 animate-dropdown-open" 
                align="center"
              >
                <DropdownMenuLabel className="text-center">
                  Choose Payment Method
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {paymentMethods.map((method) => (
                  <DropdownMenuItem
                    key={method.id}
                    onClick={() => handlePaymentSelect(method.id)}
                    className="cursor-pointer p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <method.icon className={`h-5 w-5 ${method.color}`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {method.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {method.description}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
};