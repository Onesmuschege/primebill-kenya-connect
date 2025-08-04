import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckIcon, XIcon } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = ''
}) => {
  const metRequirements = requirements.filter(req => req.test(password));
  const strength = (metRequirements.length / requirements.length) * 100;

  const getStrengthLabel = () => {
    if (strength < 40) return 'Weak';
    if (strength < 80) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strength < 40) return 'hsl(var(--destructive))';
    if (strength < 80) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength</span>
        <span style={{ color: getStrengthColor() }}>
          {getStrengthLabel()}
        </span>
      </div>
      
      <Progress 
        value={strength} 
        className="h-2"
        style={{ 
          '--progress-background': getStrengthColor() 
        } as React.CSSProperties}
      />

      <ul className="space-y-1 text-xs">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2">
            {req.test(password) ? (
              <CheckIcon className="h-3 w-3 text-success" />
            ) : (
              <XIcon className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={req.test(password) ? 'text-success' : 'text-muted-foreground'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};