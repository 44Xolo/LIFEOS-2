import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { ConfirmationResult, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  appleProvider,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';
import { addDaysIsoDate, clampStr, generateDocId, todayIsoDate } from '../lib/formatters';
import type {
  AiProposal,
  BudgetGoal,
  BusinessClient,
  BusinessDocument,
  ChatMessage,
  CurrencyCode,
  FinanceEntry,
  LearningTrack,
  LifeNotification,
  LifeTask,
  ModuleId,
  OpportunityKind,
  SavedOpportunity,
  ThemeMode,
  UserPrivateProfile,
  UserWorkspace,
} from '../types/lifeos';
import { LIMITS } from '../types/lifeos';

interface LifeOSContextValue {
  user: User | null;
  authReady: boolean;
  workspaceLoading: boolean;
  workspace: UserWorkspace | null;
  privateProfile: UserPrivateProfile | null;
  transactions: FinanceEntry[];
  goals: BudgetGoal[];
  clients: BusinessClient[];
  documents: BusinessDocument[];
  tasks: LifeTask[];
  savedOpportunities: SavedOpportunity[];
  learningTracks: LearningTrack[];
  notifications: LifeNotification[];
  theme: ThemeMode;
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  aiDrawerOpen: boolean;
  setAiDrawerOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  aiMessages: ChatMessage[];
  aiBusy: boolean;
  aiError: string | null;
  sendAiMessage: (text: string, options?: { useSearch?: boolean }) => Promise<void>;
  askAiWithPrompt: (prompt: string, openFullView?: boolean) => void;
  resolveAiProposal: (messageId: string, proposalId: string, decision: 'approved' | 'declined') => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendPhoneOtp: (phoneE164: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmation: ConfirmationResult, code: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  needsEmailVerification: boolean;
  signOutUser: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  updateWorkspaceSettings: (patch: {
    displayName?: string;
    roleTitle?: string;
    currency?: CurrencyCode;
    theme?: ThemeMode;
  }) => Promise<void>;
  updatePopiaConsent: (patch: {
    aiContextEnabled?: boolean;
    opportunityAlertsEnabled?: boolean;
    billRemindersEnabled?: boolean;
    popiaAccepted?: boolean;
  }) => Promise<void>;
  updatePrivateProfile: (patch: {
    phone?: string;
    businessName?: string;
    location?: string;
  }) => Promise<void>;
  addTransaction: (input: {
    scope: 'personal' | 'business';
    type: 'income' | 'expense';
    title: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (input: {
    kind: 'savings' | 'budget' | 'bill';
    title: string;
    category: string;
    targetAmount: number;
    currentAmount?: number;
    dueDate?: string;
  }) => Promise<void>;
  contributeGoal: (goal: BudgetGoal, addedAmount: number) => Promise<void>;
  markBillPaid: (bill: BudgetGoal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addClient: (input: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addBusinessDocument: (input: {
    docType: 'quote' | 'invoice';
    clientName: string;
    clientEmail?: string;
    itemSummary: string;
    subtotal: number;
    includeVat: boolean;
    dueDate: string;
  }) => Promise<void>;
  convertQuoteToInvoice: (docItem: BusinessDocument) => Promise<void>;
  markDocumentPaid: (docItem: BusinessDocument) => Promise<void>;
  deleteBusinessDocument: (id: string) => Promise<void>;
  addTask: (input: {
    title: string;
    category: 'personal' | 'work' | 'finance' | 'learning' | 'health';
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    timeSlot?: string;
  }) => Promise<void>;
  toggleTaskStatus: (task: LifeTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveOpportunity: (input: {
    opportunityId: string;
    title: string;
    organization: string;
    kind: OpportunityKind;
    deadline: string;
  }) => Promise<void>;
  updateOpportunityStatus: (id: string, status: 'saved' | 'preparing' | 'applied') => Promise<void>;
  removeSavedOpportunity: (id: string) => Promise<void>;
  addLearningTrack: (input: {
    title: string;
    skillArea: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    totalLessons: number;
    nextTopic: string;
    studyReminder?: string;
  }) => Promise<void>;
  advanceLearningTrack: (track: LearningTrack) => Promise<void>;
  updateLearningReminder: (id: string, studyReminder: string) => Promise<void>;
  deleteLearningTrack: (id: string) => Promise<void>;
  exportAllUserData: () => void;
  clearWorkspaceData: () => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const LifeOSContext = createContext<LifeOSContextValue | null>(null);

export function useLifeOS(): LifeOSContextValue {
  const ctx = useContext(LifeOSContext);
  if (!ctx) {
    throw new Error('useLifeOS must be used within LifeOSProvider');
  }
  return ctx;
}

const INITIAL_ASSISTANT_GREETING: ChatMessage = {
  id: 'welcome_msg',
  role: 'assistant',
  content:
    'Welcome to LIFEOS Intelligence. I can analyze your finances, draft client quotations or emails, plan your daily schedule, explain learning topics, or prepare transactions for your approval. How can I help today?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

function isAuthUserVerified(u: User | null): boolean {
  if (!u) return false;
  if (u.emailVerified) return true;
  if (u.phoneNumber) return true;
  return u.providerData.some(
    (p) => p.providerId === 'phone' || p.providerId === 'apple.com' || p.providerId === 'google.com'
  );
}

export const LifeOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  const [workspace, setWorkspace] = useState<UserWorkspace | null>(null);
  const [privateProfile, setPrivateProfile] = useState<UserPrivateProfile | null>(null);
  const [transactions, setTransactions] = useState<FinanceEntry[]>([]);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [clients, setClients] = useState<BusinessClient[]>([]);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [learningTracks, setLearningTracks] = useState<LearningTrack[]>([]);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('lifeos_theme') : null;
    return stored === 'light' ? 'light' : 'dark';
  });

  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_GREETING]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('lifeos_theme', theme);
  }, [theme]);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function ensureUserProvisioned(firebaseUser: User) {
    const uid = firebaseUser.uid;
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const displayName = clampStr(
        firebaseUser.displayName ||
          firebaseUser.phoneNumber ||
          firebaseUser.email?.split('@')[0] ||
          'LIFEOS Member',
        LIMITS.DISPLAY_NAME_MAX
      );
      try {
        await setDoc(userRef, {
          ownerId: uid,
          displayName,
          roleTitle: 'Founder & Builder',
          currency: 'ZAR',
          theme,
          aiContextEnabled: true,
          opportunityAlertsEnabled: true,
          billRemindersEnabled: true,
          popiaAccepted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
      }

      const profileRef = doc(db, 'users', uid, 'private', 'profile');
      const profilePayload: Record<string, unknown> = {
        ownerId: uid,
        email: clampStr(firebaseUser.email || 'phone-member@lifeos.app', LIMITS.EMAIL_MAX),
        businessName: 'Studio Ventures',
        location: 'Johannesburg, South Africa',
        updatedAt: serverTimestamp(),
      };
      if (firebaseUser.phoneNumber) {
        profilePayload.phone = clampStr(firebaseUser.phoneNumber, LIMITS.PHONE_MAX);
      }
      try {
        await setDoc(profileRef, profilePayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/private/profile`);
      }

      await seedStarterWorkspace(uid);
    }
  }

  async function seedStarterWorkspace(uid: string) {
    const today = todayIsoDate();
    const yesterday = addDaysIsoDate(-2);
    const lastWeek = addDaysIsoDate(-9);
    const nextWeek = addDaysIsoDate(5);
    const nextTwoWeeks = addDaysIsoDate(12);

    const batch = writeBatch(db);

    const sampleTx: Array<Omit<FinanceEntry, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        ownerId: uid,
        scope: 'personal',
        type: 'income',
        title: 'Monthly Salary Draw',
        category: 'Salary',
        amount: 24500,
        date: lastWeek,
        notes: 'Primary monthly personal allocation',
      },
      {
        ownerId: uid,
        scope: 'personal',
        type: 'expense',
        title: 'Apartment Lease & Levy',
        category: 'Housing',
        amount: 8900,
        date: yesterday,
        notes: 'Monthly residence payment',
      },
      {
        ownerId: uid,
        scope: 'personal',
        type: 'expense',
        title: 'Weekly Fresh Groceries',
        category: 'Groceries',
        amount: 1450,
        date: today,
      },
      {
        ownerId: uid,
        scope: 'business',
        type: 'income',
        title: 'UI System Consulting Retainer',
        category: 'Client Retainer',
        amount: 14200,
        date: yesterday,
        notes: 'Paid invoice INV-1041',
      },
      {
        ownerId: uid,
        scope: 'business',
        type: 'expense',
        title: 'Cloud Hosting & Workspace Tools',
        category: 'Software',
        amount: 1280,
        date: lastWeek,
      },
    ];

    for (const tx of sampleTx) {
      const id = generateDocId('tx');
      batch.set(doc(db, 'users', uid, 'transactions', id), {
        ...tx,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const sampleGoals: Array<Omit<BudgetGoal, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        ownerId: uid,
        kind: 'savings',
        title: 'Emergency Reserve Fund',
        category: 'Reserve',
        targetAmount: 30000,
        currentAmount: 18500,
        dueDate: addDaysIsoDate(120),
        status: 'active',
      },
      {
        ownerId: uid,
        kind: 'budget',
        title: 'Groceries & Dining Budget',
        category: 'Groceries',
        targetAmount: 4500,
        currentAmount: 1450,
        status: 'active',
      },
      {
        ownerId: uid,
        kind: 'bill',
        title: 'Fibre Internet & Cloud Plan',
        category: 'Utilities',
        targetAmount: 995,
        currentAmount: 0,
        dueDate: nextWeek,
        status: 'active',
      },
    ];

    for (const g of sampleGoals) {
      const id = generateDocId('goal');
      batch.set(doc(db, 'users', uid, 'goals', id), {
        ...g,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const clientId = generateDocId('client');
    batch.set(doc(db, 'users', uid, 'clients', clientId), {
      ownerId: uid,
      name: 'Thabo Mokoena',
      company: 'Kalahari Digital Studio',
      email: 'thabo@kalaharidigital.co.za',
      phone: '+27 82 555 0148',
      notes: 'Web and mobile product design partner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const inv1 = generateDocId('doc');
    batch.set(doc(db, 'users', uid, 'documents', inv1), {
      ownerId: uid,
      docNumber: 'INV-1042',
      docType: 'invoice',
      clientName: 'Kalahari Digital Studio',
      clientEmail: 'thabo@kalaharidigital.co.za',
      itemSummary: 'Mobile App Prototype & API Architecture Sprint',
      subtotal: 12000,
      includeVat: true,
      totalAmount: 13800,
      dueDate: nextTwoWeeks,
      status: 'sent',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const quote1 = generateDocId('doc');
    batch.set(doc(db, 'users', uid, 'documents', quote1), {
      ownerId: uid,
      docNumber: 'QUO-2019',
      docType: 'quote',
      clientName: 'Ubuntu Logistics Group',
      itemSummary: 'Fleet Tracking Dashboard Redesign',
      subtotal: 18500,
      includeVat: true,
      totalAmount: 21275,
      dueDate: addDaysIsoDate(21),
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const sampleTasks: Array<Omit<LifeTask, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        ownerId: uid,
        title: 'Review monthly cashflow & budget targets',
        category: 'finance',
        priority: 'high',
        dueDate: today,
        timeSlot: '09:30',
        status: 'pending',
      },
      {
        ownerId: uid,
        title: 'Send Sprint 2 update to Kalahari Digital',
        category: 'work',
        priority: 'medium',
        dueDate: today,
        timeSlot: '14:00',
        status: 'pending',
      },
      {
        ownerId: uid,
        title: 'Complete TypeScript state architecture lesson',
        category: 'learning',
        priority: 'medium',
        dueDate: addDaysIsoDate(1),
        timeSlot: '18:30',
        status: 'pending',
      },
    ];

    for (const t of sampleTasks) {
      const id = generateDocId('task');
      batch.set(doc(db, 'users', uid, 'tasks', id), {
        ...t,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const learningData: Array<Omit<LearningTrack, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        ownerId: uid,
        title: 'Modern Full-Stack Web & Mobile Systems',
        skillArea: 'Software Engineering',
        level: 'intermediate',
        completedLessons: 5,
        totalLessons: 12,
        studyReminder: 'Tue & Thu · 18:30',
        nextTopic: 'Firestore Security Rules & Real-Time Listeners',
        status: 'active',
      },
      {
        ownerId: uid,
        title: 'Small Business Cashflow & SARS Readiness',
        skillArea: 'Business Finance',
        level: 'beginner',
        completedLessons: 2,
        totalLessons: 8,
        studyReminder: 'Saturday · 10:00',
        nextTopic: 'Separating Personal Drawings from Business Profit',
        status: 'active',
      },
    ];

    for (const l of learningData) {
      const id = generateDocId('learn');
      batch.set(doc(db, 'users', uid, 'learning', id), {
        ...l,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/starter_seed`);
    }
  }

  useEffect(() => {
    let unsubs: Array<() => void> = [];

    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      unsubs.forEach((u) => u());
      unsubs = [];

      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setNeedsEmailVerification(false);
        setWorkspace(null);
        setPrivateProfile(null);
        setTransactions([]);
        setGoals([]);
        setClients([]);
        setDocuments([]);
        setTasks([]);
        setSavedOpportunities([]);
        setLearningTracks([]);
        return;
      }

      if (!isAuthUserVerified(nextUser)) {
        setNeedsEmailVerification(true);
        setWorkspaceLoading(false);
        return;
      }

      setNeedsEmailVerification(false);
      setWorkspaceLoading(true);
      try {
        await ensureUserProvisioned(nextUser);
      } catch (err) {
        setWorkspaceLoading(false);
        throw err;
      }

      const uid = nextUser.uid;

      const uWorkspace = onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserWorkspace;
            setWorkspace(data);
            if (data.theme === 'dark' || data.theme === 'light') {
              setTheme(data.theme);
            }
          }
          setWorkspaceLoading(false);
        },
        (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
      );

      const uProfile = onSnapshot(
        doc(db, 'users', uid, 'private', 'profile'),
        (snap) => {
          if (snap.exists()) {
            setPrivateProfile(snap.data() as UserPrivateProfile);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}/private/profile`)
      );

      const uTx = onSnapshot(
        query(collection(db, 'users', uid, 'transactions'), where('ownerId', '==', uid)),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FinanceEntry, 'id'>) }));
          list.sort((a, b) => b.date.localeCompare(a.date));
          setTransactions(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/transactions`)
      );

      const uGoals = onSnapshot(
        query(collection(db, 'users', uid, 'goals'), where('ownerId', '==', uid)),
        (snap) => {
          setGoals(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BudgetGoal, 'id'>) })));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/goals`)
      );

      const uClients = onSnapshot(
        query(collection(db, 'users', uid, 'clients'), where('ownerId', '==', uid)),
        (snap) => {
          setClients(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BusinessClient, 'id'>) })));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/clients`)
      );

      const uDocs = onSnapshot(
        query(collection(db, 'users', uid, 'documents'), where('ownerId', '==', uid)),
        (snap) => {
          setDocuments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BusinessDocument, 'id'>) })));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/documents`)
      );

      const uTasks = onSnapshot(
        query(collection(db, 'users', uid, 'tasks'), where('ownerId', '==', uid)),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LifeTask, 'id'>) }));
          list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          setTasks(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/tasks`)
      );

      const uOpps = onSnapshot(
        query(collection(db, 'users', uid, 'opportunities'), where('ownerId', '==', uid)),
        (snap) => {
          setSavedOpportunities(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedOpportunity, 'id'>) }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/opportunities`)
      );

      const uLearn = onSnapshot(
        query(collection(db, 'users', uid, 'learning'), where('ownerId', '==', uid)),
        (snap) => {
          setLearningTracks(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LearningTrack, 'id'>) }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/learning`)
      );

      unsubs = [uWorkspace, uProfile, uTx, uGoals, uClients, uDocs, uTasks, uOpps, uLearn];
    });

    return () => {
      unsubAuth();
      unsubs.forEach((u) => u());
    };
  }, []);

  const notifications = useMemo<LifeNotification[]>(() => {
    const items: LifeNotification[] = [];
    const today = todayIsoDate();

    const activeBills = goals.filter((g) => g.kind === 'bill' && g.status === 'active');
    for (const bill of activeBills) {
      items.push({
        id: `notif_bill_${bill.id}`,
        title: `Upcoming Bill: ${bill.title}`,
        detail: bill.dueDate ? `Due ${bill.dueDate}` : 'Action required',
        severity: bill.dueDate && bill.dueDate <= addDaysIsoDate(3) ? 'urgent' : 'warning',
        targetModule: 'finance',
      });
    }

    const pendingToday = tasks.filter((t) => t.status === 'pending' && t.dueDate <= today);
    if (pendingToday.length > 0) {
      items.push({
        id: 'notif_tasks_due',
        title: `${pendingToday.length} task${pendingToday.length > 1 ? 's' : ''} due today`,
        detail: pendingToday[0].title,
        severity: pendingToday.some((t) => t.priority === 'high') ? 'urgent' : 'info',
        targetModule: 'tasks',
      });
    }

    const unpaidInvoices = documents.filter((d) => d.docType === 'invoice' && d.status !== 'paid');
    if (unpaidInvoices.length > 0) {
      items.push({
        id: 'notif_invoices_open',
        title: `${unpaidInvoices.length} open client invoice${unpaidInvoices.length > 1 ? 's' : ''}`,
        detail: `${unpaidInvoices[0].docNumber} · ${unpaidInvoices[0].clientName}`,
        severity: 'info',
        targetModule: 'business',
      });
    }

    return items;
  }, [goals, tasks, documents]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithApple = async () => {
    await signInWithPopup(auth, appleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, {
        displayName: clampStr(displayName.trim(), LIMITS.DISPLAY_NAME_MAX),
      });
    }
    await sendEmailVerification(cred.user);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const sendPhoneOtp = async (
    phoneE164: string,
    recaptchaContainerId: string
  ): Promise<ConfirmationResult> => {
    const win = window as unknown as { __lifeosRecaptcha?: RecaptchaVerifier };
    if (win.__lifeosRecaptcha) {
      try {
        win.__lifeosRecaptcha.clear();
      } catch {
        // Ignore stale verifier cleanup errors
      }
      win.__lifeosRecaptcha = undefined;
    }
    const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });
    win.__lifeosRecaptcha = verifier;
    try {
      return await signInWithPhoneNumber(auth, phoneE164, verifier);
    } catch (err) {
      try {
        verifier.clear();
      } catch {
        // Ignore cleanup failure
      }
      win.__lifeosRecaptcha = undefined;
      throw err;
    }
  };

  const verifyPhoneOtp = async (confirmation: ConfirmationResult, code: string) => {
    await confirmation.confirm(code.trim());
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    showToast('Verification link sent to your email');
  };

  const refreshAuthUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    if (refreshed && isAuthUserVerified(refreshed)) {
      setUser({ ...refreshed } as User);
      setNeedsEmailVerification(false);
      setWorkspaceLoading(true);
      await ensureUserProvisioned(refreshed);
      window.location.reload();
    } else {
      showToast('Email is not verified yet — please check your inbox');
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setActiveModule('overview');
  };

  const toggleTheme = async () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          theme: next,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const updateWorkspaceSettings = async (patch: {
    displayName?: string;
    roleTitle?: string;
    currency?: CurrencyCode;
    theme?: ThemeMode;
  }) => {
    if (!user || !workspace) return;
    const payload: Record<string, unknown> = {
      displayName: clampStr(patch.displayName ?? workspace.displayName, LIMITS.DISPLAY_NAME_MAX) || 'LIFEOS Member',
      roleTitle: clampStr(patch.roleTitle ?? workspace.roleTitle ?? '', LIMITS.ROLE_TITLE_MAX),
      currency: patch.currency ?? workspace.currency,
      theme: patch.theme ?? workspace.theme,
      updatedAt: serverTimestamp(),
    };
    if (patch.theme) setTheme(patch.theme);
    try {
      await updateDoc(doc(db, 'users', user.uid), payload);
      showToast('Workspace preferences saved');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updatePopiaConsent = async (patch: {
    aiContextEnabled?: boolean;
    opportunityAlertsEnabled?: boolean;
    billRemindersEnabled?: boolean;
    popiaAccepted?: boolean;
  }) => {
    if (!user || !workspace) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        aiContextEnabled: patch.aiContextEnabled ?? workspace.aiContextEnabled,
        opportunityAlertsEnabled: patch.opportunityAlertsEnabled ?? workspace.opportunityAlertsEnabled,
        billRemindersEnabled: patch.billRemindersEnabled ?? workspace.billRemindersEnabled,
        popiaAccepted: patch.popiaAccepted ?? workspace.popiaAccepted,
        updatedAt: serverTimestamp(),
      });
      showToast('POPIA privacy preferences updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updatePrivateProfile = async (patch: {
    phone?: string;
    businessName?: string;
    location?: string;
  }) => {
    if (!user) return;
    const email = clampStr(user.email || privateProfile?.email || 'user@example.com', LIMITS.EMAIL_MAX);
    try {
      await updateDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
        email,
        phone: clampStr(patch.phone ?? privateProfile?.phone ?? '', LIMITS.PHONE_MAX),
        businessName: clampStr(patch.businessName ?? privateProfile?.businessName ?? '', LIMITS.BUSINESS_NAME_MAX),
        location: clampStr(patch.location ?? privateProfile?.location ?? '', LIMITS.LOCATION_MAX),
        updatedAt: serverTimestamp(),
      });
      showToast('Profile details saved');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/private/profile`);
    }
  };

  const addTransaction = async (input: {
    scope: 'personal' | 'business';
    type: 'income' | 'expense';
    title: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
  }) => {
    if (!user) return;
    const id = generateDocId('tx');
    const cleanAmount = Math.max(0.01, Math.min(100000000, Number(input.amount) || 0));
    const docData: Record<string, unknown> = {
      ownerId: user.uid,
      scope: input.scope,
      type: input.type,
      title: clampStr(input.title, LIMITS.TITLE_MAX) || 'Untitled Entry',
      category: clampStr(input.category, LIMITS.CATEGORY_MAX) || 'General',
      amount: Number(cleanAmount.toFixed(2)),
      date: /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : todayIsoDate(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.notes && input.notes.trim()) {
      docData.notes = clampStr(input.notes, LIMITS.NOTES_MAX);
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'transactions', id), docData);
      showToast(`${input.type === 'income' ? 'Income' : 'Expense'} recorded`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/transactions/${id}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      showToast('Transaction removed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/transactions/${id}`);
    }
  };

  const addGoal = async (input: {
    kind: 'savings' | 'budget' | 'bill';
    title: string;
    category: string;
    targetAmount: number;
    currentAmount?: number;
    dueDate?: string;
  }) => {
    if (!user) return;
    const id = generateDocId('goal');
    const target = Math.max(1, Math.min(100000000, Number(input.targetAmount) || 0));
    const current = Math.max(0, Math.min(100000000, Number(input.currentAmount || 0)));
    const payload: Record<string, unknown> = {
      ownerId: user.uid,
      kind: input.kind,
      title: clampStr(input.title, 100) || 'Financial Goal',
      category: clampStr(input.category, LIMITS.CATEGORY_MAX) || 'General',
      targetAmount: Number(target.toFixed(2)),
      currentAmount: Number(current.toFixed(2)),
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.dueDate && input.dueDate.trim()) {
      payload.dueDate = clampStr(input.dueDate, 10);
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'goals', id), payload);
      showToast('Saved to Finance');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/goals/${id}`);
    }
  };

  const contributeGoal = async (goal: BudgetGoal, addedAmount: number) => {
    if (!user || goal.status !== 'active') return;
    const nextAmount = Math.min(100000000, Number((goal.currentAmount + Math.max(0, addedAmount)).toFixed(2)));
    const nextStatus = goal.kind === 'savings' && nextAmount >= goal.targetAmount ? 'completed' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id), {
        currentAmount: nextAmount,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      showToast('Savings contribution recorded');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/goals/${goal.id}`);
    }
  };

  const markBillPaid = async (bill: BudgetGoal) => {
    if (!user || bill.status !== 'active') return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'goals', bill.id), {
        currentAmount: bill.targetAmount,
        status: 'paid',
        updatedAt: serverTimestamp(),
      });
      await addTransaction({
        scope: 'personal',
        type: 'expense',
        title: `Bill Paid: ${bill.title}`,
        category: bill.category,
        amount: bill.targetAmount,
        date: todayIsoDate(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/goals/${bill.id}`);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
      showToast('Entry removed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/goals/${id}`);
    }
  };

  const addClient = async (input: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => {
    if (!user) return;
    const id = generateDocId('client');
    const payload: Record<string, unknown> = {
      ownerId: user.uid,
      name: clampStr(input.name, LIMITS.CLIENT_NAME_MAX) || 'New Client',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.company?.trim()) payload.company = clampStr(input.company, 100);
    if (input.email?.trim()) payload.email = clampStr(input.email, LIMITS.EMAIL_MAX);
    if (input.phone?.trim()) payload.phone = clampStr(input.phone, LIMITS.PHONE_MAX);
    if (input.notes?.trim()) payload.notes = clampStr(input.notes, LIMITS.NOTES_MAX);
    try {
      await setDoc(doc(db, 'users', user.uid, 'clients', id), payload);
      showToast('Client added');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/clients/${id}`);
    }
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'clients', id));
      showToast('Client deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/clients/${id}`);
    }
  };

  const addBusinessDocument = async (input: {
    docType: 'quote' | 'invoice';
    clientName: string;
    clientEmail?: string;
    itemSummary: string;
    subtotal: number;
    includeVat: boolean;
    dueDate: string;
  }) => {
    if (!user) return;
    const id = generateDocId('doc');
    const prefix = input.docType === 'invoice' ? 'INV' : 'QUO';
    const docNumber = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanSubtotal = Math.max(1, Math.min(100000000, Number(input.subtotal) || 0));
    const totalAmount = input.includeVat ? Number((cleanSubtotal * 1.15).toFixed(2)) : Number(cleanSubtotal.toFixed(2));

    const payload: Record<string, unknown> = {
      ownerId: user.uid,
      docNumber,
      docType: input.docType,
      clientName: clampStr(input.clientName, LIMITS.CLIENT_NAME_MAX) || 'Client',
      itemSummary: clampStr(input.itemSummary, LIMITS.ITEM_SUMMARY_MAX) || 'Professional Services',
      subtotal: Number(cleanSubtotal.toFixed(2)),
      includeVat: Boolean(input.includeVat),
      totalAmount,
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ? input.dueDate : addDaysIsoDate(14),
      status: input.docType === 'invoice' ? 'sent' : 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.clientEmail?.trim()) {
      payload.clientEmail = clampStr(input.clientEmail, LIMITS.EMAIL_MAX);
    }

    try {
      await setDoc(doc(db, 'users', user.uid, 'documents', id), payload);
      showToast(`${input.docType === 'invoice' ? 'Invoice' : 'Quotation'} ${docNumber} created`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/documents/${id}`);
    }
  };

  const convertQuoteToInvoice = async (docItem: BusinessDocument) => {
    if (!user || docItem.status === 'paid') return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'documents', docItem.id), {
        docType: 'invoice',
        status: 'sent',
        updatedAt: serverTimestamp(),
      });
      showToast(`${docItem.docNumber} converted to Invoice`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/documents/${docItem.id}`);
    }
  };

  const markDocumentPaid = async (docItem: BusinessDocument) => {
    if (!user || docItem.status === 'paid') return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'documents', docItem.id), {
        docType: 'invoice',
        status: 'paid',
        updatedAt: serverTimestamp(),
      });
      await addTransaction({
        scope: 'business',
        type: 'income',
        title: `Paid ${docItem.docNumber}: ${docItem.clientName}`,
        category: 'Client Invoice',
        amount: docItem.totalAmount,
        date: todayIsoDate(),
        notes: docItem.itemSummary,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/documents/${docItem.id}`);
    }
  };

  const deleteBusinessDocument = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'documents', id));
      showToast('Document deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/documents/${id}`);
    }
  };

  const addTask = async (input: {
    title: string;
    category: 'personal' | 'work' | 'finance' | 'learning' | 'health';
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    timeSlot?: string;
  }) => {
    if (!user) return;
    const id = generateDocId('task');
    const payload: Record<string, unknown> = {
      ownerId: user.uid,
      title: clampStr(input.title, LIMITS.TASK_TITLE_MAX) || 'Untitled Task',
      category: input.category,
      priority: input.priority,
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ? input.dueDate : todayIsoDate(),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.timeSlot?.trim()) {
      payload.timeSlot = clampStr(input.timeSlot, 20);
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'tasks', id), payload);
      showToast('Task scheduled');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/tasks/${id}`);
    }
  };

  const toggleTaskStatus = async (task: LifeTask) => {
    if (!user) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${task.id}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
      showToast('Task deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
    }
  };

  const saveOpportunity = async (input: {
    opportunityId: string;
    title: string;
    organization: string;
    kind: OpportunityKind;
    deadline: string;
  }) => {
    if (!user) return;
    const cleanOppId = input.opportunityId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, LIMITS.OPPORTUNITY_ID_MAX);
    const id = cleanOppId;
    try {
      await setDoc(doc(db, 'users', user.uid, 'opportunities', id), {
        ownerId: user.uid,
        opportunityId: cleanOppId,
        title: clampStr(input.title, 140),
        organization: clampStr(input.organization, 100),
        kind: input.kind,
        deadline: clampStr(input.deadline, 32),
        status: 'saved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Opportunity saved to tracker');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/opportunities/${id}`);
    }
  };

  const updateOpportunityStatus = async (id: string, status: 'saved' | 'preparing' | 'applied') => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'opportunities', id), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(`Marked as ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/opportunities/${id}`);
    }
  };

  const removeSavedOpportunity = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'opportunities', id));
      showToast('Removed from tracker');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/opportunities/${id}`);
    }
  };

  const addLearningTrack = async (input: {
    title: string;
    skillArea: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    totalLessons: number;
    nextTopic: string;
    studyReminder?: string;
  }) => {
    if (!user) return;
    const id = generateDocId('learn');
    const total = Math.max(1, Math.min(200, Math.round(input.totalLessons || 8)));
    const payload: Record<string, unknown> = {
      ownerId: user.uid,
      title: clampStr(input.title, LIMITS.LEARNING_TITLE_MAX) || 'Skill Track',
      skillArea: clampStr(input.skillArea, LIMITS.SKILL_AREA_MAX) || 'General',
      level: input.level,
      completedLessons: 0,
      totalLessons: total,
      nextTopic: clampStr(input.nextTopic, LIMITS.NEXT_TOPIC_MAX) || 'Module 1 Foundations',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.studyReminder?.trim()) {
      payload.studyReminder = clampStr(input.studyReminder, LIMITS.REMINDER_MAX);
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'learning', id), payload);
      showToast('Learning track added');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/learning/${id}`);
    }
  };

  const advanceLearningTrack = async (track: LearningTrack) => {
    if (!user) return;
    const nextCompleted = Math.min(track.totalLessons, track.completedLessons + 1);
    const nextStatus = nextCompleted >= track.totalLessons ? 'completed' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid, 'learning', track.id), {
        completedLessons: nextCompleted,
        nextTopic:
          nextStatus === 'completed'
            ? 'Track Completed — Review Capstone'
            : `Lesson ${nextCompleted + 1} of ${track.totalLessons}`,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(nextStatus === 'completed' ? 'Learning track completed!' : 'Lesson progress saved');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/learning/${track.id}`);
    }
  };

  const updateLearningReminder = async (id: string, studyReminder: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'learning', id), {
        studyReminder: clampStr(studyReminder, LIMITS.REMINDER_MAX),
        updatedAt: serverTimestamp(),
      });
      showToast('Study reminder updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/learning/${id}`);
    }
  };

  const deleteLearningTrack = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'learning', id));
      showToast('Learning track removed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/learning/${id}`);
    }
  };

  const sendAiMessage = async (text: string, options?: { useSearch?: boolean }) => {
    const trimmed = text.trim();
    if (!trimmed || aiBusy) return;

    const userMsg: ChatMessage = {
      id: generateDocId('msg'),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...aiMessages, userMsg];
    setAiMessages(nextHistory);
    setAiBusy(true);
    setAiError(null);

    const personalIncome = transactions
      .filter((t) => t.scope === 'personal' && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const personalExpense = transactions
      .filter((t) => t.scope === 'personal' && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const bizIncome = transactions
      .filter((t) => t.scope === 'business' && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const bizExpense = transactions
      .filter((t) => t.scope === 'business' && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const contextSnapshot = {
      userName: workspace?.displayName || 'Member',
      personalSummary: {
        income: personalIncome,
        expenses: personalExpense,
        netBalance: personalIncome - personalExpense,
      },
      businessSummary: {
        revenue: bizIncome,
        expenses: bizExpense,
        profit: bizIncome - bizExpense,
        openInvoices: documents
          .filter((d) => d.status !== 'paid')
          .map((d) => ({ docNumber: d.docNumber, clientName: d.clientName, totalAmount: d.totalAmount, status: d.status })),
      },
      pendingTasks: tasks
        .filter((t) => t.status === 'pending')
        .slice(0, 6)
        .map((t) => ({ title: t.title, dueDate: t.dueDate, priority: t.priority })),
      activeGoals: goals
        .filter((g) => g.status === 'active')
        .map((g) => ({ kind: g.kind, title: g.title, current: g.currentAmount, target: g.targetAmount })),
      learningTracks: learningTracks.map((l) => ({
        title: l.title,
        progress: `${l.completedLessons}/${l.totalLessons}`,
        nextTopic: l.nextTopic,
      })),
    };

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          contextSnapshot,
          activeModule,
          aiContextEnabled: workspace?.aiContextEnabled ?? true,
          currency: workspace?.currency ?? 'ZAR',
          useSearch: Boolean(options?.useSearch),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `AI request failed (${response.status})`);
      }

      const proposals: AiProposal[] = [];
      const calls: Array<{ id: string; name: string; args: Record<string, unknown> }> = data.functionCalls || [];

      for (const call of calls) {
        if (call.name === 'navigate_module') {
          const mod = String(call.args?.module || '') as ModuleId;
          const validModules: ModuleId[] = [
            'overview',
            'finance',
            'business',
            'tasks',
            'places',
            'opportunities',
            'learning',
            'assistant',
            'account',
          ];
          if (validModules.includes(mod)) {
            setActiveModule(mod);
          }
        } else if (
          call.name === 'propose_finance_entry' ||
          call.name === 'propose_task' ||
          call.name === 'propose_invoice' ||
          call.name === 'propose_learning_plan'
        ) {
          proposals.push({
            id: call.id || generateDocId('prop'),
            toolName: call.name,
            args: call.args || {},
            status: 'pending',
          });
        }
      }

      const groundingSources = Array.isArray(data.groundingSources) ? data.groundingSources : [];

      const assistantMsg: ChatMessage = {
        id: generateDocId('msg'),
        role: 'assistant',
        content: data.reply || 'Done.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposals: proposals.length > 0 ? proposals : undefined,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      };

      setAiMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach LIFEOS Intelligence.';
      setAiError(msg);
    } finally {
      setAiBusy(false);
    }
  };

  const askAiWithPrompt = (prompt: string, openFullView = false) => {
    if (openFullView) {
      setActiveModule('assistant');
      setAiDrawerOpen(false);
    } else {
      setAiDrawerOpen(true);
    }
    void sendAiMessage(prompt);
  };

  const resolveAiProposal = async (
    messageId: string,
    proposalId: string,
    decision: 'approved' | 'declined'
  ) => {
    const targetMsg = aiMessages.find((m) => m.id === messageId);
    const proposal = targetMsg?.proposals?.find((p) => p.id === proposalId);
    if (!proposal || proposal.status !== 'pending') return;

    if (decision === 'approved') {
      const a = proposal.args;
      if (proposal.toolName === 'propose_finance_entry') {
        await addTransaction({
          scope: a.scope === 'business' ? 'business' : 'personal',
          type: a.type === 'income' ? 'income' : 'expense',
          title: String(a.title || 'AI Logged Entry'),
          category: String(a.category || 'General'),
          amount: Number(a.amount || 0),
          date: String(a.date || todayIsoDate()),
          notes: a.notes ? String(a.notes) : undefined,
        });
      } else if (proposal.toolName === 'propose_task') {
        const validCat = ['personal', 'work', 'finance', 'learning', 'health'].includes(String(a.category))
          ? (String(a.category) as LifeTask['category'])
          : 'personal';
        const validPrio = ['low', 'medium', 'high'].includes(String(a.priority))
          ? (String(a.priority) as LifeTask['priority'])
          : 'medium';
        await addTask({
          title: String(a.title || 'New Task'),
          category: validCat,
          priority: validPrio,
          dueDate: String(a.dueDate || todayIsoDate()),
          timeSlot: a.timeSlot ? String(a.timeSlot) : undefined,
        });
      } else if (proposal.toolName === 'propose_invoice') {
        await addBusinessDocument({
          docType: a.docType === 'quote' ? 'quote' : 'invoice',
          clientName: String(a.clientName || 'Client'),
          itemSummary: String(a.itemSummary || 'Consulting Services'),
          subtotal: Number(a.subtotal || 1000),
          includeVat: Boolean(a.includeVat),
          dueDate: String(a.dueDate || addDaysIsoDate(14)),
        });
      } else if (proposal.toolName === 'propose_learning_plan') {
        const validLevel = ['beginner', 'intermediate', 'advanced'].includes(String(a.level))
          ? (String(a.level) as LearningTrack['level'])
          : 'beginner';
        await addLearningTrack({
          title: String(a.title || 'Skill Plan'),
          skillArea: String(a.skillArea || 'Skills'),
          level: validLevel,
          totalLessons: Number(a.totalLessons || 8),
          nextTopic: String(a.nextTopic || 'Lesson 1'),
          studyReminder: a.studyReminder ? String(a.studyReminder) : undefined,
        });
      }
    }

    setAiMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.proposals) return m;
        return {
          ...m,
          proposals: m.proposals.map((p) => (p.id === proposalId ? { ...p, status: decision } : p)),
        };
      })
    );
  };

  const exportAllUserData = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      compliance: 'POPIA Right of Access Export',
      workspace,
      privateProfile,
      transactions,
      goals,
      clients,
      documents,
      tasks,
      savedOpportunities,
      learningTracks,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifeos-export-${todayIsoDate()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('POPIA data archive exported');
  };

  const clearWorkspaceData = async () => {
    if (!user) return;
    const uid = user.uid;
    const subcollections = [
      'transactions',
      'goals',
      'clients',
      'documents',
      'tasks',
      'opportunities',
      'learning',
    ];
    try {
      for (const colName of subcollections) {
        const snap = await getDocs(
          query(collection(db, 'users', uid, colName), where('ownerId', '==', uid))
        );
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        if (!snap.empty) await batch.commit();
      }
      showToast('All workspace records cleared');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/clear_all`);
    }
  };

  return (
    <LifeOSContext.Provider
      value={{
        user,
        authReady,
        workspaceLoading,
        workspace,
        privateProfile,
        transactions,
        goals,
        clients,
        documents,
        tasks,
        savedOpportunities,
        learningTracks,
        notifications,
        theme,
        activeModule,
        setActiveModule,
        aiDrawerOpen,
        setAiDrawerOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        aiMessages,
        aiBusy,
        aiError,
        sendAiMessage,
        askAiWithPrompt,
        resolveAiProposal,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        sendPhoneOtp,
        verifyPhoneOtp,
        resendVerificationEmail,
        refreshAuthUser,
        needsEmailVerification,
        signOutUser,
        toggleTheme,
        updateWorkspaceSettings,
        updatePopiaConsent,
        updatePrivateProfile,
        addTransaction,
        deleteTransaction,
        addGoal,
        contributeGoal,
        markBillPaid,
        deleteGoal,
        addClient,
        deleteClient,
        addBusinessDocument,
        convertQuoteToInvoice,
        markDocumentPaid,
        deleteBusinessDocument,
        addTask,
        toggleTaskStatus,
        deleteTask,
        saveOpportunity,
        updateOpportunityStatus,
        removeSavedOpportunity,
        addLearningTrack,
        advanceLearningTrack,
        updateLearningReminder,
        deleteLearningTrack,
        exportAllUserData,
        clearWorkspaceData,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
};
