const CREDENTIALS_KEY = 'tplink-credentials';

export interface TPLinkCredentials {
  email: string;
  password: string;
}

// Get saved credentials from localStorage
export function getCredentials(): TPLinkCredentials | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    if (!data) return null;
    
    const credentials = JSON.parse(data) as TPLinkCredentials;
    if (!credentials.email || !credentials.password) return null;
    
    return credentials;
  } catch {
    return null;
  }
}

// Save credentials to localStorage
export function saveCredentials(credentials: TPLinkCredentials): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

// Clear credentials from localStorage
export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CREDENTIALS_KEY);
}

// Check if credentials are saved
export function hasCredentials(): boolean {
  return getCredentials() !== null;
}





