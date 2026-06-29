import React, { useState, useEffect } from 'react';
import { Shield, FileText, Plus, Trash2, Save, User, Heart, ShieldAlert, Award, Phone, ArrowLeft, Printer, Eye, Share2, LogOut, Menu, X } from 'lucide-react';
import { loadCardData, saveCardData, BACKEND_URL } from './utils/storage';
import EmergencyCard from './components/EmergencyCard';
import AuthScreen from './components/AuthScreen';
import PolicyPage from './components/PolicyPage';
import HelpPage from './components/HelpPage';

const BlueShield = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22V2Z" fill="#60a5fa"/>
    <path d="M12 2V22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" fill="#2563eb"/>
    <path d="M12 2C12 2 14.5 3 19 3V11C19 16.5 15.5 20.5 12 22C8.5 20.5 5 16.5 5 11V3C9.5 3 12 2 12 2Z" stroke="#d4af37" strokeWidth="1.5" strokeLinejoin="round"/>
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

export default function App() {
  // Session states
  const [token, setToken] = useState(localStorage.getItem('kinledger_jwt_token'));
  const [userEmail, setUserEmail] = useState(localStorage.getItem('kinledger_user_email'));

  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null); // null = Dashboard view
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'view' for the selected card
  
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' or 'info' or 'error'
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  // New UX States
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPolicy, setShowPolicy] = useState(null); // 'privacy' | 'terms' | null
  const [showHelp, setShowHelp] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
  const [votedFeature, setVotedFeature] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Sharing field state
  const [shareEmail, setShareEmail] = useState('');

  // Dashboard state for adding a new member
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [customRelation, setCustomRelation] = useState('');

  // Temp contact and medication forms state (local to selected card workspace)
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phoneNumber: '', email: '' });
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', instructions: '' });

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
      }
      setSynced(isSynced);
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
        } catch (e) {}
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

  // Clear local contact and medication input fields when switching cards or adding members
  useEffect(() => {
    setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
    setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
  }, [selectedCardId]);

  const showStatus = (message, type = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  };

  // Get readiness status of a card profile
  const getReadinessStatus = (card) => {
    if (!card) return { status: 'incomplete', label: 'Emergency Profile Incomplete', color: '#ef4444' };
    const { profile, emergencyContacts = [], medications = [] } = card;
    const { fullName, age, bloodGroup, conditions, allergies, insurancePolicy, insuranceNumber } = profile || {};
    
    // Red: if missing primary details or contacts/medications
    if (!fullName || !age || !bloodGroup || !conditions || !allergies || emergencyContacts.length === 0 || medications.length === 0) {
      return {
        status: 'incomplete',
        label: 'Emergency Profile Incomplete',
        color: '#ef4444'
      };
    }
    
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
        if (!rel || rel.trim() === '') {
          errors.relationship = "Relationship is required.";
        } else if (containsUnsafeChars(rel)) {
          errors.relationship = "Relationship cannot contain unsafe characters (<, >, \\, `).";
        }
        
        // 3. Age
        const ageVal = activeUpdate.profile.age;
        if (ageVal === undefined || ageVal === null || String(ageVal).trim() === '') {
          errors.age = "Age is required.";
        } else {
          const ageNum = Number(ageVal);
          if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
            errors.age = "Age must be an integer between 0 and 130.";
          }
        }
        
        // 4. Blood Group
        const bg = activeUpdate.profile.bloodGroup || '';
        if (!bg || bg.trim() === '') {
          errors.bloodGroup = "Blood Group is required.";
        }
        
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
          if (containsUnsafeChars(contact.name)) {
            errors[`contactName_${idx}`] = `Emergency Contact #${idx + 1} Name cannot contain unsafe characters (<, >, \\, \`).`;
          }
          if (containsUnsafeChars(contact.email)) {
            errors[`contactEmail_${idx}`] = `Emergency Contact #${idx + 1} Email cannot contain unsafe characters (<, >, \\, \`).`;
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
          return; // Abort saving!
        }
      }
    }

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
      } else {
        showStatus(`Save failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showStatus('Error saving cards data.', 'error');
    }
  };

  // Add a new profile card
  const handleCreateCard = (relation) => {
    if (!relation) return;
    
    const newCard = {
      id: 'card-' + Date.now(),
      relationship: relation,
      profile: {
        fullName: '',
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
    saveCollection(updated);
    
    // Jump straight to editing this new card
    setSelectedCardId(newCard.id);
    setActiveTab('edit');
    setShowAddMenu(false);
    setCustomRelation('');
    showStatus(`New card created for ${relation}.`, 'success');
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
          showStatus('Error revoking shared card access.', 'error');
        }
      } else {
        saveCollection(updated);
        showStatus('Emergency card deleted.', 'info');
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
          copy.age = "Age is required.";
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
        if (!value || value.trim() === '') {
          copy.bloodGroup = "Blood Group is required.";
        } else {
          delete copy.bloodGroup;
        }
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
    if (!selectedCardId || !value) return;

    setValidationErrors(prev => {
      const copy = { ...prev };
      if (!value || value.trim() === '') {
        copy.relationship = "Relationship is required.";
      } else {
        delete copy.relationship;
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

  // Add contact to selected card
  const addContactToActiveCard = (e) => {
    e.preventDefault();
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

    if (activeCard.emergencyContacts.length >= 2) {
      showStatus('Emergency contacts are limited to 2 per card.', 'error');
      return;
    }

    const updated = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          emergencyContacts: [...c.emergencyContacts, { ...newContact }]
        };
      }
      return c;
    });

    setCards(updated);
    setNewContact({ name: '', relationship: '', phoneNumber: '', email: '' });
    
    // Clear contact errors
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy.contactName;
      delete copy.contactRelationship;
      delete copy.contactPhone;
      delete copy.contactEmail;
      return copy;
    });

    showStatus('Emergency contact added (unsaved). Click Save.', 'info');
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
    showStatus('Emergency contact removed (unsaved). Click Save.', 'info');
  };

  // Add medication to selected card
  const addMedicationToActiveCard = (e) => {
    e.preventDefault();
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
        return {
          ...c,
          medications: [...c.medications, { ...newMed }]
        };
      }
      return c;
    });

    setCards(updated);
    setNewMed({ name: '', dosage: '', frequency: '', instructions: '' });
    showStatus('Medication added (unsaved). Click Save.', 'info');
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
    showStatus('Medication removed (unsaved). Click Save.', 'info');
  };

  // Manual trigger to save current active states
  const handleSaveActiveCard = async () => {
    await saveCollection(cards);
  };

  // Share Card Handler
  const handleShareCard = async () => {
    if (!shareEmail) return;
    const cleanEmail = shareEmail.toLowerCase().trim();
    
    if (cleanEmail === userEmail) {
      showStatus("You cannot share a card with yourself.", "error");
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
        throw new Error(data.error || 'Failed to share card.');
      }

      showStatus(`Card successfully shared with ${cleanEmail}!`, 'success');
      setShareEmail('');
      
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
      showStatus(err.message, 'error');
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
    showStatus("Logged out successfully.", "info");
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
        <div className="onboarding-card animated">
          <div className="onboarding-slides">
            {onboardingSlide === 0 && (
              <div className="onboarding-slide animated">
                <div className="onboarding-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', marginBottom: '1.5rem' }}>
                  <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="rgba(239, 68, 68, 0.03)" />
                    <circle cx="100" cy="100" r="60" fill="rgba(239, 68, 68, 0.06)" />
                    <path d="M30 100H60L72 65L88 135L104 80L116 120L128 100H170" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M100 40C100 40 120 47 150 47V105C150 145 125 170 100 180C75 170 50 145 50 105V47C80 47 100 40 100 40Z" fill="url(#shieldGrad)" stroke="#d4af37" strokeWidth="3" strokeLinejoin="round" />
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
                <p>Keep your loved one's essential medical information ready—so you're never scrambling when every second matters.</p>
              </div>
            )}
            {onboardingSlide === 1 && (
              <div className="onboarding-slide animated">
                <div className="onboarding-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', marginBottom: '1.5rem' }}>
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
                <div className="onboarding-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', marginBottom: '1.5rem' }}>
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

  return (
    <div className="app-container">
      {/* Header Banner */}
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a href="#" className="logo" onClick={() => { setSelectedCardId(null); setMenuOpen(false); }}>
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
                    border: 'none'
                  }}
                >
                  Coming Up Next ✨
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

            <div className="dashboard-grid">
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
                  <div className="member-card-header">
                    <div>
                      <div className="member-name">
                        {card.profile.fullName || 'Unnamed Profile'}
                        {card.isShared && (
                          <span className="shared-badge" title={`Shared by ${card.ownerEmail}`}>
                            Shared
                          </span>
                        )}
                      </div>
                      <div className="member-meta">
                        <span className={`relationship-badge ${getRelationBadgeClass(card.relationship)}`}>
                          {card.relationship}
                        </span>
                        {card.profile.age && <span>• {card.profile.age} yrs</span>}
                        {card.profile.bloodGroup && <span>• {card.profile.bloodGroup}</span>}
                      </div>
                    </div>
                    {/* Delete/Remove card directly from dashboard */}
                    <button 
                      className="btn-icon-only danger" 
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      title={card.isShared ? "Remove card from dashboard" : "Delete card"}
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
                        <span style={{ color: 'var(--text-muted)' }}>None listed</span>
                      )}
                    </div>
                    <div>
                      <strong>Meds:</strong>{' '}
                      {card.medications.length > 0 
                        ? `${card.medications.length} active medication(s)` 
                        : <span style={{ color: 'var(--text-muted)' }}>None listed</span>
                      }
                    </div>
                    <div>
                      <strong>Emergency Contact:</strong>{' '}
                      {card.emergencyContacts.length === 0 && (
                        <span style={{ color: 'var(--text-muted)' }}>No contacts registered</span>
                      )}
                      {card.emergencyContacts.length === 1 && '1 contact registered'}
                      {card.emergencyContacts.length === 2 && '2 contacts registered'}
                    </div>

                    {/* Last Updated Timestamp */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                      {formatLastUpdated(card.updatedAt)}
                    </div>
                  </div>
 
                  <div className="member-card-footer">
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCardId(card.id);
                        setActiveTab('edit');
                      }}
                    >
                      {getReadinessStatus(card).status === 'complete' ? 'Edit Profile' : 'Complete Profile'}
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCardId(card.id);
                        setActiveTab('view');
                      }}
                    >
                      <Eye size={14} /> Open Card
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Member Button Card */}
              {!showAddMenu ? (
                <button className="add-member-card" onClick={() => setShowAddMenu(true)}>
                  <div className="add-member-icon-wrap">
                    <Plus size={24} />
                  </div>
                  Add Family Member
                </button>
              ) : (
                <div className="member-summary-card" style={{ borderStyle: 'solid', borderColor: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', height: '100%' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'var(--font-title)' }}>
                      Select Relationship
                    </div>
                    <select 
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          // keep menu open, let user input custom relation
                        } else {
                          handleCreateCard(e.target.value);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Choose relationship...</option>
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
                    {customRelation !== null && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <input 
                          type="text" 
                          placeholder="e.g., Grandfather, Aunt" 
                          value={customRelation}
                          onChange={(e) => setCustomRelation(e.target.value)}
                        />
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCreateCard(customRelation || 'Family Member')}
                        >
                          Confirm
                        </button>
                      </div>
                    )}

                    <button 
                      className="btn btn-danger btn-sm" 
                      style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                      onClick={() => {
                        setShowAddMenu(false);
                        setCustomRelation('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
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
                <button className="btn-icon-only" onClick={() => setSelectedCardId(null)} title="Back to Dashboard">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3>{activeCard.profile.fullName || 'New Profile'}</h3>
                    <span className={`relationship-badge ${getRelationBadgeClass(activeCard.relationship)}`}>
                      {activeCard.relationship}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Selected Card Setup Workspace
                  </span>
                </div>
              </div>
              
              <div className="workspace-actions">
                <button className="btn btn-secondary" onClick={() => setSelectedCardId(null)}>
                  Dashboard
                </button>
                <button className="btn btn-primary" onClick={handleSaveActiveCard}>
                  <Save size={18} />
                  Save Card Information
                </button>
              </div>
            </div>

            {/* Sub Tabs Inside Workspace */}
            <div className="nav-tabs">
              <button 
                className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                <User size={16} />
                {getReadinessStatus(activeCard).status === 'complete' ? 'Edit Profile' : 'Complete Profile'}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
                onClick={() => setActiveTab('view')}
              >
                <FileText size={16} />
                View & Share Printable Card
              </button>
            </div>

            {/* Sub Tab Content */}
            {activeTab === 'edit' && (
              <div>
                {/* Profile Form */}
                <div className="card">
                  <h3 className="card-title">
                    <User size={20} className="text-primary" />
                    1. Card Profile Details
                  </h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        name="fullName" 
                        placeholder="e.g., Ramachandra Gowda"
                        value={activeCard.profile.fullName} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.fullName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {validationErrors.fullName && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.fullName}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="age">Age</label>
                      <input 
                        type="number" 
                        id="age" 
                        name="age" 
                        placeholder="e.g., 68"
                        value={activeCard.profile.age} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.age ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {validationErrors.age && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.age}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="bloodGroup">Blood Group</label>
                      <select 
                        id="bloodGroup" 
                        name="bloodGroup" 
                        value={activeCard.profile.bloodGroup} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.bloodGroup ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      {validationErrors.bloodGroup && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.bloodGroup}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Relationship Tag</label>
                      <select 
                        value={activeCard.relationship} 
                        onChange={(e) => updateActiveCardRelationship(e.target.value)}
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
                        <option value="Other">Other</option>
                      </select>
                      {validationErrors.relationship && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.relationship}
                        </span>
                      )}
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="conditions">Medical Conditions / Diagnosis (Optional)</label>
                      <textarea 
                        id="conditions" 
                        name="conditions" 
                        placeholder="e.g., Type 2 Diabetes, Hypertension. Undergoing treatment."
                        value={activeCard.profile.conditions} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.conditions ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {validationErrors.conditions && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.conditions}
                        </span>
                      )}
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="allergies">Critical Allergies (Optional)</label>
                      <textarea 
                        id="allergies" 
                        name="allergies" 
                        placeholder="e.g., Penicillin (Anaphylaxis), Peanuts."
                        value={activeCard.profile.allergies} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.allergies ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {validationErrors.allergies && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.allergies}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Insurance Form */}
                <div className="card">
                  <h3 className="card-title">
                    <Award size={20} className="text-primary" />
                    2. Insurance Card details
                  </h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="insurancePolicy">Insurance Policy / Issuer Name (Optional)</label>
                      <input 
                        type="text" 
                        id="insurancePolicy" 
                        name="insurancePolicy" 
                        placeholder="e.g., Star Health Senior Citizens Policy"
                        value={activeCard.profile.insurancePolicy} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.insurancePolicy ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {validationErrors.insurancePolicy && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.insurancePolicy}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="insuranceNumber">Policy Number / Member ID (Optional)</label>
                      <input 
                        type="text" 
                        id="insuranceNumber" 
                        name="insuranceNumber" 
                        placeholder="e.g., POL-8849-002"
                        value={activeCard.profile.insuranceNumber} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.insuranceNumber ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {validationErrors.insuranceNumber && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.insuranceNumber}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="insuranceValidTill">Valid Till / Expiry Date</label>
                      <input 
                        type="text" 
                        id="insuranceValidTill" 
                        name="insuranceValidTill" 
                        placeholder="e.g., 12/2028 or Dec 2028"
                        value={activeCard.profile.insuranceValidTill || ''} 
                        onChange={updateActiveCardProfile}
                        style={validationErrors.insuranceValidTill ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                      />
                      {validationErrors.insuranceValidTill && (
                        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                          {validationErrors.insuranceValidTill}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="card">
                  <h3 className="card-title">
                    <Phone size={20} className="text-primary" />
                    3. Emergency Contacts ({activeCard.emergencyContacts.length}/2)
                  </h3>

                  {activeCard.emergencyContacts.length > 0 ? (
                    <div>
                      {activeCard.emergencyContacts.map((contact, index) => (
                        <div key={index} className="item-row item-row-contact" style={{ gridTemplateColumns: '1.5fr 1fr 2fr auto' }}>
                          <div>
                            <strong>{contact.name}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Name</div>
                          </div>
                          <div>
                            <strong>{contact.relationship}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Relationship</div>
                          </div>
                          <div>
                            <strong>{contact.phoneNumber}</strong>
                            {contact.email && <div style={{ fontSize: '0.85rem', color: 'var(--primary)', wordBreak: 'break-all' }}>{contact.email}</div>}
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contact Info</div>
                          </div>
                          <button className="btn btn-danger btn-sm" onClick={() => removeContactFromActiveCard(index)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="item-list-empty">
                      No emergency contacts registered yet. Please add up to 2 contacts below.
                    </div>
                  )}

                  {activeCard.emergencyContacts.length < 2 && (
                    <form onSubmit={addContactToActiveCard} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Add Emergency Contact</h4>
                      <div className="form-grid" style={{ gap: '1rem' }}>
                        <div className="form-group">
                          <label>Contact Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Sunitha Gowda" 
                            value={newContact.name}
                            onChange={e => updateNewContact('name', e.target.value)}
                            style={validationErrors.contactName ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                          />
                          {validationErrors.contactName && (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                              {validationErrors.contactName}
                            </span>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Relationship</label>
                          <select 
                            value={newContact.relationship}
                            onChange={e => updateNewContact('relationship', e.target.value)}
                            style={validationErrors.contactRelationship ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                          >
                            <option value="">Select Relationship</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Son">Son</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Friend">Friend</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Neighbor">Neighbor</option>
                            <option value="Other">Other</option>
                          </select>
                          {validationErrors.contactRelationship && (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                              {validationErrors.contactRelationship}
                            </span>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input 
                            type="tel" 
                            placeholder="e.g., 9886012345" 
                            value={newContact.phoneNumber}
                            onChange={e => updateNewContact('phoneNumber', e.target.value)}
                            style={validationErrors.contactPhone ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                          />
                          {validationErrors.contactPhone && (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                              {validationErrors.contactPhone}
                            </span>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Email Address (Optional)</label>
                          <input 
                            type="email" 
                            placeholder="e.g., sunitha@email.com" 
                            value={newContact.email || ''}
                            onChange={e => updateNewContact('email', e.target.value)}
                            style={validationErrors.contactEmail ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-light)' } : {}}
                          />
                          {validationErrors.contactEmail && (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' }}>
                              {validationErrors.contactEmail}
                            </span>
                          )}
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content' }}>
                            <Plus size={16} /> Add Contact
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Medications Section */}
                <div className="card">
                  <h3 className="card-title">
                    <Heart size={20} className="text-primary" />
                    4. Medications List
                  </h3>

                  {activeCard.medications.length > 0 ? (
                    <div>
                      {activeCard.medications.map((med, index) => (
                        <div key={index} className="item-row">
                          <div>
                            <strong>{med.name}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Name</div>
                          </div>
                          <div>
                            <strong>{med.dosage}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dosage</div>
                          </div>
                          <div>
                            <strong>{med.frequency}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Frequency</div>
                          </div>
                          <div>
                            <strong>{med.instructions || 'None'}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Instructions</div>
                          </div>
                          <button className="btn btn-danger btn-sm" onClick={() => removeMedicationFromActiveCard(index)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="item-list-empty">
                      No medications documented. Add chronic medications below.
                    </div>
                  )}

                  <form onSubmit={addMedicationToActiveCard} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Add Chronic Medication</h4>
                    <div className="form-grid" style={{ gap: '1rem' }}>
                      <div className="form-group">
                        <label>Medication Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Metformin" 
                          value={newMed.name}
                          onChange={e => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Dosage (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g., 500mg, 1 tab" 
                          value={newMed.dosage}
                          onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Frequency (Optional)</label>
                        <select 
                          value={newMed.frequency}
                          onChange={e => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}
                        >
                          <option value="">Select Frequency</option>
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
                        <label>Instructions (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g., After meals" 
                          value={newMed.instructions}
                          onChange={e => setNewMed(prev => ({ ...prev, instructions: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content' }}>
                          <Plus size={16} /> Add Medication
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Collaborative Joint Sharing Section */}
                <div className="card">
                  <h3 className="card-title">
                    <Share2 size={20} className="text-primary" />
                    5. Share Card with Family
                  </h3>
                  
                  {activeCard.isShared ? (
                    <div className="item-list-empty" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
                      This profile is owned by <strong>{activeCard.ownerEmail}</strong>. 
                      Only the owner can manage sharing permissions for this card.
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                        Share this medical card with family members' email addresses. They will be able to view and update details jointly on their dashboards.
                      </p>
                      
                      <div className="share-input-group">
                        <input 
                          type="email" 
                          placeholder="family.member@email.com" 
                          value={shareEmail} 
                          onChange={(e) => setShareEmail(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={handleShareCard}>
                          Add Share
                        </button>
                      </div>

                      {activeCard.sharedWith && activeCard.sharedWith.length > 0 ? (
                        <div>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Currently Shared With:</h4>
                          <div className="shares-list">
                            {activeCard.sharedWith.map(email => (
                              <div key={email} className="item-row" style={{ gridTemplateColumns: '1fr auto', padding: '0.5rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{email}</span>
                                <button className="btn btn-danger btn-sm" onClick={() => handleRevokeShare(email)}>
                                  Revoke
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="item-list-empty">
                          This card is private. Share with family to enable collaborative editing.
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                            onChange={() => {}}
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
    </div>
  );
}
