import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

const DEFAULTS = {
  artist_name: 'The Artist',
  artist_bio: '',
  profile_image: '',
  phone: '',
  email: '',
  whatsapp_number: '',
  instagram_url: '',
  youtube_url: '',
  website_logo: '',
  hero_heading: 'Art That Tells a Story',
  hero_description: 'Original paintings created with passion, detail and imagination.',
  footer_text: '',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    try {
      const { data } = await api.get('/settings');
      setSettings({ ...DEFAULTS, ...data.settings });
    } catch {
      // fall back to defaults silently — site should still render
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
