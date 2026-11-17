export type ModuleId =
  | 'overview'
  | 'finance'
  | 'business'
  | 'tasks'
  | 'places'
  | 'opportunities'
  | 'learning'
  | 'assistant'
  | 'account';

export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP';
export type ThemeMode = 'light' | 'dark';

export const LIMITS = {
  DISPLAY_NAME_MAX: 80,
  ROLE_TITLE_MAX: 80,
  EMAIL_MAX: 160,
  PHONE_MAX: 32,
  BUSINESS_NAME_MAX: 100,
  LOCATION_MAX: 100,
  TITLE_MAX: 120,
  TASK_TITLE_MAX: 140,
  CATEGORY_MAX: 50,
  NOTES_MAX: 300,
  ITEM_SUMMARY_MAX: 300,
  DOC_NUMBER_MAX: 32,
  CLIENT_NAME_MAX: 100,
  OPPORTUNITY_ID_MAX: 64,
  LEARNING_TITLE_MAX: 120,
  SKILL_AREA_MAX: 60,
  NEXT_TOPIC_MAX: 140,
  REMINDER_MAX: 60,
} as const;

export interface UserWorkspace {
  ownerId: string;
  displayName: string;
  roleTitle?: string;
  currency: CurrencyCode;
  theme: ThemeMode;
  aiContextEnabled: boolean;
  opportunityAlertsEnabled: boolean;
  billRemindersEnabled: boolean;
  popiaAccepted: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface UserPrivateProfile {
  ownerId: string;
  email: string;
  phone?: string;
  businessName?: string;
  location?: string;
  updatedAt: unknown;
}

export interface FinanceEntry {
  id: string;
  ownerId: string;
  scope: 'personal' | 'business';
  type: 'income' | 'expense';
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface BudgetGoal {
  id: string;
  ownerId: string;
  kind: 'savings' | 'budget' | 'bill';
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string;
  status: 'active' | 'paid' | 'completed';
  createdAt: unknown;
  updatedAt: unknown;
}

export interface BusinessClient {
  id: string;
  ownerId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface BusinessDocument {
  id: string;
  ownerId: string;
  docNumber: string;
  docType: 'quote' | 'invoice';
  clientName: string;
  clientEmail?: string;
  itemSummary: string;
  subtotal: number;
  includeVat: boolean;
  totalAmount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: unknown;
  updatedAt: unknown;
}

export interface LifeTask {
  id: string;
  ownerId: string;
  title: string;
  category: 'personal' | 'work' | 'finance' | 'learning' | 'health';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  timeSlot?: string;
  status: 'pending' | 'completed';
  createdAt: unknown;
  updatedAt: unknown;
}

export type OpportunityKind =
  | 'job'
  | 'scholarship'
  | 'grant'
  | 'internship'
  | 'business'
  | 'training';

export interface OpportunityCatalogItem {
  id: string;
  title: string;
  organization: string;
  kind: OpportunityKind;
  location: string;
  valueLabel: string;
  deadline: string;
  eligibility: string[];
  summary: string;
  sourceUrl: string;
}

export interface SavedOpportunity {
  id: string;
  ownerId: string;
  opportunityId: string;
  title: string;
  organization: string;
  kind: OpportunityKind;
  deadline: string;
  status: 'saved' | 'preparing' | 'applied';
  createdAt: unknown;
  updatedAt: unknown;
}

export interface LearningTrack {
  id: string;
  ownerId: string;
  title: string;
  skillArea: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  completedLessons: number;
  totalLessons: number;
  studyReminder?: string;
  nextTopic: string;
  status: 'active' | 'completed';
  createdAt: unknown;
  updatedAt: unknown;
}

export interface AiProposal {
  id: string;
  toolName:
    | 'propose_finance_entry'
    | 'propose_task'
    | 'propose_invoice'
    | 'propose_learning_plan';
  args: Record<string, unknown>;
  status: 'pending' | 'approved' | 'declined';
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  proposals?: AiProposal[];
  groundingSources?: GroundingSource[];
}

export interface LifeNotification {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'urgent';
  targetModule: ModuleId;
}
