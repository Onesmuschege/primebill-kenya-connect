
import React from 'react';
import { FieldError } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  error?: FieldError;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className = "" }) => {
  if (!error) return null;

  return (
    <div className={`flex items-center space-x-2 text-sm text-red-600 mt-1 ${className}`} role="alert">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error.message}</span>
    </div>
  );
};

interface FormFieldWrapperProps {
  label: string;
  required?: boolean;
  error?: FieldError;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  required = false,
  error,
  helpText,
  children,
  className = ""
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      <FormError error={error} />
    </div>
  );
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true, message: '' };
};
