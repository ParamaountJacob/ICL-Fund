# Inner Circle Lending Platform

A modern React/TypeScript application for investment management and lending operations, built with Supabase backend infrastructure.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inner-circle-lending
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard/       # Modular dashboard components
│   ├── UserProfileModal/# User profile management
│   └── ...
├── contexts/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Service layer & utilities
│   ├── auth.ts         # Authentication service
│   ├── investments.ts  # Investment management
│   ├── crm-service.ts  # CRM functionality
│   ├── notifications.ts# Notification system
│   └── index.ts        # Service exports
├── pages/              # Route components
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🏗️ Architecture

### Service Layer
The application uses a modular service architecture:

- **Authentication Service** (`lib/auth.ts`) - User authentication and management
- **Investment Service** (`lib/investments.ts`) - Investment lifecycle management with RPC fallbacks
- **CRM Service** (`lib/crm-service.ts`) - Contact and consultation management
- **Notification Service** (`lib/notifications.ts`) - Real-time notifications
- **Document Service** (`lib/documents.ts`) - Document signing workflows
- **Profile Service** (`lib/profile-service.ts`) - User profile management

### State Management
Global state is managed using Zustand stores:

- **Auth Store** (`stores/authStore.ts`) - Authentication state with persistence
- **Investment Store** (`stores/investmentStore.ts`) - Investment data management
- **Notification Store** (`stores/notificationStore.ts`) - Real-time notification state

### Database
Supabase PostgreSQL with:
- Row Level Security (RLS) policies
- Real-time subscriptions
- Edge functions for admin operations
- Emergency database function fallbacks

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
```

## 🧪 Testing

The project uses Vitest with React Testing Library:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test files are located in:
- `src/test/` - Test utilities and setup
- `src/stores/__tests__/` - Store tests
- `src/components/**/__tests__/` - Component tests

## 🔧 Configuration

### TypeScript
Strict TypeScript configuration with comprehensive type safety across all service modules.

### ESLint
Modern ESLint configuration with React-specific rules.

### Tailwind CSS
Utility-first CSS framework with custom design tokens for consistent styling.

### Vite
Fast build tool with:
- React Fast Refresh
- TypeScript support
- Optimized production builds

## 📊 Key Features

### Investment Management
- Multi-step onboarding workflow
- Document signing integration
- Investment tracking and reporting
- Admin approval workflows

### User Management
- Role-based access control (User, Sub-Admin, Admin)
- Profile management with verification system
- Real-time notifications
- CRM integration for lead management

### Admin Dashboard
- Comprehensive user management
- Investment application review
- Document approval workflows
- Real-time monitoring and analytics

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables (Production)
```env
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### Database Setup
1. Apply database migrations in order
2. Set up Row Level Security policies
3. Deploy edge functions for admin operations
4. Configure real-time subscriptions

## 🔐 Security

- Row Level Security (RLS) on all database tables
- JWT-based authentication via Supabase Auth
- Role-based access control
- Input validation on all forms
- Secure document handling

## 🎯 Performance

- React.memo for component optimization
- Code splitting with React.lazy()
- Zustand for efficient state management
- Performance monitoring hooks
- Bundle optimization with Vite

## 📚 API Documentation

### Service Layer
All business logic is encapsulated in service modules located in `src/lib/`:

```typescript
import { authService, investmentService, crmService } from './lib';

// Authentication
const user = await authService.getCurrentUser();
const result = await authService.signIn(email, password);

// Investments
const investments = await investmentService.getUserInvestments(userId);
const application = await investmentService.createApplication(data);

// CRM
const contacts = await crmService.getContacts();
const consultation = await crmService.createConsultation(data);
```

### Component Usage
Components follow compound component patterns for complex UI:

```typescript
import { InvestmentDetailsModal } from './components';

<InvestmentDetailsModal isOpen={isOpen} onClose={onClose}>
  <InvestmentSummary investment={investment} />
  <WorkflowProgress status={investment.status} />
  <ActionButtons onApprove={handleApprove} />
</InvestmentDetailsModal>
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Verify environment variables are set correctly
   - Check Supabase project status and RLS policies

2. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check TypeScript errors with `npm run type-check`

3. **Database Function Errors**
   - Emergency fix scripts available in project root
   - Service layer includes fallback mechanisms

### Database Emergency Tools
If database functions fail:
- `EMERGENCY_FUNCTION_FIX.md` - Emergency restoration guide
- `check_fix_functions.ps1/.sh` - Automated function checking
- Service layer fallbacks automatically handle failures

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use established patterns from service layer
3. Add tests for new functionality
4. Follow component composition patterns
5. Update this documentation for architectural changes

## 📄 License

[License information]

---

**Built with:** React 18 + TypeScript + Supabase + Tailwind CSS + Zustand

**Version:** 1.0.0
**Last Updated:** January 2025
