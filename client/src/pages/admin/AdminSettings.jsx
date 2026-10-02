import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../../services/api';
import { useSettings } from '../../hooks/useSettings.jsx';
import { Loader, ErrorState } from '../../components/States.jsx';
import { getImageUrl } from '../../utils/imageUrl';

export default function AdminSettings() {
  const { settings, loaded, refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loaded && settings) {
      setForm(settings);
      setProfilePreview(settings.profile_image || null);
      setLogoPreview(settings.website_logo || null);
    }
  }, [loaded, settings]);

  if (!form) return <Loader />;

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleProfileChange(e) {
    const f = e.target.files[0];
    setProfileFile(f);
    if (f) setProfilePreview(URL.createObjectURL(f));
  }

  function handleLogoChange(e) {
    const f = e.target.files[0];
    setLogoFile(f);
    if (f) setLogoPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          body.append(k, v);
        }
      });
      if (profileFile) body.append('profile_image', profileFile);
      if (logoFile) body.append('website_logo', logoFile);

      await api.put('/settings', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 pb-4 border-b border-rule">
        <h1 className="text-2xl font-display">Website Settings</h1>
        <p className="text-xs text-ink/60 mt-1">
          Customize your artist identity, contact channels, hero copy, and branding without editing code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Artist Profile & Bio */}
        <div className="bg-card border border-rule p-6 space-y-4 shadow-sm">
          <h2 className="font-display text-lg text-ink">Artist Identity</h2>
          <div>
            <label className="label">Artist Full Name *</label>
            <input
              className="input"
              required
              value={form.artist_name || ''}
              onChange={(e) => update('artist_name', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Artist Biography</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Tell collectors about your journey, inspiration, and medium…"
              value={form.artist_bio || ''}
              onChange={(e) => update('artist_bio', e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="label">Artist Profile Photo</label>
              <input
                className="input !py-1.5 text-xs bg-white"
                type="file"
                accept="image/*"
                onChange={handleProfileChange}
              />
              {profilePreview && (
                <div className="mt-2 w-20 h-24 border border-rule overflow-hidden">
                  <img src={getImageUrl(profilePreview)} alt="Profile" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="label">Website Logo / Signature Mark</label>
              <input
                className="input !py-1.5 text-xs bg-white"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
              {logoPreview && (
                <div className="mt-2 h-16 w-32 border border-rule p-1 bg-paper flex items-center justify-center">
                  <img src={getImageUrl(logoPreview)} alt="Logo" className="max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Channels */}
        <div className="bg-card border border-rule p-6 space-y-4 shadow-sm">
          <h2 className="font-display text-lg text-ink">Direct Contact & Socials</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Public Phone Number</label>
              <input
                className="input"
                placeholder="+91 9876543210"
                value={form.phone || ''}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Public Studio Email</label>
              <input
                className="input"
                type="email"
                placeholder="studio@example.com"
                value={form.email || ''}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">WhatsApp Number (with country code)</label>
              <input
                className="input"
                placeholder="e.g. 919876543210"
                value={form.whatsapp_number || ''}
                onChange={(e) => update('whatsapp_number', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Instagram Profile URL</label>
              <input
                className="input"
                placeholder="https://instagram.com/with_sk.2"
                value={form.instagram_url || ''}
                onChange={(e) => update('instagram_url', e.target.value)}
              />
            </div>
            <div>
              <label className="label">YouTube Channel URL</label>
              <input
                className="input"
                placeholder="https://youtube.com/..."
                value={form.youtube_url || ''}
                onChange={(e) => update('youtube_url', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Homepage Hero Copy */}
        <div className="bg-card border border-rule p-6 space-y-4 shadow-sm">
          <h2 className="font-display text-lg text-ink">Homepage Hero Showcase</h2>
          <div>
            <label className="label">Hero Headline</label>
            <input
              className="input font-display text-base"
              placeholder="Art That Lives Beyond The Canvas"
              value={form.hero_heading || ''}
              onChange={(e) => update('hero_heading', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Hero Subheading</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Original artworks created with emotion, detail and imagination."
              value={form.hero_description || ''}
              onChange={(e) => update('hero_description', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Website Footer Tagline</label>
            <input
              className="input text-xs"
              placeholder="Original handcrafted fine art. Each piece signed and certified."
              value={form.footer_text || ''}
              onChange={(e) => update('footer_text', e.target.value)}
            />
          </div>
        </div>

        {error && <ErrorState message={error} />}
        {saved && (
          <div className="p-4 bg-moss/10 border border-moss/30 text-moss text-xs font-semibold">
            ✓ Settings successfully saved! All customer pages are updated.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary py-3.5 px-8 text-sm font-semibold tracking-wider uppercase"
        >
          {submitting ? 'Saving Settings…' : 'SAVE SETTINGS'}
        </button>
      </form>
    </div>
  );
}
