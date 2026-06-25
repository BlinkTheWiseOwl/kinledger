const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // If VITE_API_URL environment variable is provided, use it
    if (import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Check if running inside Capacitor native webview
    const isCapacitor = !!window.Capacitor || 
                        window.location.protocol === 'file:' || 
                        (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5000');

    if (isCapacitor) {
      // Production Vercel API URL (fallback placeholder - user can change/configure)
      return 'https://kinledger.vercel.app/api';
    }

    // If running in Vite development mode (port 3000), route to the separate Express API on port 5000
    if (window.location.port === '3000') {
      const hostname = window.location.hostname || 'localhost';
      return `http://${hostname}:5000/api`;
    }
    
    // Otherwise (unified mode on port 5000, Wi-Fi IP, localtunnels, etc.), query relatively
    return '/api';
  }
  return 'http://localhost:5000/api';
};
export const BACKEND_URL = getBackendUrl();
const CARDS_STORAGE_KEY = 'elder_navigator_cards_collection';
const OLD_STORAGE_KEY = 'elder_navigator_card_data'; // for migration

// Initial migration logic: check if there's any single profile card from previous run
function performMigrationIfNecessary() {
  try {
    const oldDataRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldDataRaw) {
      const oldData = JSON.parse(oldDataRaw);
      // If it contains a name, migrate it
      if (oldData && oldData.profile && oldData.profile.fullName) {
        const migratedCard = {
          id: 'migrated-profile-' + Date.now(),
          relationship: 'Primary Profile',
          profile: oldData.profile,
          emergencyContacts: oldData.emergencyContacts || [],
          medications: oldData.medications || []
        };
        
        // Save as new array collection
        localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify([migratedCard]));
        
        // Remove old single profile key
        localStorage.removeItem(OLD_STORAGE_KEY);
        console.log('Migrated old single profile card to new family cards collection.');
      }
    }
  } catch (err) {
    console.error('Error migrating old profile:', err);
  }
}

// Load cards array: Try to load from LocalStorage first,
// then query the Node backend to update.
export async function loadCardData(token) {
  // Try migration first
  performMigrationIfNecessary();

  let localCards = [];
  
  // Read LocalStorage
  try {
    const serialized = localStorage.getItem(CARDS_STORAGE_KEY);
    if (serialized) {
      localCards = JSON.parse(serialized);
    }
  } catch (err) {
    console.error('LocalStorage cards read error:', err);
  }

  // If no auth token is provided, run only in local mode
  if (!token) {
    return { data: localCards, synced: false };
  }

  // Attempt to check if backend is online and fetch cards list
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(`${BACKEND_URL}/cards`, { 
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const serverCards = await response.json();
      
      if (Array.isArray(serverCards)) {
        // Update local cache
        localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(serverCards));
        return { data: serverCards, synced: true };
      }
    }
  } catch (err) {
    console.log('Backend cards API unreachable. Running in offline cards mode.');
  }

  return { data: localCards, synced: false };
}

// Save complete list of cards: Save locally and replicate to Node backend in background.
export async function saveCardData(cards, token) {
  if (!Array.isArray(cards)) {
    throw new Error('Data must be an array of cards.');
  }

  // 1. Write to local storage immediately
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.error('LocalStorage cards write error:', err);
    throw new Error('Failed to save cards locally.');
  }

  // If no token is provided, save local changes only
  if (!token) {
    return { success: true, synced: false };
  }

  // 2. Synchronize with the Node backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(`${BACKEND_URL}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cards),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    if (response.ok) {
      return { success: true, synced: true };
    }
  } catch (err) {
    console.warn('Backend sync failed. Changes saved locally in offline cards collection.', err);
  }

  return { success: true, synced: false };
}
