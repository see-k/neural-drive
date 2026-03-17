import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface APIKeys {
    geminiApiKey: string;
    geminiModel: string;
    elevenLabsApiKey: string;
    elevenLabsVoiceId: string;
    googleMapsApiKey: string;
    cesiumIonToken: string;
}

interface APIKeysContextType {
    keys: APIKeys;
    setKeys: (keys: Partial<APIKeys>) => void;
    isConfigured: boolean;
    clearKeys: () => void;
}

const defaultKeys: APIKeys = {
    geminiApiKey: '',
    geminiModel: 'gemini-3-flash-preview',
    elevenLabsApiKey: '',
    elevenLabsVoiceId: '',
    googleMapsApiKey: '',
    cesiumIonToken: '',
};

const APIKeysContext = createContext<APIKeysContextType | null>(null);

const STORAGE_KEY = 'neural-dive-api-keys';

export const APIKeysProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [keys, setKeysState] = useState<APIKeys>(() => {
        // Try to load from localStorage on init
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...defaultKeys, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load API keys from storage');
        }

        // Fall back to environment variables (for development)
        return {
            geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
            geminiModel: 'gemini-3-flash-preview',
            elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
            elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '',
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
            cesiumIonToken: process.env.CESIUM_ION_TOKEN || '',
        };
    });

    // Save to localStorage whenever keys change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
        } catch (e) {
            console.warn('Failed to save API keys to storage');
        }
    }, [keys]);

    const setKeys = (newKeys: Partial<APIKeys>) => {
        setKeysState(prev => ({ ...prev, ...newKeys }));
    };

    const clearKeys = () => {
        setKeysState(defaultKeys);
        localStorage.removeItem(STORAGE_KEY);
    };

    // Check if minimum required keys are configured
    const isConfigured = Boolean(keys.geminiApiKey);

    return (
        <APIKeysContext.Provider value={{ keys, setKeys, isConfigured, clearKeys }}>
            {children}
        </APIKeysContext.Provider>
    );
};

export const useAPIKeys = (): APIKeysContextType => {
    const context = useContext(APIKeysContext);
    if (!context) {
        throw new Error('useAPIKeys must be used within an APIKeysProvider');
    }
    return context;
};

// Export a function to get current keys (for use in services)
export const getStoredAPIKeys = (): APIKeys => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...defaultKeys, ...JSON.parse(stored) };
            }
        }
    } catch (e) {
        console.warn('Failed to retrieve API keys:', e);
    }

    return {
        geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
        geminiModel: 'gemini-3-flash-preview',
        elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
        elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        cesiumIonToken: process.env.CESIUM_ION_TOKEN || '',
    };
};
