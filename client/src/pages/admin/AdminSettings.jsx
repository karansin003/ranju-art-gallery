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
    const f = e.target.files?.[0];
    if (f) {
      setProfileFile(f);
      setProfilePreview(URL.createObjectURL(f));
    }
  }

  function handleLogoChange(e) {
    const f = e.target.files?.[0];
    if (f) {
      setLogoFile(f);
      setLogoPreview(URL.createObjectURL(f));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'profile_image') {
          if (!profileFile) {
            body.append('profile_image', v || '');
          }
        } else if (k === 'website_logo') {
          if (!logoFile) {
            body.append('website_logo', v || '');
          }
        } else if (v !== undefined && v !== null) {
          body.append(k, v);
        }
      });
      if (profileFile) body.append('profile_image', profileFile);
      if (logoFile) body.append('website_logo', logoFile);

      await api.put('/settings', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refresh();
      setProfileFile(null);
      setLogoFile(null);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8 pb-4 border-b border-rule">
        <h1 className="text-2xl font-display">Website Settings</h1>
        <p className="text-xs text-ink/60 mt-1">
          Customize your artist identity, About page photo, contact channels, hero copy, and branding without editing code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* About Page Artist Photo Showcase */}
        <div className="bg-card border border-rule p-6 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-rule">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-ochre/10 border border-ochre/25 text-ochre-dark text-[11px] font-semibold uppercase tracking-wider mb-1">
                Featured On /about Page & Homepage
              </div>
              <h2 className="font-display text-lg text-ink">About Page Artist Photo</h2>
              <p className="text-xs text-ink/70">
                This portrait appears directly on your public <span className="font-semibold text-ink">/about</span> page and the artist biography section.
              </p>
            </div>
            <a
              href="/about"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-ochre-dark hover:underline flex items-center gap-1"
            >
              View /about page ↗
            </a>
          </div>

          <div className="grid sm:grid-cols-12 gap-6 items-start">
            {/* Live 4:5 Preview Card (Matches /about frame) */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/60 mb-2">
                Live 4:5 Frame Preview
              </span>
              <div className="w-full max-w-[210px] border border-rule bg-card p-3 shadow-lg">
                {profilePreview || form.profile_image ? (
                  <div className="relative">
                    <img
                      src={profileFile ? profilePreview : getImageUrl(form.profile_image)}
                      alt="Artist About Preview"
                      className="w-full aspect-[4/5] object-cover"
                    />
                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-moss font-semibold uppercase tracking-wider">
                        ✓ Photo Active
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[4/5] bg-ink/10 flex flex-col items-center justify-center p-4 text-center text-ink/40">
                    <span className="font-display text-lg mb-1 text-ink/70">
                      {form.artist_name || 'Ranju Art Gallery'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest">Fine Art Studio</span>
                    <span className="text-[9px] text-ink/40 mt-3 italic">(Default placeholder)</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-ink/50 mt-2 text-center max-w-[200px]">
                Matches the exact frame visitors see on your About page
              </span>
            </div>

            {/* Upload Controls */}
            <div className="sm:col-span-7 space-y-4">
              {/* Option 1: File Upload */}
              <div className="p-4 border border-rule bg-paper space-y-2">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Option 1: Upload Photo From Device
                </label>
                <p className="text-[11px] text-ink/65">
                  Choose a portrait from your computer or phone (JPG, PNG, WEBP). It will be permanently stored on Cloudinary.
                </p>
                <input
                  id="about-photo-file"
                  className="input !py-1.5 text-xs bg-white cursor-pointer"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleProfileChange}
                />
                {profileFile && (
                  <p className="text-[11px] text-moss font-medium">
                    ✓ Selected file: <span className="font-semibold">{profileFile.name}</span> (Click "SAVE SETTINGS" below to apply)
                  </p>
                )}
              </div>

              {/* Option 2: Image URL */}
              <div className="p-4 border border-rule bg-paper space-y-2">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Option 2: Direct Image URL
                </label>
                <p className="text-[11px] text-ink/65">
                  Or paste a direct image URL if hosted on Cloudinary, Imgur, or another image host:
                </p>
                <input
                  className="input text-xs"
                  placeholder="https://res.cloudinary.com/... or https://..."
                  value={form.profile_image || ''}
                  onChange={(e) => {
                    setProfileFile(null);
                    update('profile_image', e.target.value);
                    setProfilePreview(e.target.value || null);
                  }}
                />
              </div>

              {/* Reset / Remove action */}
              {(profilePreview || form.profile_image) && (
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileFile(null);
                      setProfilePreview(null);
                      update('profile_image', '');
                      const fileInput = document.getElementById('about-photo-file');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="text-xs text-terracotta hover:underline font-medium flex items-center gap-1"
                  >
                    🗑 Remove Photo (Revert to Studio Monogram)
                  </button>
                  {profileFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileFile(null);
                        setProfilePreview(settings?.profile_image || null);
                        const fileInput = document.getElementById('about-photo-file');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="text-xs text-ink/60 hover:underline"
                    >
                      Cancel file selection
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Artist Identity & Bio */}
        <div className="bg-card border border-rule p-6 space-y-4 shadow-sm">
          <h2 className="font-display text-lg text-ink">Artist Identity & Bio</h2>
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

          <div className="pt-2 border-t border-rule space-y-3">
            <label className="label">Website Logo / Signature Mark</label>
            <div className="flex flex-wrap items-center gap-4">
              <input
                id="website-logo-file"
                className="input !py-1.5 text-xs bg-white max-w-xs"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
              {logoPreview && (
                <div className="h-14 w-28 border border-rule p-1 bg-paper flex items-center justify-center">
                  <img src={getImageUrl(logoPreview)} alt="Logo" className="max-h-full object-contain" />
                </div>
              )}
              {form.website_logo && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                    update('website_logo', '');
                    const fileInput = document.getElementById('website-logo-file');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="text-xs text-terracotta hover:underline"
                >
                  Remove Logo
                </button>
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
                placeholder="https://www.instagram.com/ranju_creators"
                value={form.instagram_url || ''}
                onChange={(e) => update('instagram_url', e.target.value)}
              />
            </div>
            <div>
              <label className="label">YouTube Channel URL</label>
              <input
                className="input"
                placeholder="https://www.youtube.com/@ranju_craft_creater"
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
