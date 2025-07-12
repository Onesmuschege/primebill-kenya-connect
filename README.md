
# PrimeBill Solutions - Internet Service Provider Management System

A comprehensive ISP management system built with React, TypeScript, Tailwind CSS, and Supabase. This application provides complete customer management, subscription handling, payment processing (M-Pesa integration), and administrative tools for internet service providers.

## 🚀 Features

### Customer Features

- **User Dashboard**: Comprehensive dashboard with subscription overview, usage statistics, and payment history
- **Plan Management**: View and upgrade internet plans with real-time pricing
- **Payment Integration**: Seamless M-Pesa payment processing with STK Push
- **Usage Tracking**: Detailed bandwidth usage statistics and reports
- **Profile Management**: Account settings and personal information management

### Admin Features

- **Client Management**: Advanced client search, filtering, and bulk operations
- **Subscription Management**: Full CRUD operations for customer subscriptions
- **Payment Processing**: Payment history, refunds, and transaction management
- **Router Management**: Network equipment monitoring and control
- **Analytics Dashboard**: Business metrics and performance indicators
- **Export Capabilities**: CSV/Excel export for reports and data analysis

### Technical Features

- **Real-time Updates**: Live data synchronization using Supabase realtime
- **Responsive Design**: Mobile-first design that works on all devices
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
- **Security**: Row-level security, input sanitization, and secure authentication
- **Performance**: Optimized with React Query for caching and background updates
- **Testing**: Comprehensive test suite with unit and integration tests

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn UI Components
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management**: TanStack Query (React Query)
- **Testing**: Vitest, React Testing Library
- **Payment**: M-Pesa Daraja API
- **Analytics**: Google Analytics 4 (configurable)
- **Deployment**: Vercel/Netlify ready

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- M-Pesa Daraja API credentials (for payment processing)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd primebill-solutions
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the SQL migrations in your Supabase dashboard:

```sql
-- See supabase/migrations/ folder for complete setup
-- Tables: users, plans, subscriptions, payments, routers, etc.
-- RLS policies and security functions included
```

### 4. Configure Supabase Edge Functions

Deploy the included edge functions:

- `mpesa-stk-push`: M-Pesa payment processing
- `mpesa-callback`: Payment confirmation handling
- `subscription-manager`: Automated subscription management
- `router-control`: Network equipment management

### 5. Start Development Server

```bash
npm run dev
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (Shadcn)
│   ├── forms/          # Form components with validation
│   ├── dashboard/      # Dashboard-specific components
│   ├── lazy/           # Lazy-loaded components
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── integrations/       # External service integrations
├── test/               # Test files and utilities
└── pages/              # Page components

supabase/
├── functions/          # Edge functions
├── migrations/         # SQL schema migrations
└── config.toml         # Supabase configuration
```

## 🔐 Authentication & Security

### User Roles

- **Admin**: Full system access and management
- **Subadmin**: Limited administrative access
- **Client**: Customer self-service portal

### Security Features

- Row-Level Security (RLS) policies
- Input sanitization and validation
- CSRF protection
- Secure session management
- API rate limiting
- Content Security Policy (CSP) headers

## 💳 Payment Integration

### M-Pesa Integration

- STK Push for seamless payments
- Automatic payment confirmation
- Payment history and receipts
- Refund processing
- Multiple currency support

### Configuration

Set up M-Pesa credentials in Supabase secrets:

```
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```

## 📊 Analytics & Monitoring

### Built-in Analytics

- User engagement tracking
- Business metrics dashboard
- Performance monitoring
- Error tracking integration ready

### Google Analytics 4

Configure tracking in the AnalyticsProvider:

```typescript
<AnalyticsProvider trackingId="GA_MEASUREMENT_ID">
  <App />
</AnalyticsProvider>
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and user workflow testing
- **E2E Tests**: Full application flow testing (setup required)

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

#### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Custom Server

```bash
npm run build
# Serve the dist/ folder with your preferred static server
```

### Environment Variables

Set these in your deployment environment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Analytics tracking IDs (optional)

## 📚 API Documentation

### Supabase Tables

- **users**: Customer and admin profiles
- **plans**: Internet service plans
- **subscriptions**: Customer subscriptions
- **payments**: Payment transactions
- **routers**: Network equipment
- **usage_statistics**: Bandwidth usage data

### Edge Functions

- **POST /functions/v1/mpesa-stk-push**: Process M-Pesa payments
- **POST /functions/v1/mpesa-callback**: Handle payment confirmations
- **POST /functions/v1/subscription-manager**: Manage subscription lifecycle
- **POST /functions/v1/router-control**: Control network equipment

## 🛠️ Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier configured
- Consistent component structure
- Comprehensive error handling

### Component Guidelines

- Keep components under 250 lines
- Use custom hooks for business logic
- Implement proper accessibility attributes
- Include loading and error states

### Performance Optimization

- Lazy loading for non-critical components
- React Query for efficient data fetching
- Image optimization and compression
- Bundle size monitoring

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Review Checklist

- [ ] Tests pass and coverage is maintained
- [ ] Accessibility requirements met
- [ ] Security best practices followed
- [ ] Performance impact considered
- [ ] Documentation updated

## 📋 Production Checklist

### Before Going Live

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Error monitoring configured
- [ ] Analytics tracking setup
- [ ] Backup procedures in place
- [ ] SSL certificates configured
- [ ] DNS configuration verified

### Launch Day

- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Verify user registration flow
- [ ] Test admin functionalities
- [ ] Monitor performance metrics

## 🐛 Troubleshooting

### Common Issues

#### Authentication Problems

- Check Supabase URL configuration
- Verify RLS policies are correct
- Ensure user roles are properly set

#### Payment Issues

- Validate M-Pesa credentials
- Check network connectivity
- Review callback URL configuration

#### Performance Issues

- Enable React Query dev tools
- Check database query performance
- Review component re-render patterns

### Getting Help

- Check the [troubleshooting documentation](https://docs.lovable.dev/tips-tricks/troubleshooting)
- Review Supabase logs and error messages
- Examine browser console for client-side errors

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Shadcn UI](https://ui.shadcn.com) for the component library
- [Tailwind CSS](https://tailwindcss.com) for the styling system
- [React Query](https://tanstack.com/query) for state management
- [Safaricom Daraja API](https://developer.safaricom.co.ke) for M-Pesa integration

---

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

**Built with ❤️ for Internet Service Providers**
