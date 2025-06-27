// Re-export all services for easy importing
export { supabase } from './client';
export type { DocumentType, VerificationStatus, UserRole } from './client';

export { authService } from './auth';
export type { AuthUser } from './auth';

export { investmentService } from './investments';
export type {
    Investment,
    InvestmentApplication,
    InvestmentWithApplication
} from './investments';

export { crmService } from './crm-service';
export type {
    CRMContact,
    CRMActivity,
    Consultation
} from './crm-service';

export { notificationService } from './notifications';
export type { Notification } from './notifications';

export { documentService } from './documents';
export type { DocumentSignature } from './documents';

// Legacy re-exports for backward compatibility during migration
// TODO: Remove these once all components are updated to use the new services
export { createOrUpdateDocumentSignature } from './documents';

// Utility functions that should remain in the main supabase file
export { sanitizeFileName } from './utils';
