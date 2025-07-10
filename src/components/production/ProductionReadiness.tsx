
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ChecklistItem {
  name: string;
  status: 'complete' | 'partial' | 'incomplete' | 'not-started';
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const productionChecklist: ChecklistItem[] = [
  {
    name: 'Security Hardening',
    status: 'complete',
    description: 'Input sanitization, RBAC, secure headers, HTTPS',
    priority: 'high'
  },
  {
    name: 'State & Data Management',
    status: 'complete',
    description: 'React Query, loading states, error boundaries',
    priority: 'high'
  },
  {
    name: 'Analytics & Monitoring',
    status: 'complete',
    description: 'Usage tracking, error logging integration ready',
    priority: 'medium'
  },
  {
    name: 'Testing Suite',
    status: 'partial',
    description: 'Unit tests implemented, E2E tests needed',
    priority: 'high'
  },
  {
    name: 'Admin Tools',
    status: 'complete',
    description: 'Search, filtering, bulk operations, CSV export',
    priority: 'medium'
  },
  {
    name: 'UX/Accessibility',
    status: 'complete',
    description: 'Form validation, keyboard nav, ARIA labels, mobile responsive',
    priority: 'high'
  },
  {
    name: 'Code Quality',
    status: 'complete',
    description: 'Component refactoring, TypeScript safety, documentation',
    priority: 'medium'
  },
  {
    name: 'Deployment Setup',
    status: 'partial',
    description: 'Build optimizations ready, CI/CD pipeline needed',
    priority: 'high'
  },
  {
    name: 'Documentation',
    status: 'complete',
    description: 'Developer README, admin guide, user documentation',
    priority: 'medium'
  }
];

const getStatusIcon = (status: ChecklistItem['status']) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'partial':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'incomplete':
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case 'not-started':
      return <XCircle className="h-5 w-5 text-red-600" />;
  }
};

const getStatusBadge = (status: ChecklistItem['status']) => {
  const variants = {
    complete: 'default',
    partial: 'secondary',
    incomplete: 'outline',
    'not-started': 'destructive'
  } as const;

  const labels = {
    complete: 'Complete',
    partial: 'Partial',
    incomplete: 'Incomplete',
    'not-started': 'Not Started'
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
};

const getPriorityBadge = (priority: ChecklistItem['priority']) => {
  const variants = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline'
  } as const;

  return (
    <Badge variant={variants[priority]} className="ml-2">
      {priority.toUpperCase()}
    </Badge>
  );
};

export const ProductionReadiness: React.FC = () => {
  const completedItems = productionChecklist.filter(item => item.status === 'complete').length;
  const totalItems = productionChecklist.length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  const highPriorityIncomplete = productionChecklist.filter(
    item => item.priority === 'high' && item.status !== 'complete'
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Production Readiness Checklist
            <Badge variant={completionPercentage >= 80 ? 'default' : 'secondary'}>
              {completionPercentage}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            
            <div className="text-sm text-gray-600">
              {completedItems} of {totalItems} items completed
            </div>

            {highPriorityIncomplete.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">High Priority Items Remaining:</h4>
                <ul className="space-y-1">
                  {highPriorityIncomplete.map((item, index) => (
                    <li key={index} className="text-red-700 text-sm">
                      • {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {productionChecklist.map((item, index) => (
          <Card key={index} className={`transition-all duration-200 ${
            item.status === 'complete' ? 'bg-green-50 border-green-200' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-medium">{item.name}</h4>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Next Steps for Production Deployment:</h3>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>• Complete E2E testing with Cypress or Playwright</li>
            <li>• Set up CI/CD pipeline (GitHub Actions recommended)</li>
            <li>• Configure production environment variables</li>
            <li>• Set up error monitoring (Sentry integration ready)</li>
            <li>• Configure analytics tracking ID</li>
            <li>• Review and test all security policies</li>
            <li>• Perform load testing on critical endpoints</li>
            <li>• Set up monitoring and alerting</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
