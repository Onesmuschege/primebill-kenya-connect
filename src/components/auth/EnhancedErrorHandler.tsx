import { AlertTriangle, Wifi, WifiOff, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthError {
  code?: string;
  message: string;
  details?: string;
}

interface EnhancedErrorHandlerProps {
  error: AuthError;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showNetworkDiagnostics?: boolean;
}

const getErrorInfo = (error: AuthError) => {
  const { message, code } = error;

  // Network-related errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('timeout')) {
    return {
      title: 'Connection Problem',
      description: 'Unable to connect to our servers. Please check your internet connection.',
      icon: WifiOff,
      severity: 'warning' as const,
      actions: ['retry', 'network-check'],
      isNetworkIssue: true,
    };
  }

  // Authentication errors
  if (message.includes('Invalid login credentials')) {
    return {
      title: 'Login Failed',
      description: 'The email or password you entered is incorrect. Please try again.',
      icon: AlertTriangle,
      severity: 'error' as const,
      actions: ['retry'],
      suggestion: 'Double-check your email and password. Remember that passwords are case-sensitive.',
    };
  }

  if (message.includes('User already registered')) {
    return {
      title: 'Account Already Exists',
      description: 'An account with this email address already exists.',
      icon: AlertTriangle,
      severity: 'warning' as const,
      actions: ['login-instead'],
      suggestion: 'Try signing in instead, or use a different email address.',
    };
  }

  if (message.includes('Email not confirmed')) {
    return {
      title: 'Email Not Verified',
      description: 'Please check your email and click the verification link before signing in.',
      icon: AlertTriangle,
      severity: 'warning' as const,
      actions: ['resend-email'],
      suggestion: 'Check your spam folder if you don\'t see the verification email.',
    };
  }

  if (message.includes('Too many requests')) {
    return {
      title: 'Too Many Attempts',
      description: 'Too many login attempts. Please wait a few minutes before trying again.',
      icon: AlertTriangle,
      severity: 'warning' as const,
      actions: ['wait'],
      suggestion: 'This is a security measure to protect your account.',
    };
  }

  if (message.includes('Password should be')) {
    return {
      title: 'Password Requirements',
      description: 'Your password doesn\'t meet our security requirements.',
      icon: AlertTriangle,
      severity: 'error' as const,
      actions: ['retry'],
      suggestion: 'Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.',
    };
  }

  if (message.includes('account_locked')) {
    return {
      title: 'Account Locked',
      description: 'Your account has been temporarily locked due to multiple failed login attempts.',
      icon: AlertTriangle,
      severity: 'error' as const,
      actions: ['contact-support'],
      suggestion: 'Please contact support to unlock your account or wait for the lockout period to expire.',
    };
  }

  if (message.includes('account_suspended')) {
    return {
      title: 'Account Suspended',
      description: 'Your account has been suspended. Please contact support for assistance.',
      icon: AlertTriangle,
      severity: 'error' as const,
      actions: ['contact-support'],
      suggestion: 'This may be due to billing issues or terms of service violations.',
    };
  }

  if (message.includes('account_delinquent')) {
    return {
      title: 'Payment Required',
      description: 'Your account has outstanding payments. Please update your billing information.',
      icon: AlertTriangle,
      severity: 'warning' as const,
      actions: ['update-billing', 'contact-support'],
      suggestion: 'Update your payment method to restore full access to your account.',
    };
  }

  // Default error
  return {
    title: 'Authentication Error',
    description: message || 'An unexpected error occurred during authentication.',
    icon: AlertTriangle,
    severity: 'error' as const,
    actions: ['retry', 'contact-support'],
    suggestion: 'If this problem persists, please contact our support team.',
  };
};

export const EnhancedErrorHandler = ({ 
  error, 
  onRetry, 
  onContactSupport,
  showNetworkDiagnostics = false 
}: EnhancedErrorHandlerProps) => {
  const errorInfo = getErrorInfo(error);
  const IconComponent = errorInfo.icon;

  const handleAction = (action: string) => {
    switch (action) {
      case 'retry':
        onRetry?.();
        break;
      case 'contact-support':
        onContactSupport?.();
        break;
      case 'network-check':
        // Show network diagnostics
        break;
      case 'login-instead':
        // Switch to login form
        break;
      case 'resend-email':
        // Resend verification email
        break;
      default:
        break;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className={`h-5 w-5 ${
            errorInfo.severity === 'error' ? 'text-destructive' : 
            errorInfo.severity === 'warning' ? 'text-warning' : 
            'text-muted-foreground'
          }`} />
          {errorInfo.title}
        </CardTitle>
        <CardDescription>{errorInfo.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorInfo.suggestion && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>{errorInfo.suggestion}</AlertDescription>
          </Alert>
        )}

        {errorInfo.isNetworkIssue && showNetworkDiagnostics && (
          <Alert>
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Running network diagnostics... Please ensure you have a stable internet connection.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {errorInfo.actions.map((action) => {
            const actionLabels = {
              retry: 'Try Again',
              'contact-support': 'Contact Support',
              'network-check': 'Check Connection',
              'login-instead': 'Sign In Instead',
              'resend-email': 'Resend Email',
              'update-billing': 'Update Payment',
              wait: 'Please Wait',
            };

            return (
              <Button
                key={action}
                variant={action === 'retry' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAction(action)}
                disabled={action === 'wait'}
              >
                {action === 'retry' && <RefreshCw className="h-4 w-4 mr-2" />}
                {actionLabels[action as keyof typeof actionLabels] || action}
              </Button>
            );
          })}
        </div>

        {error.details && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Technical Details</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify({ message: error.message, code: error.code, details: error.details }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};