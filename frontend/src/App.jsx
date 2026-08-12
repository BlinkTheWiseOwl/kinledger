import React, { useState, useEffect, useRef } from 'react';
import { Shield, FileText, Plus, Trash2, Save, User, Users, Heart, Activity, ShieldAlert, Award, Phone, ArrowLeft, Printer, Eye, Share2, LogOut, Menu, X, ChevronDown, ChevronRight, Loader2, Check, Pencil, Tablets } from 'lucide-react';
import { loadCardData, saveCardData, BACKEND_URL, fetchSubscription } from './utils/storage';
import { AnalyticsService } from './utils/analytics';
import CapsuleIcon from './components/CapsuleIcon';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import EmergencyCard from './components/EmergencyCard';
import AuthScreen from './components/AuthScreen';
import PolicyPage from './components/PolicyPage';
import HelpPage from './components/HelpPage';
import PaywallModal from './components/PaywallModal';
import SubscriptionBadge from './components/SubscriptionBadge';

const BlueShield = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22V2Z" fill="#60a5fa" />
    <path d="M12 2V22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" fill="#2563eb" />
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" stroke="#d4af37" strokeWidth="0.75" strokeLinejoin="round" />
  </svg>
);

const UPCOMING_FEATURES = [
  { id: 'emergency', label: 'Have critical health information ready during emergencies' },
  { id: 'medicine', label: 'Never worry about missed medicines again' },
  { id: 'document', label: 'Find your medical documents in seconds' },
  { id: 'history', label: 'Never search or explain your parent\'s medical history from scratch again' },
  { id: 'family', label: 'Keep the whole family on the same page' },
  { id: 'benefits', label: 'Discover healthcare related financial benefits and savings you\'re eligible for' }
];

const getInitials = (name) => {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const renderMaterialAvatar = (avatarKey, size = 20, initials = '') => {
  if (avatarKey && avatarKey.startsWith('avatar_')) {
    return (
      <img
        src={`/avatars/${avatarKey}.png`}
        alt={avatarKey}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          display: 'block',
          objectFit: 'cover'
        }}
      />
    );
  }

  // Fallback: Two-letter initials Material Avatar
  const getInitialsBg = (str) => {
    const colors = ['#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#0d9488', '#06b6d4'];
    if (!str) return colors[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const bg = getInitialsBg(initials);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontSize: size > 18 ? '0.85rem' : '0.75rem',
      fontWeight: '700',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
      letterSpacing: '0.5px'
    }}>
      {initials}
    </div>
  );
};

export default function App() {
  // Session states
  const [token, setToken] = useState(localStorage.getItem('kinledger_jwt_token'));
  const [userEmail, setUserEmail] = useState(localStorage.getItem('kinledger_user_email'));

  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null); // null = Dashboard view
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'view' for the selected card

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [synced, setSynced] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' or 'info' or 'error'
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  // Subscription / monetization state
  const [userPlan, setUserPlan] = useState('free');
  const [planStatus, setPlanStatus] = useState('active');
  const [planExpiresAt, setPlanExpiresAt] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // New UX States
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPolicy, setShowPolicy] = useState(null); // 'privacy' | 'terms' | null
  const [showHelp, setShowHelp] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [newMemberName, setNewMemberName] = useState('');
  const [expandedSections, setExpandedSections] = useState({ profile: true, insurance: false, contacts: false, meds: false, share: false });
  const [activeSheet, setActiveSheet] = useState(null);
  const [avatarCollapsed, setAvatarCollapsed] = useState(true);
  const [lastSavedCards, setLastSavedCards] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchEndRef.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (handleComplete) => {
    if (touchStartRef.current === null || touchEndRef.current === null) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const minDistance = 50;
    if (distance > minDistance) {
      if (onboardingSlide < 2) {
        setOnboardingSlide(prev => prev + 1);
      } else {
        handleComplete();
      }
    } else if (distance < -minDistance) {
      if (onboardingSlide > 0) {
        setOnboardingSlide(prev => prev - 1);
      }
    }
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  // Handle splash and onboarding timers
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      const onboardingCompleted = localStorage.getItem('kinledger_onboarding_completed');
      if (onboardingCompleted !== 'true') {
        setShowOnboarding(true);
      }
    }, 2500); // 2.5 seconds
    return () => clearTimeout(splashTimer);
  }, []);

  // Auto-scroll onboarding slides
  useEffect(() => {
    let interval;
    if (showOnboarding) {
      interval = setInterval(() => {
        setOnboardingSlide((prev) => (prev < 2 ? prev + 1 : 0));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [showOnboarding]);
  const [votedFeature, setVotedFeature] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Sharing field state
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState(null);

  useEffect(() => {
    setShareError(null);
    setShareEmail('');
  }, [activeSheet]);

  // Dashboard state for adding a new member
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddMenuAtTop, setShowAddMenuAtTop] = useState(false);
  const [customRelation, setCustomRelation] = useState('');
  const addMenuRef = useRef(null);

  useEffect(() => {
    if (showAddMenu && addMenuRef.current) {
      setTimeout(() => {
        addMenuRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [showAddMenu]);

  // Temp contact and medication forms state (local to selected card workspace)
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phoneNumber: '', email: '' });
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', instructions: '' });
  const [editingContactIndex, setEditingContactIndex] = useState(null);
  const [editingMedIndex, setEditingMedIndex] = useState(null);

  // Load cards array on mount or session change
  useEffect(() => {
    if (!token) {
      setCards([]);
      setLoading(false);
      return;
    }

    async function initData() {
      setLoading(true);
      const { data, synced: isSynced } = await loadCardData(token);
      if (Array.isArray(data)) {
        setCards(data);
        setLastSavedCards(JSON.parse(JSON.stringify(data)));
      }
      setSynced(isSynced);

      // Fetch subscription status
      const sub = await fetchSubscription(token);
      setUserPlan(sub.plan || 'free');
      setPlanStatus(sub.status || 'active');
      setPlanExpiresAt(sub.expiresAt || null);

      setLoading(false);

    }
    initData();
  }, [token]);

  // Load waitlist status scoped to current user
  useEffect(() => {
    if (userEmail) {
      const emailKey = userEmail.toLowerCase().trim();
      const userJoined = localStorage.getItem(`kinledger_waitlist_joined_${emailKey}`) === 'true';
      const userFeaturesRaw = localStorage.getItem(`kinledger_waitlist_features_${emailKey}`);
      let userVoted = null;
      if (userFeaturesRaw) {
        try {
          const parsed = JSON.parse(userFeaturesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            userVoted = parsed[0];
          }
        } catch (e) { }
      }
      setJoinedWaitlist(userJoined);
      setVotedFeature(userVoted);
      setSelectedFeature(userVoted);
    } else {
      setJoinedWaitlist(false);
      setVotedFeature(null);
      setSelectedFeature(null);
    }
  }, [userEmail]);

  // Clear local contact and medication input fields and validation errors when switching cards, sheets, or adding members
  useEffect(() => {
    setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
    setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
    setEditingContactIndex(null);
    setEditingMedIndex(null);
    setValidationErrors({});
  }, [selectedCardId, activeSheet]);

  // Close hamburger menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuOpen) {
        const menuDropdown = document.querySelector('.menu-dropdown');
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        if (
          menuDropdown && 
          !menuDropdown.contains(event.target) && 
          hamburgerBtn && 
          !hamburgerBtn.contains(event.target)
        ) {
          setMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  const showStatus = (message, type = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  // Get readiness status of a card profile
  const getReadinessStatus = (card) => {
    if (!card) return { status: 'incomplete', label: '7 items needed for emergency readiness', color: '#ef4444' };
    const { profile, emergencyContacts = [], medications = [] } = card;
    const { fullName, age, bloodGroup, conditions, allergies } = profile || {};

    const missingItems = [];
    if (!fullName) missingItems.push('Full Name');
    if (!age) missingItems.push('Age');
    if (!bloodGroup) missingItems.push('Blood Group');
    if (!conditions) missingItems.push('Conditions');
    if (!allergies) missingItems.push('Allergies');
    if (emergencyContacts.length === 0) missingItems.push('Emergency Contacts');
    if (medications.length === 0) missingItems.push('Medications');

    if (missingItems.length > 0) {
      return {
        status: 'incomplete',
        label: `${missingItems.length} item${missingItems.length > 1 ? 's' : ''} needed for emergency readiness`,
        color: '#ef4444'
      };
    }

    const { insurancePolicy, insuranceNumber } = profile || {};
    // Yellow: if complete on primary but missing insurance
    if (!insurancePolicy || !insuranceNumber) {
      return {
        status: 'missing_insurance',
        label: 'Missing Insurance Information',
        color: '#f59e0b'
      };
    }

    // Green: complete
    return {
      status: 'complete',
      label: 'Emergency Profile Complete',
      color: '#10b981'
    };
  };

  // Format last updated duration string
  const formatLastUpdated = (updatedAt) => {
    if (!updatedAt) return 'Last updated: unknown';
    const diffMs = new Date() - new Date(updatedAt);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs <= 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins <= 0) return 'Last updated: Just now';
        return `Last updated: ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      }
      return `Last updated: ${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Last updated: 1 day ago';
    return `Last updated: ${diffDays} days ago`;
  };

  const containsUnsafeChars = (text) => {
    if (!text) return false;
    return /[<>"\\`;|]/.test(String(text));
  };

  const parseInsuranceExpiry = (dateStr) => {
    const months = {
      jan: 1, january: 1, janruary: 1, feb: 2, february: 2, mar: 3, march: 3,
      apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
      aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
      nov: 11, november: 11, dec: 12, december: 12
    };

    const trimmed = dateStr.trim();

    // Try MM/YYYY or MM/YY
    const mmyyyy = trimmed.match(/^([0-9]{1,2})\/([0-9]{4}|[0-9]{2})$/);
    if (mmyyyy) {
      let m = parseInt(mmyyyy[1], 10);
      let y = parseInt(mmyyyy[2], 10);
      if (mmyyyy[2].length === 2) {
        y += 2000;
      }
      return { month: m, year: y };
    }

    // Try Month YYYY
    const parts = trimmed.split(/\s+/);
    if (parts.length === 2) {
      const m = months[parts[0].toLowerCase()];
      const y = parseInt(parts[1], 10);
      if (m && !isNaN(y)) {
        return { month: m, year: y };
      }
    }
    return null;
  };

  const validateInsuranceExpiryWithDate = (dateStr) => {
    if (!dateStr || !dateStr.trim()) return { valid: true };

    if (!validateInsuranceExpiry(dateStr)) {
      return { valid: false, message: "Invalid format. Use MM/YYYY (e.g., 12/2028) or Month YYYY (e.g., Dec 2028)." };
    }

    const parsed = parseInsuranceExpiry(dateStr);
    if (!parsed) {
      return { valid: false, message: "Invalid format. Use MM/YYYY (e.g., 12/2028) or Month YYYY (e.g., Dec 2028)." };
    }

    const { month, year } = parsed;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    if (year < curYear || (year === curYear && month < curMonth)) {
      return { valid: false, message: "Valid Till date cannot be in the past." };
    }

    if (year > curYear + 10 || (year === curYear + 10 && month > curMonth)) {
      return { valid: false, message: "Valid Till date cannot be more than 10 years in the future." };
    }

    return { valid: true };
  };

  // Validate insurance valid till date format
  const validateInsuranceExpiry = (dateStr) => {
    if (!dateStr || !dateStr.trim()) return true; // Optional field is valid when empty

    // 1. Matches MM/YYYY (e.g. 12/2028) or MM/YY (e.g. 12/28)
    const slashRegex = /^(0[1-9]|1[0-2])\/([0-9]{4}|[0-9]{2})$/;
    if (slashRegex.test(dateStr)) return true;

    // 2. Matches "Dec 2028" or "December 2028" (case-insensitive)
    const months = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
      'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length === 2) {
      const monthPart = parts[0].toLowerCase();
      const yearPart = parts[1];
      const yearRegex = /^[0-9]{4}$/;
      if (months.includes(monthPart) && yearRegex.test(yearPart)) {
        return true;
      }
    }

    return false;
  };

  // Get currently active card details
  const activeCard = cards.find(c => c.id === selectedCardId) || null;

  // Save the entire cards array to LocalStorage and Replicate to mock Server/DB
  const saveCollection = async (updatedCards) => {
    // Validate all fields for active card
    if (selectedCardId) {
      const activeUpdate = updatedCards.find(c => c.id === selectedCardId);
      if (activeUpdate) {
        const errors = {};

        // 1. Full Name
        const name = activeUpdate.profile.fullName || '';
        if (!name.trim()) {
          errors.fullName = "Full Name is required.";
        } else if (name.length < 2 || name.length > 100) {
          errors.fullName = "Full Name must be between 2 and 100 characters.";
        } else if (containsUnsafeChars(name)) {
          errors.fullName = "Full Name cannot contain unsafe characters (<, >, \\, `).";
        }

        // 2. Relationship Tag
        const rel = activeUpdate.relationship || '';
        if (!rel || rel.trim() === '' || rel === 'Other') {
          errors.relationship = "Relationship is a required field.";
        } else {
          const cleanRel = rel.trim();
          const relationRegex = /^[a-zA-Z\s\-'\.]{1,30}$/;
          if (!relationRegex.test(cleanRel)) {
            errors.relationship = "Relationship tag must be 1-30 characters and only contain letters, spaces, hyphens, dots, or apostrophes.";
          }
        }

        // 3. Age
        const ageVal = activeUpdate.profile.age;
        if (ageVal !== undefined && ageVal !== null && String(ageVal).trim() !== '') {
          const ageNum = Number(ageVal);
          if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
            errors.age = "Age must be an integer between 0 and 130.";
          }
        }

        // 4. Blood Group
        // Blood Group is optional

        // 5. Conditions
        const cond = activeUpdate.profile.conditions || '';
        if (cond.length > 5000) {
          errors.conditions = "Conditions cannot exceed 5000 characters.";
        } else if (containsUnsafeChars(cond)) {
          errors.conditions = "Conditions cannot contain unsafe characters (<, >, \\, `).";
        }

        // 6. Allergies
        const allg = activeUpdate.profile.allergies || '';
        if (allg.length > 1000) {
          errors.allergies = "Allergies cannot exceed 1000 characters.";
        } else if (containsUnsafeChars(allg)) {
          errors.allergies = "Allergies cannot contain unsafe characters (<, >, \\, `).";
        }

        // 7. Insurance Provider
        const insPol = activeUpdate.profile.insurancePolicy || '';
        if (insPol.length > 100) {
          errors.insurancePolicy = "Insurance Provider cannot exceed 100 characters.";
        } else if (containsUnsafeChars(insPol)) {
          errors.insurancePolicy = "Insurance Provider cannot contain unsafe characters (<, >, \\, `).";
        }

        // 8. Policy Number
        const insNum = activeUpdate.profile.insuranceNumber || '';
        if (insNum.length > 100) {
          errors.insuranceNumber = "Policy Number cannot exceed 100 characters.";
        } else if (containsUnsafeChars(insNum)) {
          errors.insuranceNumber = "Policy Number cannot contain unsafe characters (<, >, \\, `).";
        }

        // 9. Valid Till
        const expiry = activeUpdate.profile.insuranceValidTill || '';
        if (expiry && expiry.trim() !== '') {
          const expiryVal = validateInsuranceExpiryWithDate(expiry);
          if (!expiryVal.valid) {
            errors.insuranceValidTill = expiryVal.message;
          }
        }

        // 10. Emergency Contacts
        (activeUpdate.emergencyContacts || []).forEach((contact, idx) => {
          if (!contact.name || !contact.name.trim()) {
            errors[`contactName_${idx}`] = "Contact Name is required.";
          } else if (contact.name.length < 2 || contact.name.length > 100) {
            errors[`contactName_${idx}`] = "Contact Name must be between 2 and 100 characters.";
          } else if (containsUnsafeChars(contact.name)) {
            errors[`contactName_${idx}`] = "Contact Name cannot contain unsafe characters (<, >, \\, `).";
          }

          if (!contact.relationship) {
            errors[`contactRelationship_${idx}`] = "Relationship is required.";
          }

          if (!contact.phoneNumber || !contact.phoneNumber.trim()) {
            errors[`contactPhone_${idx}`] = "Phone Number is required.";
          } else if (!/^[0-9]{8,14}$/.test(contact.phoneNumber.trim())) {
            errors[`contactPhone_${idx}`] = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
          }

          if (contact.email && contact.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contact.email.trim())) {
              errors[`contactEmail_${idx}`] = "Please enter a valid email address.";
            } else if (containsUnsafeChars(contact.email)) {
              errors[`contactEmail_${idx}`] = "Email cannot contain unsafe characters (<, >, \\, `).";
            }
          }
        });

        // 11. Medications
        (activeUpdate.medications || []).forEach((med, idx) => {
          if (containsUnsafeChars(med.name)) {
            errors[`medName_${idx}`] = `Medication #${idx + 1} Name cannot contain unsafe characters (<, >, \\, \`).`;
          }
          if (containsUnsafeChars(med.dosage)) {
            errors[`medDosage_${idx}`] = `Medication #${idx + 1} Dosage cannot contain unsafe characters (<, >, \\, \`).`;
          }
          if (containsUnsafeChars(med.instructions)) {
            errors[`medInstructions_${idx}`] = `Medication #${idx + 1} Instructions cannot contain unsafe characters (<, >, \\, \`).`;
          }
        });

        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          showStatus("Save failed: Please correct the errors in the form.", "error");
          return false; // Abort saving!
        }
      }
    }

    setIsSaving(true);

    // Set updated list in state
    let finalCards = updatedCards;
    if (selectedCardId) {
      finalCards = updatedCards.map(c => {
        if (c.id === selectedCardId) {
          return { ...c, updatedAt: new Date().toISOString() };
        }
        return c;
      });
    }

    setCards(finalCards);
    try {
      const result = await saveCardData(finalCards, token);
      setSynced(result.synced);
      if (result.success) {
        showStatus('Changes saved successfully.', 'success');
        setLastSavedCards(JSON.parse(JSON.stringify(finalCards)));
        return true;
      } else {
        showStatus(`Save failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      showStatus('Error saving cards data.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new profile card
  const handleCreateCard = (relation, name) => {
    if (!relation || !relation.trim()) {
      showStatus("Relationship is required.", "error");
      return;
    }
    if (!name || !name.trim()) {
      showStatus("Name is required.", "error");
      return;
    }

    const cleanRelation = relation.trim();
    const relationRegex = /^[a-zA-Z\s\-'\.]{1,30}$/;
    if (!relationRegex.test(cleanRelation)) {
      showStatus("Relationship tag must be 1-30 characters and only contain letters, spaces, hyphens, dots, or apostrophes.", "error");
      return;
    }

    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      showStatus("Name must be between 2 and 100 characters.", "error");
      return;
    }
    if (containsUnsafeChars(cleanName)) {
      showStatus("Name cannot contain unsafe characters (<, >, \\, `).", "error");
      return;
    }

    const newCard = {
      id: 'card-' + Date.now(),
      relationship: cleanRelation,
      avatar: '',
      profile: {
        fullName: cleanName,
        age: '',
        bloodGroup: '',
        allergies: '',
        conditions: '',
        insurancePolicy: '',
        insuranceNumber: '',
        insuranceValidTill: ''
      },
      emergencyContacts: [],
      medications: [],
      ownerEmail: userEmail,
      isShared: false,
      sharedWith: [],
      updatedAt: new Date().toISOString()
    };

    const updated = [...cards, newCard];
    setCards(updated);
    
    // Track that a new emergency profile was created
    AnalyticsService.logEvent('emergency_profile_created', { fields_filled: 2 }); // Initial Name and Relationship

    try {
      localStorage.setItem('elder_navigator_cards_collection', JSON.stringify(updated));
    } catch (err) {
      console.error('LocalStorage write error:', err);
    }

    // Jump straight to editing this new card
    setSelectedCardId(newCard.id);
    setActiveTab('edit');
    setShowAddMenu(false);
    setCustomRelation('');
    setNewMemberName('');
    showStatus(`New card created for ${cleanRelation}.`, 'success');
  };

  // Delete a profile card (revokes access if shared card)
  const handleDeleteCard = async (id, event) => {
    if (event) event.stopPropagation(); // prevent opening card if clicked from dashboard

    const cardToDelete = cards.find(c => c.id === id);
    const name = cardToDelete?.profile?.fullName || cardToDelete?.relationship || 'Family Member';

    const confirmMsg = cardToDelete?.isShared
      ? `Are you sure you want to remove the shared card for ${name}? You will lose access.`
      : `Are you sure you want to delete the emergency card for ${name}? This will delete it for everyone.`;

    if (window.confirm(confirmMsg)) {
      const updated = cards.filter(c => c.id !== id);

      if (cardToDelete?.isShared) {
        try {
          const response = await fetch(`${BACKEND_URL}/shares`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profileId: id, emailToRevoke: userEmail })
          });

          if (!response.ok) {
            throw new Error('Revocation failed.');
          }

          setCards(updated);
          showStatus('Shared card removed from dashboard.', 'info');
        } catch (err) {
          showStatus('Failed to remove shared card from dashboard.', 'error');
        }
      } else {
        await saveCollection(updated);
      }

      if (selectedCardId === id) {
        setSelectedCardId(null);
      }
    }
  };

  // Update details of selected card
  const updateActiveCardProfile = (e) => {
    const { name, value } = e.target;
    if (!selectedCardId) return;

    // Real-time validation
    setValidationErrors(prev => {
      const copy = { ...prev };

      if (name === 'fullName') {
        if (!value.trim()) {
          copy.fullName = "Full Name is required.";
        } else if (value.length < 2 || value.length > 100) {
          copy.fullName = "Full Name must be between 2 and 100 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.fullName = "Full Name cannot contain unsafe characters (<, >, \\, `).";
        } else {
          delete copy.fullName;
        }
      }

      if (name === 'age') {
        if (value === undefined || value === null || String(value).trim() === '') {
          delete copy.age;
        } else {
          const ageNum = Number(value);
          if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
            copy.age = "Age must be an integer between 0 and 130.";
          } else {
            delete copy.age;
          }
        }
      }

      if (name === 'bloodGroup') {
        delete copy.bloodGroup;
      }

      if (name === 'conditions') {
        if (value.length > 5000) {
          copy.conditions = "Conditions cannot exceed 5000 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.conditions = "Conditions cannot contain unsafe characters (<, >, \\, `).";
        } else {
          delete copy.conditions;
        }
      }

      if (name === 'allergies') {
        if (value.length > 1000) {
          copy.allergies = "Allergies cannot exceed 1000 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.allergies = "Allergies cannot contain unsafe characters (<, >, \\, `).";
        } else {
          delete copy.allergies;
        }
      }

      if (name === 'insurancePolicy') {
        if (value.length > 100) {
          copy.insurancePolicy = "Insurance Provider cannot exceed 100 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.insurancePolicy = "Insurance Provider cannot contain unsafe characters (<, >, \\, `).";
        } else {
          delete copy.insurancePolicy;
        }
      }

      if (name === 'insuranceNumber') {
        if (value.length > 100) {
          copy.insuranceNumber = "Policy Number cannot exceed 100 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.insuranceNumber = "Policy Number cannot contain unsafe characters (<, >, \\, `).";
        } else {
          delete copy.insuranceNumber;
        }
      }

      if (name === 'insuranceValidTill') {
        if (!value || value.trim() === '' || validateInsuranceExpiry(value)) {
          const expiryVal = validateInsuranceExpiryWithDate(value);
          if (!expiryVal.valid) {
            copy.insuranceValidTill = expiryVal.message;
          } else {
            delete copy.insuranceValidTill;
          }
        } else {
          copy.insuranceValidTill = "Invalid format. Use MM/YYYY (e.g., 12/2028) or Month YYYY (e.g., Dec 2028).";
        }
      }

      return copy;
    });

    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          profile: {
            ...c.profile,
            [name]: value
          }
        };
      }
      return c;
    });

    setCards(updated); // Local update only; saved when clicking "Save Information"
  };

  // Update active card relationship type
  const updateActiveCardRelationship = (value) => {
    if (!selectedCardId) return;

    setValidationErrors(prev => {
      const copy = { ...prev };
      if (value === undefined || value === null || String(value).trim() === '') {
        copy.relationship = "Relationship is required.";
      } else {
        const cleanVal = String(value).trim();
        const relationRegex = /^[a-zA-Z\s\-'\.]{1,30}$/;
        if (!relationRegex.test(cleanVal) && cleanVal !== 'Other') {
          copy.relationship = "Relationship tag must be 1-30 characters and only contain letters, spaces, hyphens, dots, or apostrophes.";
        } else {
          delete copy.relationship;
        }
      }
      return copy;
    });

    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return { ...c, relationship: value };
      }
      return c;
    });
    setCards(updated);
  };

  // Update active card avatar symbol
  
  // Update active card contact/medication directly for inline editing

  // Update active card contact/medication directly for inline editing
  const updateActiveCardContact = (index, field, value) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        const contacts = [...c.emergencyContacts];
        contacts[index] = { ...contacts[index], [field]: value };
        return { ...c, emergencyContacts: contacts };
      }
      return c;
    });
    setCards(updated);
  };

  const updateActiveCardMedication = (index, field, value) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        const meds = [...c.medications];
        meds[index] = { ...meds[index], [field]: value };
        return { ...c, medications: meds };
      }
      return c;
    });
    setCards(updated);
  };

  const updateActiveCardAvatar = (value) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return { ...c, avatar: value };
      }
      return c;
    });
    setCards(updated);
  };

  // Real-time validation helper for emergency contact form fields
  const updateNewContact = (field, value) => {
    setNewContact(prev => ({ ...prev, [field]: value }));

    setValidationErrors(prev => {
      const copy = { ...prev };

      if (field === 'name') {
        if (!value.trim()) {
          copy.contactName = "Contact Name is required.";
        } else if (value.length < 2 || value.length > 100) {
          copy.contactName = "Contact Name must be between 2 and 100 characters.";
        } else if (containsUnsafeChars(value)) {
          copy.contactName = "Contact Name cannot contain unsafe characters (<, >, \\, `).";
        } else {
          delete copy.contactName;
        }
      }

      if (field === 'relationship') {
        if (!value) {
          copy.contactRelationship = "Relationship is required.";
        } else {
          delete copy.contactRelationship;
        }
      }

      if (field === 'phoneNumber') {
        if (!value.trim()) {
          copy.contactPhone = "Phone Number is required.";
        } else if (!/^[0-9]{8,14}$/.test(value.trim())) {
          copy.contactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
        } else {
          delete copy.contactPhone;
        }
      }

      if (field === 'email') {
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            copy.contactEmail = "Please enter a valid email address.";
          } else if (containsUnsafeChars(value)) {
            copy.contactEmail = "Email cannot contain unsafe characters (<, >, \\, `).";
          } else {
            delete copy.contactEmail;
          }
        } else {
          delete copy.contactEmail;
        }
      }

      return copy;
    });
  };

  // Add/Edit contact of selected card
  const addContactToActiveCard = (e) => {
    if (e) e.preventDefault();
    if (!selectedCardId) return;

    const { name, relationship, phoneNumber, email = '' } = newContact;

    const errors = {};
    if (!name.trim()) {
      errors.contactName = "Contact Name is required.";
    } else if (name.length < 2 || name.length > 100) {
      errors.contactName = "Contact Name must be between 2 and 100 characters.";
    } else if (containsUnsafeChars(name)) {
      errors.contactName = "Contact Name cannot contain unsafe characters (<, >, \\, `).";
    }

    if (!relationship) {
      errors.contactRelationship = "Relationship is required.";
    }

    if (!phoneNumber.trim()) {
      errors.contactPhone = "Phone Number is required.";
    } else if (!/^[0-9]{8,14}$/.test(phoneNumber.trim())) {
      errors.contactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
    }

    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.contactEmail = "Please enter a valid email address.";
      } else if (containsUnsafeChars(email)) {
        errors.contactEmail = "Email cannot contain unsafe characters (<, >, \\, `).";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      showStatus('Please correct the contact form errors.', 'error');
      return;
    }

    if (editingContactIndex === null && activeCard.emergencyContacts.length >= 2) {
      showStatus('Emergency contacts are limited to 2 per card.', 'error');
      return;
    }

    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        let updatedContacts = [...c.emergencyContacts];
        if (editingContactIndex !== null) {
          updatedContacts[editingContactIndex] = { ...newContact };
        } else {
          updatedContacts.push({ ...newContact });
        }
        return {
          ...c,
          emergencyContacts: updatedContacts
        };
      }
      return c;
    });

    setCards(updated);
    setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
    setEditingContactIndex(null);

    // Clear contact errors
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy.contactName;
      delete copy.contactRelationship;
      delete copy.contactPhone;
      delete copy.contactEmail;
      return copy;
    });

    if (editingContactIndex !== null) {
      showStatus("Emergency contact updated. Click 'Save & Close' to confirm.", "info");
    } else {
      showStatus("Emergency contact added. Click 'Save & Close' to confirm.", "info");
    }
  };

  // Remove contact from selected card
  const removeContactFromActiveCard = (index) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          emergencyContacts: c.emergencyContacts.filter((_, i) => i !== index)
        };
      }
      return c;
    });
    setCards(updated);
    showStatus("Emergency contact removed. Click 'Save & Close' to confirm.", "info");
  };

  // Add/Edit medication of selected card
  const addMedicationToActiveCard = (e) => {
    if (e) e.preventDefault();
    if (!selectedCardId) return;

    const { name, dosage = '', frequency = '', instructions = '' } = newMed;

    if (!name.trim()) {
      showStatus('Medication Name is required.', 'error');
      return;
    }
    if (name.length > 100) {
      showStatus('Medication Name cannot exceed 100 characters.', 'error');
      return;
    }
    if (containsUnsafeChars(name)) {
      showStatus('Medication Name cannot contain unsafe characters (<, >, \\, `).', 'error');
      return;
    }

    if (dosage && dosage.length > 50) {
      showStatus('Dosage cannot exceed 50 characters.', 'error');
      return;
    }
    if (containsUnsafeChars(dosage)) {
      showStatus('Dosage cannot contain unsafe characters (<, >, \\, `).', 'error');
      return;
    }

    if (containsUnsafeChars(frequency)) {
      showStatus('Frequency cannot contain unsafe characters (<, >, \\, `).', 'error');
      return;
    }

    if (containsUnsafeChars(instructions)) {
      showStatus('Instructions cannot contain unsafe characters (<, >, \\, `).', 'error');
      return;
    }

    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        let updatedMeds = [...c.medications];
        if (editingMedIndex !== null) {
          updatedMeds[editingMedIndex] = { ...newMed };
        } else {
          updatedMeds.push({ ...newMed });
        }
        return {
          ...c,
          medications: updatedMeds
        };
      }
      return c;
    });

    setCards(updated);
    setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
    setEditingMedIndex(null);

    if (editingMedIndex !== null) {
      showStatus("Medication updated. Click 'Save & Close' to confirm.", "info");
    } else {
      showStatus("Medication added. Click 'Save & Close' to confirm.", "info");
    }
  };

  // Remove medication from selected card
  const removeMedicationFromActiveCard = (index) => {
    if (!selectedCardId) return;
    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          medications: c.medications.filter((_, i) => i !== index)
        };
      }
      return c;
    });
    setCards(updated);
    showStatus("Medication removed. Click 'Save & Close' to confirm.", "info");
  };

// Manual trigger to save current active states (auto-flushes pending add forms with validation)
  const handleSaveActiveCard = async () => {
    let currentCards = [...cards];
    let cardsChanged = false;

    // Validate and auto-save pending new contact if partially filled
    const hasPendingContact = newContact && (
      (newContact.name && newContact.name.trim() !== '') ||
      newContact.relationship ||
      (newContact.phoneNumber && newContact.phoneNumber.trim() !== '') ||
      (newContact.email && newContact.email.trim() !== '')
    );

    if (hasPendingContact) {
      const { name = '', relationship = '', phoneNumber = '', email = '' } = newContact;
      const contactErrors = {};

      if (!name.trim()) {
        contactErrors.newContactName = "Contact Name is required.";
      } else if (name.length < 2 || name.length > 100) {
        contactErrors.newContactName = "Contact Name must be between 2 and 100 characters.";
      } else if (containsUnsafeChars(name)) {
        contactErrors.newContactName = "Contact Name cannot contain unsafe characters (<, >, \\, `).";
      }

      if (!relationship) {
        contactErrors.newContactRelationship = "Relationship is required.";
      }

      if (!phoneNumber.trim()) {
        contactErrors.newContactPhone = "Phone Number is required.";
      } else if (!/^[0-9]{8,14}$/.test(phoneNumber.trim())) {
        contactErrors.newContactPhone = "Phone Number must contain exactly 8 to 14 digits with no special characters.";
      }

      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          contactErrors.newContactEmail = "Please enter a valid email address.";
        } else if (containsUnsafeChars(email)) {
          contactErrors.newContactEmail = "Email cannot contain unsafe characters (<, >, \\, `).";
        }
      }

      // Check limits
      const activeCard = cards.find(c => c.id === selectedCardId);
      if (activeCard && activeCard.emergencyContacts.length >= 2) {
        showStatus('Emergency contacts are limited to 2 per card.', 'error');
        return false;
      }

      if (Object.keys(contactErrors).length > 0) {
        setValidationErrors(prev => ({ ...prev, ...contactErrors }));
        showStatus('Please correct the contact form errors.', 'error');
        return false;
      }

      // If valid, append it
      currentCards = currentCards.map(c => {
        if (c.id === selectedCardId) {
          return {
            ...c,
            emergencyContacts: [...c.emergencyContacts, { ...newContact }]
          };
        }
        return c;
      });
      setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
      cardsChanged = true;
    }

    // Validate and auto-save pending new medication if partially filled
    const hasPendingMed = newMed && (
      (newMed.name && newMed.name.trim() !== '') ||
      (newMed.dosage && newMed.dosage.trim() !== '') ||
      newMed.frequency ||
      (newMed.instructions && newMed.instructions.trim() !== '')
    );

    if (hasPendingMed) {
      const { name = '', dosage = '', frequency = '', instructions = '' } = newMed;

      if (!name.trim()) {
        showStatus('Medication Name is required.', 'error');
        return false;
      }
      if (name.length > 100) {
        showStatus('Medication Name cannot exceed 100 characters.', 'error');
        return false;
      }
      if (containsUnsafeChars(name)) {
        showStatus('Medication Name cannot contain unsafe characters (<, >, \\, `).', 'error');
        return false;
      }
      if (dosage && dosage.length > 50) {
        showStatus('Dosage cannot exceed 50 characters.', 'error');
        return false;
      }
      if (containsUnsafeChars(dosage)) {
        showStatus('Dosage cannot contain unsafe characters (<, >, \\, `).', 'error');
        return false;
      }
      if (containsUnsafeChars(frequency)) {
        showStatus('Frequency cannot contain unsafe characters (<, >, \\, `).', 'error');
        return false;
      }
      if (containsUnsafeChars(instructions)) {
        showStatus('Instructions cannot contain unsafe characters (<, >, \\, `).', 'error');
        return false;
      }

      // If valid, append it
      currentCards = currentCards.map(c => {
        if (c.id === selectedCardId) {
          return {
            ...c,
            medications: [...c.medications, { ...newMed }]
          };
        }
        return c;
      });
      setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
      cardsChanged = true;
    }

    if (cardsChanged) {
      setCards(currentCards);
    }
    return await saveCollection(currentCards);
  };

  // Share app invite / install link
  const handleShareAppInstall = async (invitedEmail) => {
    const inviteMessage = `Hey! Join me on KinLedger to securely manage family medical emergency cards together. Please register your account using ${invitedEmail || 'your email'} at:`;
    const appUrl = 'https://kinledger-blush.vercel.app';
    
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Join KinLedger',
          text: inviteMessage,
          url: appUrl,
          dialogTitle: 'Invite Family Member'
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Join KinLedger',
          text: inviteMessage,
          url: appUrl
        });
      } else {
        // Fallback: Copy to Clipboard
        await navigator.clipboard.writeText(`${inviteMessage} ${appUrl}`);
        showStatus('Invite link copied to clipboard! Send it to your family.', 'success');
      }
    } catch (err) {
      if (err && !String(err).toLowerCase().includes('cancel')) {
        console.error('Sharing invite link failed:', err);
      }
    }
  };

  // Share Card Handler
  const handleShareCard = async () => {
    if (!shareEmail) return;
    const cleanEmail = shareEmail.toLowerCase().trim();
    setShareError(null);

    if (cleanEmail === userEmail) {
      setShareError({ message: "You cannot share a card with yourself.", type: "validation" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setShareError({ message: "Please enter a valid email address.", type: "validation" });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileId: selectedCardId, emailToShare: cleanEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.notEnrolled) {
          setShareError({
            message: data.error || "This email is not registered with KinLedger yet.",
            type: "notEnrolled",
            email: cleanEmail
          });
        } else {
          setShareError({ message: data.error || "Failed to share card.", type: "api" });
        }
        throw new Error(data.error || 'Failed to share card.');
      }

      showStatus(`Card successfully shared with ${cleanEmail}!`, 'success');
      setShareEmail('');
      setShareError(null);

      // Update local share state
      setCards(prev => prev.map(c => {
        if (c.id === selectedCardId) {
          const list = c.sharedWith || [];
          if (!list.includes(cleanEmail)) {
            return { ...c, sharedWith: [...list, cleanEmail] };
          }
        }
        return c;
      }));
    } catch (err) {
      // API notifications handled via state shareError or regular alert status
      if (err.message && !err.message.includes('registered')) {
        showStatus(err.message, 'error');
      }
    }
  };

  // Revoke Share Handler
  const handleRevokeShare = async (emailToRevoke) => {
    try {
      const response = await fetch(`${BACKEND_URL}/shares`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileId: selectedCardId, emailToRevoke })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke access.');
      }

      showStatus(`Access revoked for ${emailToRevoke}.`, 'info');

      // Update local state share list
      setCards(prev => prev.map(c => {
        if (c.id === selectedCardId) {
          return { ...c, sharedWith: (c.sharedWith || []).filter(e => e !== emailToRevoke) };
        }
        return c;
      }));
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // Log out session
  const handleLogout = () => {
    localStorage.removeItem('kinledger_jwt_token');
    localStorage.removeItem('kinledger_user_email');
    setToken(null);
    setUserEmail(null);
    setCards([]);
    setSelectedCardId(null);
    setUserPlan('free');
    setPlanStatus('active');
    setPlanExpiresAt(null);
    showStatus("Logged out successfully.", "info");
  };

  const handleUpgradeSuccess = (result) => {
    setUserPlan(result.plan);
    setPlanStatus(result.status);
    setPlanExpiresAt(result.expiresAt);
    setShowPaywall(false);
    showStatus('Welcome to KinLedger Family! 🎉 You can now add unlimited family profiles.', 'success');
  };

  // Delete account permanently (DPDP / Right to Erasure)
  const handleDeleteAccount = async () => {
    const password = window.prompt("WARNING: This will permanently delete your KinLedger account and all associated family medical profiles. This action cannot be undone.\n\nEnter your password to confirm deletion:");
    if (password === null) return; // User cancelled
    if (!password.trim()) {
      showStatus("Password is required to delete account.", "error");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      showStatus("Your account and all family records have been permanently deleted.", "success");

      // Purge credentials and return to auth screen
      localStorage.removeItem('kinledger_jwt_token');
      localStorage.removeItem('kinledger_user_email');
      setToken(null);
      setUserEmail(null);
      setCards([]);
      setSelectedCardId(null);
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  const handleFeatureSelect = (featureId) => {
    setSelectedFeature(featureId);
  };

  const handleJoinWaitlist = async () => {
    if (!selectedFeature) {
      showStatus("Please select a feature to vote on.", "error");
      return;
    }

    const keySuffix = userEmail ? `_${userEmail.toLowerCase().trim()}` : '';
    localStorage.setItem(`kinledger_waitlist_joined${keySuffix}`, 'true');
    localStorage.setItem(`kinledger_waitlist_features${keySuffix}`, JSON.stringify([selectedFeature]));
    setJoinedWaitlist(true);
    setVotedFeature(selectedFeature);
    showStatus("Thank you for voting and joining the KinLedger Waitlist!", "success");
    try {
      await fetch(`${BACKEND_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date(),
          feature: selectedFeature,
          email: userEmail
        })
      });
    } catch (err) {
      console.log('Waitlist API bypassed in offline mode.');
    }
  };

  const handleResetWaitlist = () => {
    const keySuffix = userEmail ? `_${userEmail.toLowerCase().trim()}` : '';
    localStorage.removeItem(`kinledger_waitlist_joined${keySuffix}`);
    localStorage.removeItem(`kinledger_waitlist_features${keySuffix}`);
    setJoinedWaitlist(false);
    setSelectedFeature(null);
    setVotedFeature(null);
    showStatus("Waitlist selection reset. You can vote again.", "info");
  };

  const getRelationBadgeClass = (relation) => {
    if (!relation) return 'badge-other';
    const clean = relation.toLowerCase().trim();
    if (clean === 'father') return 'badge-father';
    if (clean === 'mother') return 'badge-mother';
    if (clean === 'spouse' || clean === 'husband' || clean === 'wife') return 'badge-spouse';
    if (clean === 'son') return 'badge-son';
    if (clean === 'daughter') return 'badge-daughter';
    if (clean === 'father-in-law') return 'badge-father-in-law';
    if (clean === 'mother-in-law') return 'badge-mother-in-law';
    return 'badge-other';
  };

  const renderAddMemberForm = () => (
    <div ref={addMenuRef} className="member-summary-card" style={{ borderStyle: 'solid', borderColor: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', height: '100%' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'var(--font-title)' }}>
          New Member
        </div>
        
        <input
          type="text"
          placeholder="Name * (Required)"
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          style={{ marginBottom: '0.2rem' }}
        />
        
        <select
          onChange={(e) => {
            if (e.target.value === 'custom') {
              setCustomRelation('Other');
            } else {
              setCustomRelation(e.target.value);
            }
          }}
          value={customRelation && ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Father-in-law', 'Mother-in-law'].includes(customRelation) ? customRelation : (customRelation ? 'custom' : '')}
        >
          <option value="" disabled>Choose relationship * (Required)...</option>
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Spouse">Spouse</option>
          <option value="Son">Son</option>
          <option value="Daughter">Daughter</option>
          <option value="Father-in-law">Father-in-law</option>
          <option value="Mother-in-law">Mother-in-law</option>
          <option value="custom">Other / Custom...</option>
        </select>

        {/* Show input if custom relation selected */}
        {customRelation !== null && customRelation !== '' && !['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Father-in-law', 'Mother-in-law'].includes(customRelation) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
            <input
              type="text"
              placeholder="e.g., Grandfather, Aunt"
              value={customRelation === 'Other' ? '' : customRelation}
              onChange={(e) => {
                const val = e.target.value;
                // Clean input: only allow safe characters (letters, spaces, hyphens, dots, apostrophes)
                const clean = val.replace(/[^a-zA-Z\s\-'\.]/g, '').substring(0, 30);
                setCustomRelation(clean === '' ? 'Other' : clean);
              }}
              style={customRelation === 'Other' ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
            />
            {customRelation === 'Other' && (
              <span className="field-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: '500' }}>
                Relationship is a required field.
              </span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Letters, spaces, hyphens, dots, or apostrophes only (max 30 chars).
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              disabled={!newMemberName.trim() || !customRelation?.trim() || customRelation === 'Other'}
              onClick={() => {
                  handleCreateCard(customRelation, newMemberName);
              }}
            >
              Confirm
            </button>
            <button
              className="btn btn-danger btn-sm"
              style={{ flex: 1 }}
              onClick={() => {
                setShowAddMenu(false);
                setShowAddMenuAtTop(false);
                setCustomRelation('');
                setNewMemberName('');
              }}
            >
              Cancel
            </button>
        </div>
      </div>
    </div>
  );

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content animated">
          <BlueShield size={80} className="splash-logo-icon" />
          <h1 className="splash-title">KinLedger</h1>
          <p className="splash-subtitle">Your Family Emergency Shield</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    const handleCompleteOnboarding = () => {
      localStorage.setItem('kinledger_onboarding_completed', 'true');
      setShowOnboarding(false);
    };

    return (
      <div className="onboarding-screen">
        <div 
          className="onboarding-card animated"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => handleTouchEnd(handleCompleteOnboarding)}
        >
          <div className="onboarding-slides">
            {onboardingSlide === 0 && (
              <div className="onboarding-slide animated">
                <div className="onboarding-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="rgba(239, 68, 68, 0.03)" />
                    <circle cx="100" cy="100" r="60" fill="rgba(239, 68, 68, 0.06)" />
                    <path d="M30 100H60L72 65L88 135L104 80L116 120L128 100H170" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M100 40C100 40 120 47 150 47V105C150 145 125 170 100 180C75 170 50 145 50 105V47C80 47 100 40 100 40Z" fill="url(#shieldGrad)" stroke="#d4af37" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M75 105H90L97 85L105 125L112 95L118 115L125 105H140" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                      <linearGradient id="shieldGrad" x1="50" y1="40" x2="150" y2="180" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#b91c1c" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <h2>Be Prepared Before an Emergency Happens</h2>
                <p>Keep your loved one's essential medical information ready - so you're never scrambling when every second matters.</p>
              </div>
            )}
            {onboardingSlide === 1 && (
              <div className="onboarding-slide animated">
                <div className="onboarding-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="rgba(15, 108, 95, 0.03)" />
                    <circle cx="100" cy="100" r="60" fill="rgba(15, 108, 95, 0.06)" />
                    <rect x="60" y="45" width="80" height="110" rx="8" fill="#ffffff" stroke="var(--primary)" strokeWidth="3" />
                    <rect x="85" y="35" width="30" height="15" rx="4" fill="#d4af37" stroke="#b45309" strokeWidth="1.5" />
                    <line x1="75" y1="75" x2="125" y2="75" stroke="var(--primary-light)" strokeWidth="4" strokeLinecap="round" />
                    <line x1="75" y1="95" x2="115" y2="95" stroke="var(--primary-light)" strokeWidth="4" strokeLinecap="round" />
                    <line x1="75" y1="115" x2="125" y2="115" stroke="var(--primary-light)" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="125" cy="125" r="22" fill="#0f6c5f" stroke="#ffffff" strokeWidth="2.5" />
                    <path d="M125 131.5C125 131.5 129.5 127.5 131.5 125.5C133.5 123.5 133.5 120.5 131.5 118.5C129.5 116.5 126.5 116.5 125 118.5C123.5 116.5 120.5 116.5 118.5 118.5C116.5 120.5 116.5 123.5 118.5 125.5L125 131.5Z" fill="#ffffff" />
                  </svg>
                </div>
                <h2>One Place for Your Family's Health Records</h2>
                <p>Store medical conditions, medications, allergies, insurance details, and emergency contacts in a secure, organized profile.</p>
              </div>
            )}
            {onboardingSlide === 2 && (
              <div className="onboarding-slide animated">
                <div className="onboarding-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="rgba(37, 99, 235, 0.03)" />
                    <circle cx="100" cy="100" r="60" fill="rgba(37, 99, 235, 0.06)" />
                    <line x1="100" y1="100" x2="50" y2="60" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="100" y1="100" x2="150" y2="60" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 4" />
                    <line x1="100" y1="100" x2="100" y2="155" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="50" cy="60" r="8" fill="#2563eb" />
                    <circle cx="150" cy="60" r="8" fill="#2563eb" />
                    <rect x="65" y="70" width="70" height="45" rx="4" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                    <rect x="75" y="80" width="20" height="5" rx="1" fill="#2563eb" opacity="0.3" />
                    <rect x="75" y="90" width="35" height="4" rx="1" fill="#2563eb" opacity="0.2" />
                    <rect x="75" y="98" width="25" height="4" rx="1" fill="#2563eb" opacity="0.2" />
                    <circle cx="120" cy="85" r="6" fill="#fbbf24" />
                    <circle cx="100" cy="115" r="22" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />
                    <circle cx="95" cy="115" r="3" fill="#ffffff" />
                    <circle cx="105" cy="110" r="3" fill="#ffffff" />
                    <circle cx="105" cy="120" r="3" fill="#ffffff" />
                    <line x1="95" y1="115" x2="105" y2="110" stroke="#ffffff" strokeWidth="2" />
                    <line x1="95" y1="115" x2="105" y2="120" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>
                <h2>Share Critical Information Instantly</h2>
                <p>Open or share an emergency medical card with family members or healthcare providers in just a few taps.</p>
              </div>
            )}
          </div>

          <div className="onboarding-footer" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
            <div className="onboarding-dots" style={{ display: 'flex', gap: '8px' }}>
              <span className={`dot ${onboardingSlide === 0 ? 'active' : ''}`} onClick={() => setOnboardingSlide(0)}></span>
              <span className={`dot ${onboardingSlide === 1 ? 'active' : ''}`} onClick={() => setOnboardingSlide(1)}></span>
              <span className={`dot ${onboardingSlide === 2 ? 'active' : ''}`} onClick={() => setOnboardingSlide(2)}></span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1, borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                onClick={handleCompleteOnboarding}
              >
                Skip
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  if (onboardingSlide < 2) {
                    setOnboardingSlide(onboardingSlide + 1);
                  } else {
                    handleCompleteOnboarding();
                  }
                }}
              >
                {onboardingSlide === 2 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPolicy) {
    return <PolicyPage type={showPolicy} onClose={() => setShowPolicy(null)} />;
  }

  if (showHelp) {
    return (
      <HelpPage
        onClose={() => setShowHelp(false)}
        onReplayOnboarding={() => {
          setShowOnboarding(true);
          setOnboardingSlide(0);
          setShowHelp(false);
        }}
      />
    );
  }

  if (!token) {
    return <AuthScreen onAuthSuccess={(t, email) => { setToken(t); setUserEmail(email); }} showStatus={showStatus} onShowPolicy={setShowPolicy} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)' }}>Loading Family Dashboard...</h2>
      </div>
    );
  }

  // --- Subscription State Derivations ---
  const ownedCardsForLimit = cards.filter(c => !c.isShared);
  const isOverLimit = userPlan !== 'family' && ownedCardsForLimit.length > 2;
  
  let showExpiryWarning = false;
  let expiryDaysLeft = 0;
  if (userPlan === 'family' && planStatus === 'active' && planExpiresAt) {
    expiryDaysLeft = Math.ceil((new Date(planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    if (expiryDaysLeft <= 30 && expiryDaysLeft > 0) {
      showExpiryWarning = true;
    }
  }


  const handleCloseSheet = async () => {
    if (lastSavedCards && JSON.stringify(cards) !== JSON.stringify(lastSavedCards)) {
      const success = await handleSaveActiveCard();
      if (success) {
        setActiveSheet(null);
      }
    } else {
      setActiveSheet(null);
    }
  };

  const handleCloseCard = async () => {
    if (lastSavedCards && JSON.stringify(cards) !== JSON.stringify(lastSavedCards)) {
      const success = await handleSaveActiveCard();
      if (success) {
        setSelectedCardId(null);
      }
    } else {
      setSelectedCardId(null);
    }
  };

  return (
    <div className="app-container">
      {/* Header Banner */}
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a href="#" className="logo" onClick={() => { handleCloseCard(); setMenuOpen(false); }}>
              <BlueShield size={28} />
              <span>KinLedger</span>
            </a>
            {isOffline && (
              <span className="offline-badge animated">
                Offline Mode
              </span>
            )}
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <button
              className="coming-up-btn"
              onClick={() => setShowVoteModal(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <span className="coming-up-text-full">Vote for what's next✨</span>
              <span className="coming-up-text-short">Vote✨</span>
            </button>
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {menuOpen && (
              <div className="menu-dropdown animated" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '1rem', width: '240px', zIndex: 99999 }}>
                <div className="menu-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Signed in as</div>
                  <span className="menu-user-email" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{userEmail}</span>
                </div>
                <SubscriptionBadge
                  plan={userPlan}
                  status={planStatus}
                  expiresAt={planExpiresAt}
                  token={token}
                  onPlanChange={(plan, status) => {
                    setPlanStatus(status);
                    showStatus('Your Family plan has been cancelled. Access continues until the end of your billing period.', 'info');
                  }}
                  onShowPaywall={() => {
                    setShowPaywall(true);
                    setMenuOpen(false);
                  }}
                />
                <hr className="menu-separator" style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <div className="menu-items" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => { setShowHelp(true); setMenuOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', padding: '6px 8px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', width: '100%', transition: 'background-color 0.2s' }}
                    className="menu-item-hover"
                  >
                    Help & FAQ
                  </button>
                  <button
                    onClick={() => { setShowPolicy('privacy'); setMenuOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', padding: '6px 8px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', width: '100%', transition: 'background-color 0.2s' }}
                    className="menu-item-hover"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => { setShowPolicy('terms'); setMenuOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', padding: '6px 8px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', width: '100%', transition: 'background-color 0.2s' }}
                    className="menu-item-hover"
                  >
                    Terms of Service
                  </button>
                  <button
                    onClick={() => { setShowPolicy('refund'); setMenuOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', padding: '6px 8px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', width: '100%', transition: 'background-color 0.2s' }}
                    className="menu-item-hover"
                  >
                    Refund Policy
                  </button>
                  <button
                    onClick={() => { setShowPolicy('contact'); setMenuOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', padding: '6px 8px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', width: '100%', transition: 'background-color 0.2s' }}
                    className="menu-item-hover"
                  >
                    Contact Us
                  </button>
                  <hr className="menu-separator" style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <button
                    className="menu-btn-logout"
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', padding: '6px 8px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                  <button
                    className="menu-btn-delete"
                    onClick={() => { handleDeleteAccount(); setMenuOpen(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', textAlign: 'left', cursor: 'pointer', padding: '6px 8px', fontSize: '0.9rem', borderRadius: 'var(--radius-sm)', width: '100%', fontWeight: '500', transition: 'background-color 0.2s' }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Sync/Status Banner notifications */}
        {statusMessage && (
          <div className={`sync-banner ${statusType === 'success' ? 'success' : ''} ${statusType === 'error' ? 'danger' : ''}`}>
            <span>{statusMessage}</span>
          </div>
        )}

        {isOverLimit && (
          <div className="overlimit-banner animated">
            <strong>⚠️ Your KinLedger Family Plan has expired.</strong>
            <span>
              Your family profiles are safe. You can still view your Emergency Medical Cards, but editing and adding profiles is temporarily unavailable because your account is above the free-plan limit.
            </span>
            <button className="btn btn-primary btn-sm" style={{ width: 'fit-content', marginTop: '4px', marginBottom: '8px' }} onClick={() => setShowPaywall(true)}>
              Renew Now
            </button>
            <span style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              Prefer the free plan? Remove profiles to return within the free limit.
            </span>
          </div>
        )}

        {showExpiryWarning && (
          <div className="expiry-warning-banner animated">
            <strong>🔔 Your Family Plan expires soon</strong>
            <span>You have {expiryDaysLeft} day{expiryDaysLeft !== 1 ? 's' : ''} left on your current Family Plan.</span>
            <button className="btn btn-primary btn-sm" style={{ width: 'fit-content', marginTop: '4px' }} onClick={() => setShowPaywall(true)}>
              Renew Early
            </button>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 1: FAMILY CARDS DASHBOARD                  */}
        {/* ============================================== */}
        {selectedCardId === null ? (
          <div className="animated">
            <div className="dashboard-title-bar">
              <div>
                <h2>Family Emergency Directory</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  Create, share, and manage emergency medical profiles for family members.
                </p>
              </div>
            </div>

            {/* Quick Access Badges Bar */}
            <div className="quick-access-bar" style={{ display: 'flex', gap: '1rem 0.75rem', flexWrap: 'wrap', padding: '0.5rem', marginBottom: '1.5rem' }}>
              {/* Add Member Badge */}
              <button 
                className="quick-access-badge add-badge"
                onClick={() => {
                  const ownedCards = cards.filter(c => !c.isShared);
                  if (userPlan !== 'family' && ownedCards.length >= 2) {
                    setShowPaywall(true);
                    return;
                  }
                  setShowAddMenu(true);
                  setShowAddMenuAtTop(true);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px dashed var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                  <Plus size={22} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>Add Member</span>
              </button>

              {/* Card Badges */}
              {cards.map(card => {
                const initials = getInitials(card.profile.fullName);
                return (
                  <button
                    key={card.id}
                    className="quick-access-badge"
                    onClick={() => {
                      setSelectedCardId(card.id);
                      setActiveTab('view');
                    }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                  >
                    <div style={{ 
                      width: '52px', 
                      height: '52px', 
                      borderRadius: '50%', 
                      border: '2px solid var(--border)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {renderMaterialAvatar(card.avatar, 22, initials)}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)', maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {card.profile.fullName ? card.profile.fullName.split(' ')[0] : card.relationship}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="dashboard-grid">
              {showAddMenu && showAddMenuAtTop && renderAddMemberForm()}

              {/* Profile Card List */}
              {cards.map(card => (
                <div
                  key={card.id}
                  className="member-summary-card"
                  onClick={() => {
                    setSelectedCardId(card.id);
                    setActiveTab('view');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="member-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      flexShrink: 0
                    }}>
                      {renderMaterialAvatar(card.avatar, 18, getInitials(card.profile.fullName))}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="member-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                          {card.profile.fullName || 'Unnamed Profile'}
                        </span>
                        {card.isShared && (
                          <span className="shared-badge" title={`Shared by ${card.ownerEmail}`} style={{ flexShrink: 0 }}>
                            Shared
                          </span>
                        )}
                      </div>
                      <div className="member-meta">
                        <span className={`relationship-badge ${getRelationBadgeClass(card.relationship)}`}>
                          {card.relationship}
                        </span>
                        {card.profile.age && <span> ·  {card.profile.age} yrs</span>}
                        {card.profile.bloodGroup && <span> ·  {card.profile.bloodGroup}</span>}
                      </div>
                    </div>
                    {/* Delete/Remove card directly from dashboard */}
                    <button
                      className="btn-icon-only danger"
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      title={card.isShared ? "Remove card from dashboard" : "Delete card"}
                      style={{ alignSelf: 'flex-start', marginTop: '2px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="member-card-body">
                    {/* Readiness Status Indicator */}
                    {(() => {
                      const readiness = getReadinessStatus(card);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.825rem', fontWeight: '600' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: readiness.color, display: 'inline-block' }}></span>
                          <span style={{ color: 'var(--text-primary)' }}>{readiness.label}</span>
                        </div>
                      );
                    })()}

                    <div>
                      <strong>Conditions:</strong>{' '}
                      {card.profile.conditions ? (
                        <span style={{ color: 'var(--text-primary)' }}>
                          {card.profile.conditions.substring(0, 50)}
                          {card.profile.conditions.length > 50 ? '...' : ''}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None added</span>
                      )}
                    </div>
                    <div>
                      <strong>Meds:</strong>{' '}
                      {card.medications.length > 0
                        ? `${card.medications.length} active medication(s)`
                        : <span style={{ color: 'var(--text-muted)' }}>None added</span>
                      }
                    </div>
                    <div>
                      <strong>Emergency Contact:</strong>{' '}
                      {card.emergencyContacts.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>None added</span>
                      ) : (
                        card.emergencyContacts.length === 1 ? '1 contact registered' : '2 contacts registered'
                      )}
                    </div>

                    {/* Last Updated Timestamp */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                      {formatLastUpdated(card.updatedAt)}
                    </div>
                  </div>

                  <div className="member-card-footer">
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isOverLimit) {
                          setShowPaywall(true);
                          return;
                        }
                        setSelectedCardId(card.id);
                        setActiveTab('edit');
                      }}
                    >
                      {getReadinessStatus(card).status === 'complete' ? 'Edit' : 'Set Up'}
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCardId(card.id);
                        setActiveTab('view');
                      }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </div>
                </div>
              ))}

              {showAddMenu && !showAddMenuAtTop ? (
                renderAddMemberForm()
              ) : (
                !showAddMenu && (
                  <button className="add-member-card" onClick={() => {
                    const ownedCards = cards.filter(c => !c.isShared);
                    if (userPlan !== 'family' && ownedCards.length >= 2) {
                      setShowPaywall(true);
                      return;
                    }
                    setShowAddMenu(true);
                    setShowAddMenuAtTop(false);
                  }}>
                    <div className="add-member-icon-wrap">
                      <Plus size={22} />
                    </div>
                    Add New Member
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          /* ============================================== */
          /* VIEW 2: SELECTED CARD SETUP WORKSPACE           */
          /* ============================================== */
          <div className="animated">
            {/* Header bar back to dashboard */}
            <div className="workspace-header">
              <div className="workspace-info">
                <button className="btn-icon-only" onClick={handleCloseCard} title="Back to Dashboard">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3>{activeCard.profile.fullName || 'New Profile'}</h3>
                    <span className={`relationship-badge ${getRelationBadgeClass(activeCard.relationship)}`}>
                      {activeCard.relationship}
                    </span>
                  </div>
                </div>
              </div>


            </div>

            {/* Sub Tabs Inside Workspace */}
            <div className="nav-tabs">
              <button
                className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => {
                  if (isOverLimit) {
                    setShowPaywall(true);
                    return;
                  }
                  setActiveTab('edit');
                }}
              >
                <Pencil size={15} />
                {getReadinessStatus(activeCard).status === 'complete' ? 'Edit' : 'Set Up'}
              </button>
              <button
                className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                <FileText size={15} />
                View Card
              </button>
            </div>

            {/* Sub Tab Content */}
            {activeTab === 'edit' && (
              <div className="section-list card">
                {/* Profile row */}
                <button className="section-row" onClick={() => setActiveSheet('profile')}>
                  <div className="section-row-left">
                    <div className="section-row-icon-wrap"><User size={18} /></div>
                    <div className="section-row-info">
                      <span className="section-row-label">Profile</span>
                      <span className="section-row-status">
                        {activeCard.profile.fullName
                          ? `${activeCard.profile.fullName}${activeCard.relationship ? ` · ${activeCard.relationship}` : ''}`
                          : 'Tap to fill in details'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="section-row-chevron" />
                </button>

                {/* Insurance row */}
                <button className="section-row" onClick={() => setActiveSheet('insurance')}>
                  <div className="section-row-left">
                    <div className="section-row-icon-wrap"><Award size={18} /></div>
                    <div className="section-row-info">
                      <span className="section-row-label">Insurance</span>
                      <span className="section-row-status">
                        {activeCard.profile.insurancePolicy || 'Not set'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="section-row-chevron" />
                </button>

                {/* Contacts row */}
                <button className="section-row" onClick={() => setActiveSheet('contacts')}>
                  <div className="section-row-left">
                    <div className="section-row-icon-wrap"><Phone size={18} /></div>
                    <div className="section-row-info">
                      <span className="section-row-label">Contacts</span>
                      <span className="section-row-status">
                        {activeCard.emergencyContacts.length > 0
                          ? activeCard.emergencyContacts.map(c => c.name).join(', ')
                          : 'None added'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="section-row-chevron" />
                </button>

                {/* Medications row */}
                <button className="section-row" onClick={() => setActiveSheet('meds')}>
                  <div className="section-row-left">
                    <div className="section-row-icon-wrap"><CapsuleIcon size={18} /></div>
                    <div className="section-row-info">
                      <span className="section-row-label">Medications</span>
                      <span className="section-row-status">
                        {activeCard.medications.length > 0
                          ? `${activeCard.medications.length} medication${activeCard.medications.length > 1 ? 's' : ''}`
                          : 'None added'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="section-row-chevron" />
                </button>

                {/* Share row */}
                <button className="section-row section-row-last" onClick={() => setActiveSheet('share')}>
                  <div className="section-row-left">
                    <div className="section-row-icon-wrap"><Users size={18} /></div>
                    <div className="section-row-info">
                      <span className="section-row-label">Share Profile Access</span>
                      <span className="section-row-status">
                        {activeCard.sharedWith && activeCard.sharedWith.length > 0
                          ? `Shared with ${activeCard.sharedWith.length}`
                          : 'Private'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="section-row-chevron" />
                </button>
              </div>
            )}


            {activeTab === 'view' && (
              <EmergencyCard
                profile={activeCard.profile}
                emergencyContacts={activeCard.emergencyContacts}
                medications={activeCard.medications}
                synced={synced}
              />
            )}
          </div>
        )}
      </main>

      {/* -- Bottom Sheet: Edit section forms -- */}
      {activeSheet !== null && selectedCardId !== null && (
        <div className="bottom-sheet-overlay" onClick={handleCloseSheet}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle-bar" />

            {/* Header */}
            <div className="bottom-sheet-header">
              <h3 className="bottom-sheet-title">
                {activeSheet === 'profile' && <><User size={18} /> Profile</>}
                {activeSheet === 'insurance' && <><Award size={18} /> Insurance</>}
                {activeSheet === 'contacts' && <><Phone size={18} /> Emergency Contacts</>}
                {activeSheet === 'meds' && <><CapsuleIcon size={18} /> Medications</>}
                {activeSheet === 'share' && <><Users size={18} /> Share Profile Access</>}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseSheet} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="bottom-sheet-content">

              {/* -- Profile -- */}
              {activeSheet === 'profile' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="bs-fullName">Name <span className="required-asterisk">*</span></label>
                    <input type="text" id="bs-fullName" name="fullName" placeholder="e.g., Aditya Kumar"
                      value={activeCard.profile.fullName} onChange={updateActiveCardProfile}
                      style={validationErrors.fullName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                    {validationErrors.fullName && <span className="field-error">{validationErrors.fullName}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="bs-age">Age</label>
                    <input type="number" id="bs-age" name="age" placeholder="e.g., 68"
                      value={activeCard.profile.age} onChange={updateActiveCardProfile}
                      style={validationErrors.age ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                    {validationErrors.age && <span className="field-error">{validationErrors.age}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="bs-bloodGroup">Blood Group</label>
                    <select id="bs-bloodGroup" name="bloodGroup" value={activeCard.profile.bloodGroup} onChange={updateActiveCardProfile}
                      style={validationErrors.bloodGroup ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                    {validationErrors.bloodGroup && <span className="field-error">{validationErrors.bloodGroup}</span>}
                  </div>
                  <div className="form-group">
                    <label>Relationship <span className="required-asterisk">*</span></label>
                    <select
                      value={['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Father-in-law', 'Mother-in-law'].includes(activeCard.relationship) ? activeCard.relationship : (activeCard.relationship ? 'Other' : '')}
                      onChange={(e) => {
                        if (e.target.value === 'Other') {
                          updateActiveCardRelationship('Other');
                        } else {
                          updateActiveCardRelationship(e.target.value);
                        }
                      }}
                      style={validationErrors.relationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                    >
                      <option value="">Select Relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father-in-law">Father-in-law</option>
                      <option value="Mother-in-law">Mother-in-law</option>
                      <option value="Other">Other / Custom...</option>
                    </select>
                    {validationErrors.relationship && <span className="field-error">{validationErrors.relationship}</span>}
                  </div>

                  {activeCard.relationship !== null && activeCard.relationship !== '' && !['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Father-in-law', 'Mother-in-law'].includes(activeCard.relationship) && (
                    <div className="form-group">
                      <label htmlFor="bs-custom-relationship">Custom Relationship <span className="required-asterisk">*</span></label>
                      <input
                        type="text"
                        id="bs-custom-relationship"
                        placeholder="e.g., Grandfather, Aunt"
                        value={activeCard.relationship === 'Other' ? '' : activeCard.relationship}
                        onChange={(e) => {
                          const val = e.target.value;
                          const clean = val.replace(/[^a-zA-Z\s\-'\.]/g, '').substring(0, 30);
                          updateActiveCardRelationship(clean === '' ? 'Other' : clean);
                        }}
                        style={validationErrors.relationship || activeCard.relationship === 'Other' ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {(validationErrors.relationship || activeCard.relationship === 'Other') && (
                        <span className="field-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: '500' }}>
                          {activeCard.relationship === 'Other' ? "Relationship is a required field." : validationErrors.relationship}
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Letters, spaces, hyphens, dots, or apostrophes only (max 30 chars).
                      </span>
                    </div>
                  )}

                  <div className="form-group full-width" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', backgroundColor: 'var(--bg-card)' }}>
                    <button
                      type="button"
                      onClick={() => setAvatarCollapsed(!avatarCollapsed)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {activeCard.avatar ? (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                            {renderMaterialAvatar(activeCard.avatar, 14)}
                          </div>
                        ) : (
                          <User size={18} />
                        )}
                        Choose Profile Avatar Icon
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{avatarCollapsed ? '▼ Expand' : '▲ Collapse'}</span>
                    </button>

                    {!avatarCollapsed && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        {[
                          {
                            groupName: 'Family (Kin)',
                            avatars: [
                              { key: 'avatar_father', label: 'Father' },
                              { key: 'avatar_mother', label: 'Mother' },
                              { key: 'avatar_me', label: 'Me' },
                              { key: 'avatar_husband', label: 'Husband/Spouse' },
                              { key: 'avatar_daughter', label: 'Daughter' },
                              { key: 'avatar_son', label: 'Son' },
                              { key: 'avatar_grandmother', label: 'Grandmother' },
                              { key: 'avatar_grandfather', label: 'Grandfather' }
                            ]
                          },
                          {
                            groupName: 'Friends',
                            avatars: [
                              { key: 'avatar_friend_male', label: 'Male Friend' },
                              { key: 'avatar_friend_female', label: 'Female Friend' },
                              { key: 'avatar_friend_close', label: 'Close Friend' },
                              { key: 'avatar_friend_best', label: 'Best Friend' },
                              { key: 'avatar_friend_work', label: 'Work Friend' },
                              { key: 'avatar_friend_neighbor', label: 'Neighbor' },
                              { key: 'avatar_friend_senior', label: 'Senior Friend' },
                              { key: 'avatar_friend_hijab', label: 'Friend (Hijab)' }
                            ]
                          },
                          {
                            groupName: 'General / Other',
                            avatars: [
                              { key: 'avatar_adult_male', label: 'Adult Male' },
                              { key: 'avatar_adult_female', label: 'Adult Female' },
                              { key: 'avatar_young_adult_male', label: 'Young Adult Male' },
                              { key: 'avatar_young_adult_female', label: 'Young Adult Female' },
                              { key: 'avatar_teen_male', label: 'Teen Male' },
                              { key: 'avatar_teen_female', label: 'Teen Female' },
                              { key: 'avatar_child_male', label: 'Child Male' },
                              { key: 'avatar_child_female', label: 'Child Female' },
                              { key: 'avatar_unknown', label: 'Unknown/Generic' }
                            ]
                          }
                        ].map(group => (
                          <div key={group.groupName}>
                            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.4rem', letterSpacing: '0.03em' }}>
                              {group.groupName}
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                              {group.avatars.map(av => (
                                <button
                                  key={av.key}
                                  type="button"
                                  onClick={() => updateActiveCardAvatar(av.key)}
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    boxShadow: activeCard.avatar === av.key ? '0 0 0 3px var(--primary), var(--shadow-md)' : 'var(--shadow-sm)',
                                    transform: activeCard.avatar === av.key ? 'scale(1.12)' : 'scale(1)',
                                    padding: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    overflow: 'visible',
                                    position: 'relative'
                                  }}
                                  title={av.label}
                                >
                                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                    {renderMaterialAvatar(av.key, 20)}
                                  </div>
                                  {activeCard.avatar === av.key && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '-2px',
                                      right: '-2px',
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--primary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#ffffff',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                      zIndex: 2
                                    }}>
                                      <Check size={10} strokeWidth={4} />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}

                        {activeCard.avatar && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => updateActiveCardAvatar('')}
                            style={{ alignSelf: 'flex-start', marginTop: '0.25rem', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Clear Avatar Icon
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="bs-conditions">Conditions (Optional)</label>
                    <textarea id="bs-conditions" name="conditions" placeholder="e.g., Type 2 Diabetes, Hypertension."
                      value={activeCard.profile.conditions} onChange={updateActiveCardProfile} rows={3} />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="bs-allergies">Allergies (Optional)</label>
                    <textarea id="bs-allergies" name="allergies" placeholder="e.g., Penicillin (Anaphylaxis), Peanuts."
                      value={activeCard.profile.allergies} onChange={updateActiveCardProfile} rows={3} />
                  </div>
                </div>
              )}

              {/* -- Insurance -- */}
              {activeSheet === 'insurance' && (
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="bs-insurancePolicy">Insurer (Optional)</label>
                    <input type="text" id="bs-insurancePolicy" name="insurancePolicy"
                      placeholder="e.g., Star Health Senior Citizens Policy"
                      value={activeCard.profile.insurancePolicy} onChange={updateActiveCardProfile} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bs-insuranceNumber">Policy / Member ID</label>
                    <input type="text" id="bs-insuranceNumber" name="insuranceNumber"
                      placeholder="e.g., POL-8849-002"
                      value={activeCard.profile.insuranceNumber} onChange={updateActiveCardProfile} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bs-insuranceValidTill">Valid Till</label>
                    <input type="text" id="bs-insuranceValidTill" name="insuranceValidTill"
                      placeholder="e.g., 12/2028"
                      value={activeCard.profile.insuranceValidTill || ''} onChange={updateActiveCardProfile} />
                  </div>
                </div>
              )}

              {/* -- Contacts -- */}
              {activeSheet === 'contacts' && (
                <div>
                  {activeCard.emergencyContacts.length > 0 ? (
                    <div className="contact-list-sheet">
                      {activeCard.emergencyContacts.map((contact, index) => (
                        editingContactIndex === index ? (
                          <div key={index} className="sheet-sub-form inline-edit-form" style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '10px', backgroundColor: 'var(--bg-app)' }}>
                            <div className="form-grid">
                              <div className="form-group">
                                <label>Name <span className="required-asterisk">*</span></label>
                                <input type="text" placeholder="e.g., Shloka Kumar" value={contact.name}
                                  onChange={e => updateActiveCardContact(index, 'name', e.target.value)}
                                  style={validationErrors[`contactName_${index}`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors[`contactName_${index}`] && <span className="field-error">{validationErrors[`contactName_${index}`]}</span>}
                              </div>
                              <div className="form-group">
                                <label>Relationship <span className="required-asterisk">*</span></label>
                                <select value={contact.relationship} onChange={e => updateActiveCardContact(index, 'relationship', e.target.value)}
                                  style={validationErrors[`contactRelationship_${index}`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>
                                  <option value="">Select</option>
                                  <option value="Daughter">Daughter</option><option value="Son">Son</option>
                                  <option value="Spouse">Spouse</option><option value="Father">Father</option>
                                  <option value="Mother">Mother</option><option value="Brother">Brother</option>
                                  <option value="Sister">Sister</option><option value="Friend">Friend</option>
                                  <option value="Guardian">Guardian</option><option value="Neighbor">Neighbor</option>
                                  <option value="Other">Other</option>
                                </select>
                                {validationErrors[`contactRelationship_${index}`] && <span className="field-error">{validationErrors[`contactRelationship_${index}`]}</span>}
                              </div>
                              <div className="form-group">
                                <label>Phone <span className="required-asterisk">*</span></label>
                                <input type="tel" placeholder="e.g., 9886012345" value={contact.phoneNumber}
                                  onChange={e => updateActiveCardContact(index, 'phoneNumber', e.target.value)}
                                  style={validationErrors[`contactPhone_${index}`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors[`contactPhone_${index}`] && <span className="field-error">{validationErrors[`contactPhone_${index}`]}</span>}
                              </div>
                              <div className="form-group">
                                <label>Email (Optional)</label>
                                <input type="email" placeholder="e.g., shloka@email.com" value={contact.email || ''}
                                  onChange={e => updateActiveCardContact(index, 'email', e.target.value)}
                                  style={validationErrors[`contactEmail_${index}`] ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                                {validationErrors[`contactEmail_${index}`] && <span className="field-error">{validationErrors[`contactEmail_${index}`]}</span>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={index} className="contact-sheet-row">
                            <div className="contact-sheet-info">
                              <div className="contact-sheet-name">{contact.name}</div>
                              <div className="contact-sheet-meta">{contact.relationship} · {contact.phoneNumber}</div>
                              {contact.email && <div className="contact-sheet-email">{contact.email}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button className="btn-icon-subtle" onClick={() => {
                                setEditingContactIndex(index);
                              }} type="button" title="Edit Contact">
                                <Pencil size={15} />
                              </button>
                              <button className="btn-icon-subtle danger-hover" onClick={() => removeContactFromActiveCard(index)} type="button" title="Delete Contact">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="item-list-empty">No contacts added yet. Use the form below.</div>
                  )}

                  <form onSubmit={addContactToActiveCard} className="sheet-sub-form">
                      <h4 className="sheet-sub-form-title">Add New Contact</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Name <span className="required-asterisk">*</span></label>
                          <input type="text" placeholder="e.g., Shloka Kumar" value={newContact.name}
                            onChange={e => updateNewContact('name', e.target.value)}
                            style={validationErrors.contactName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.contactName && <span className="field-error">{validationErrors.contactName}</span>}
                        </div>
                        <div className="form-group">
                          <label>Relationship <span className="required-asterisk">*</span></label>
                          <select value={newContact.relationship} onChange={e => updateNewContact('relationship', e.target.value)}
                            style={validationErrors.contactRelationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}>
                            <option value="">Select</option>
                            <option value="Daughter">Daughter</option><option value="Son">Son</option>
                            <option value="Spouse">Spouse</option><option value="Father">Father</option>
                            <option value="Mother">Mother</option><option value="Brother">Brother</option>
                            <option value="Sister">Sister</option><option value="Friend">Friend</option>
                            <option value="Guardian">Guardian</option><option value="Neighbor">Neighbor</option>
                            <option value="Other">Other</option>
                          </select>
                          {validationErrors.contactRelationship && <span className="field-error">{validationErrors.contactRelationship}</span>}
                        </div>
                        <div className="form-group">
                          <label>Phone <span className="required-asterisk">*</span></label>
                          <input type="tel" placeholder="e.g., 9886012345" value={newContact.phoneNumber}
                            onChange={e => updateNewContact('phoneNumber', e.target.value)}
                            style={validationErrors.contactPhone ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.contactPhone && <span className="field-error">{validationErrors.contactPhone}</span>}
                        </div>
                        <div className="form-group">
                          <label>Email (Optional)</label>
                          <input type="email" placeholder="e.g., shloka@email.com" value={newContact.email || ''}
                            onChange={e => updateNewContact('email', e.target.value)}
                            style={validationErrors.contactEmail ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}} />
                          {validationErrors.contactEmail && <span className="field-error">{validationErrors.contactEmail}</span>}
                        </div>
                        <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content' }}>
                            <Plus size={15} /> Add to List
                          </button>
                        </div>
                      </div>
                    </form>
                </div>
              )}

              {/* -- Medications -- */}
              {activeSheet === 'meds' && (
                <div>
                  {activeCard.medications.length > 0 ? (
                    <div className="contact-list-sheet">
                      {activeCard.medications.map((med, index) => (
                        editingMedIndex === index ? (
                          <div key={index} className="sheet-sub-form inline-edit-form" style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '10px', backgroundColor: 'var(--bg-app)' }}>
                            <div className="form-grid">
                              <div className="form-group">
                                <label>Med Name <span className="required-asterisk">*</span></label>
                                <input type="text" placeholder="e.g., Metformin" value={med.name}
                                  onChange={e => updateActiveCardMedication(index, 'name', e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label>Dosage</label>
                                <input type="text" placeholder="e.g., 500mg, 1 tab" value={med.dosage}
                                  onChange={e => updateActiveCardMedication(index, 'dosage', e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label>Frequency</label>
                                <select value={med.frequency} onChange={e => updateActiveCardMedication(index, 'frequency', e.target.value)}>
                                  <option value="">Select</option>
                                  <option value="Once daily (morning)">Once daily (morning)</option>
                                  <option value="Once daily (night)">Once daily (night)</option>
                                  <option value="Twice daily (morning & night)">Twice daily (morning & night)</option>
                                  <option value="Three times daily">Three times daily</option>
                                  <option value="Four times daily">Four times daily</option>
                                  <option value="Once a week">Once a week</option>
                                  <option value="Twice a week">Twice a week</option>
                                  <option value="As needed (SOS)">As needed (SOS)</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Instructions</label>
                                <input type="text" placeholder="e.g., After meals" value={med.instructions}
                                  onChange={e => updateActiveCardMedication(index, 'instructions', e.target.value)} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={index} className="contact-sheet-row">
                            <div className="contact-sheet-info">
                              <div className="contact-sheet-name">{med.name}</div>
                              <div className="contact-sheet-meta">
                                {[med.dosage, med.frequency].filter(Boolean).join(' · ')}
                              </div>
                              {med.instructions && <div className="contact-sheet-email">{med.instructions}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button className="btn-icon-subtle" onClick={() => {
                                setEditingMedIndex(index);
                              }} type="button" title="Edit Medication">
                                <Pencil size={15} />
                              </button>
                              <button className="btn-icon-subtle danger-hover" onClick={() => removeMedicationFromActiveCard(index)} type="button" title="Delete Medication">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="item-list-empty">No medications added yet.</div>
                  )}

                  <form onSubmit={addMedicationToActiveCard} className="sheet-sub-form">
                      <h4 className="sheet-sub-form-title">Add New Medication</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Med Name <span className="required-asterisk">*</span></label>
                          <input type="text" placeholder="e.g., Metformin" value={newMed.name}
                            onChange={e => setNewMed(prev => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Dosage</label>
                          <input type="text" placeholder="e.g., 500mg, 1 tab" value={newMed.dosage}
                            onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Frequency</label>
                          <select value={newMed.frequency} onChange={e => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}>
                            <option value="">Select</option>
                            <option value="Once daily (morning)">Once daily (morning)</option>
                            <option value="Once daily (night)">Once daily (night)</option>
                            <option value="Twice daily (morning & night)">Twice daily (morning & night)</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Once a week">Once a week</option>
                            <option value="Twice a week">Twice a week</option>
                            <option value="As needed (SOS)">As needed (SOS)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Instructions</label>
                          <input type="text" placeholder="e.g., After meals" value={newMed.instructions}
                            onChange={e => setNewMed(prev => ({ ...prev, instructions: e.target.value }))} />
                        </div>
                        <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content' }}>
                            <Plus size={15} /> Add to List
                          </button>
                        </div>
                      </div>
                    </form>
                </div>
              )}

              {/* -- Share -- */}
              {activeSheet === 'share' && (
                <div className="sheet-section">
                  {activeCard.isShared ? (
                    <div className="item-list-empty">
                      This profile is owned by <strong>{activeCard.ownerEmail}</strong>. Only the owner can manage sharing.
                    </div>
                  ) : (
                    <>
                      {isOverLimit ? (
                        <div className="item-list-empty" style={{ color: 'var(--danger)', border: '1px solid var(--danger-light)', backgroundColor: 'var(--danger-light)' }}>
                          Sharing is not available while your account is over the free limit. Renew your Family Plan or delete profiles to share.
                        </div>
                      ) : (
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                            Share this medical card with family members so they can view and update it jointly.
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input type="email" placeholder="Family member's email" className="form-control"
                              value={shareEmail} onChange={(e) => { setShareEmail(e.target.value); setShareError(null); }} style={{ flex: '1 1 200px', minWidth: 0 }} />
                            <button className="btn btn-primary btn-sm" onClick={handleShareCard} style={{ flexShrink: 0 }}>Share</button>
                          </div>
                        </div>
                      )}
                      
                      {shareError && (
                        <div style={{ 
                          padding: '12px', 
                          borderRadius: 'var(--radius-sm)', 
                          backgroundColor: shareError.type === 'notEnrolled' ? 'var(--warning-light)' : 'var(--danger-light)', 
                          border: `1px solid ${shareError.type === 'notEnrolled' ? 'var(--warning)' : 'var(--danger)'}`,
                          fontSize: '0.825rem',
                          color: 'var(--text-primary)',
                          marginBottom: '1.25rem',
                          lineHeight: '1.4'
                        }}>
                          {shareError.type === 'notEnrolled' ? (
                            <>
                              <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldAlert size={16} color="var(--warning)" />
                                Family member isn't on KinLedger yet.
                              </div>
                              <p style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                                They need a KinLedger account to access and update this profile. Invite them to KinLedger:
                              </p>
                              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
                                <button 
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.75rem' }}
                                  onClick={() => handleShareAppInstall(shareError.email)}
                                >
                                  <Share2 size={13} />
                                  Share App Invite Link
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldAlert size={16} color="var(--danger)" />
                                Sharing Error
                              </div>
                              <p style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{shareError.message}</p>
                            </>
                          )}
                        </div>
                      )}
                      {activeCard.sharedWith && activeCard.sharedWith.length > 0 ? (
                        <div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Shared With:</h4>
                          {activeCard.sharedWith.map(email => (
                            <div key={email} className="contact-sheet-row">
                              <div className="contact-sheet-info">
                                <div className="contact-sheet-name" style={{ fontSize: '0.9rem' }}>{email}</div>
                              </div>
                              <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }} onClick={() => handleRevokeShare(email)}>Revoke</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="item-list-empty">Private - not shared with anyone yet.</div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Footer: Save & Close */}
            <div className="bottom-sheet-footer">
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={isSaving}
                onClick={async () => {
                  const success = await handleSaveActiveCard();
                  if (success) {
                    setActiveSheet(null);
                  }
                }}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Save Footer - only when editing a card */}
      {selectedCardId !== null && activeTab === 'edit' && !isOverLimit && (
        <div className="sticky-save-footer">
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSaveActiveCard}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {/* Vote Modal Dialog */}
      {showVoteModal && (
        <div className="modal-overlay" onClick={() => setShowVoteModal(false)}>
          <div className="modal-card animated" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', margin: 0, fontSize: '1.4rem' }}>Help Shape KinLedger</h2>
              <button className="modal-close-btn" onClick={() => setShowVoteModal(false)} aria-label="Close dialog">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
                You're one of our early users. We appreciate that! Tell us which feature would make the biggest difference for your family, and we'll prioritize our next release based on your feedback.
              </p>

              {joinedWaitlist ? (
                <div className="waitlist-voted-area">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)', border: '1.5px solid rgba(15, 108, 95, 0.15)', color: 'var(--primary)', fontWeight: '600', fontSize: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎯</span>
                    <span>{UPCOMING_FEATURES.find(f => f.id === votedFeature)?.label || 'General Interest'}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    Thank you! We've recorded your vote. You can change your choice below if needed.
                  </p>
                </div>
              ) : (
                <div className="waitlist-voting-area">
                  <div className="features-checklist-grid" style={{ display: 'grid', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {UPCOMING_FEATURES.map(feature => {
                      const isChecked = selectedFeature === feature.id;
                      return (
                        <div
                          key={feature.id}
                          className={`checklist-item-card ${isChecked ? 'active' : ''}`}
                          onClick={() => handleFeatureSelect(feature.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', backgroundColor: isChecked ? 'var(--primary-light)' : 'var(--bg-card)', transition: 'all 0.2s' }}
                        >
                          <input
                            type="radio"
                            name="waitlist-feature-choice"
                            checked={isChecked}
                            onChange={() => { }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: isChecked ? '600' : '400' }}>{feature.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              {joinedWaitlist ? (
                <>
                  <button className="btn btn-outline" onClick={handleResetWaitlist}>
                    Reset Vote
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowVoteModal(false)}>
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={() => setShowVoteModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      await handleJoinWaitlist();
                      if (selectedFeature) {
                        setShowVoteModal(false);
                      }
                    }}
                  >
                    Submit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
        token={token}
        userEmail={userEmail}
      />
    </div>
  );
}
