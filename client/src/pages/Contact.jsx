import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import { useSettings } from '../hooks/useSettings.jsx';
import { ErrorState } from '../components/States.jsx';

const CONTACT_EMPTY = { name: '', email: '', phone: '', message: '' };
const CUSTOM_EMPTY = {
  name: '',
  email: '',
  phone: '',
  artwork_type: '',
  preferred_size: '',
  budget: '',
  message: '',
};

export default function Contact() {
  const { settings } = useSettings();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('contact');

  useEffect(() => {
    if (params.get('tab') === 'custom') {
      setTab('custom');
    }
  }, [params]);

  const cleanPhone = settings?.whatsapp_number?.replace(/\D/g, '') || '';
  const cleanCallPhone = settings?.phone?.replace(/[^\d+]/g, '') || '';

  return (
    <div className="section py-14 md:py-20">
      <div className="max-w-2xl mx-auto text-center mb-14">
        <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">Direct Communication</p>
        <h1 className="text-4xl sm:text-5xl font-display mb-3">Connect With The Studio</h1>
        <p className="text-ink/65 text-sm sm:text-base">
          Inquire about a canvas in the gallery, discuss acquisition, or collaborate on a bespoke custom commission.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Direct Contact Info & Socials */}
        <div className="lg:col-span-5 space-y-8 bg-card border border-rule p-6 sm:p-8">
          <div>
            <h2 className="font-display text-xl mb-1 text-ink">Studio Channels</h2>
            <p className="text-xs text-ink/60">Direct touchpoints with the artist.</p>
          </div>

          <div className="space-y-4 text-sm">
            {settings?.phone && (
              <div className="flex items-start gap-3">
                <span className="text-base text-ochre-dark">📞</span>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink/50">Phone</p>
                  <a href={`tel:${cleanCallPhone}`} className="font-medium hover:text-ochre-dark">
                    {settings.phone}
                  </a>
                </div>
              </div>
            )}

            {settings?.email && (
              <div className="flex items-start gap-3">
                <span className="text-base text-ochre-dark">✉</span>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink/50">Email</p>
                  <a href={`mailto:${settings.email}`} className="font-medium hover:text-ochre-dark">
                    {settings.email}
                  </a>
                </div>
              </div>
            )}

            {cleanPhone && (
              <div className="flex items-start gap-3">
                <span className="text-base text-moss">💬</span>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink/50">WhatsApp</p>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-moss hover:underline"
                  >
                    Chat on WhatsApp (+{cleanPhone})
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Social Platforms */}
          <div className="pt-6 border-t border-rule space-y-3">
            <p className="text-xs uppercase tracking-widest text-ink/50 font-medium">
              Social Portfolios
            </p>
            <div className="flex flex-col gap-2.5">
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline !py-2.5 text-xs flex items-center justify-between"
                >
                  <span>Follow on Instagram</span>
                  <span>↗</span>
                </a>
              )}
              {settings?.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline !py-2.5 text-xs flex items-center justify-between"
                >
                  <span>Watch on YouTube</span>
                  <span>↗</span>
                </a>
              )}
            </div>
          </div>

          <div className="bg-paper p-4 border border-rule/60 text-xs text-ink/70">
            <p className="font-semibold text-ink mb-1">Studio Visits by Appointment</p>
            <p>For collectors wishing to view works in person, please contact in advance to arrange a studio appointment.</p>
          </div>
        </div>

        {/* Right Column: Forms Tabbed Interface */}
        <div className="lg:col-span-7">
          <div className="flex border-b border-rule mb-8">
            <button
              onClick={() => setTab('contact')}
              className={`pb-4 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === 'contact'
                  ? 'border-ink text-ink font-semibold'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              General Message
            </button>
            <button
              onClick={() => setTab('custom')}
              className={`pb-4 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === 'custom'
                  ? 'border-ink text-ink font-semibold'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              Want a Custom Painting?
            </button>
          </div>

          {tab === 'contact' ? <ContactForm /> : <CustomForm />}
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState(CONTACT_EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post('/contact', form);
      setResult(data.message);
      setForm(CONTACT_EMPTY);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="border border-moss/40 bg-moss/10 p-8 text-center space-y-3">
        <span className="text-3xl text-moss">✓</span>
        <h3 className="font-display text-xl text-ink">Message Sent Successfully</h3>
        <p className="text-sm text-ink/75">{result}</p>
        <button
          onClick={() => setResult(null)}
          className="btn-outline text-xs mt-4"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Your Name *</label>
          <input
            className="input"
            required
            placeholder="e.g. Ananya Roy"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email Address *</label>
          <input
            className="input"
            type="email"
            required
            placeholder="e.g. ananya@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Phone Number (Optional)</label>
        <input
          className="input"
          placeholder="For faster WhatsApp or phone response"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Your Message *</label>
        <textarea
          className="input"
          rows={5}
          required
          placeholder="Ask a question about a painting, frame recommendations, shipping rates, or artwork details…"
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
        />
      </div>

      {error && <ErrorState message={error} />}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary py-3.5 px-8 text-sm font-semibold tracking-wider uppercase"
      >
        {submitting ? 'Sending Message…' : 'Send Message'}
      </button>
    </form>
  );
}

function CustomForm() {
  const [form, setForm] = useState(CUSTOM_EMPTY);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFile(e) {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      if (file) body.append('reference_image', file);

      const { data } = await api.post('/custom-requests', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.message);
      setForm(CUSTOM_EMPTY);
      setFile(null);
      setFilePreview(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="border border-moss/40 bg-moss/10 p-8 text-center space-y-3">
        <span className="text-3xl text-moss">🎨</span>
        <h3 className="font-display text-xl text-ink">Custom Art Request Received!</h3>
        <p className="text-sm text-ink/75">{result}</p>
        <p className="text-xs text-ink/60">
          The artist will personally review your ideas and reference photos, then contact you to discuss canvas sizing and color palettes.
        </p>
        <button
          onClick={() => setResult(null)}
          className="btn-outline text-xs mt-4"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card/60 p-4 border border-rule text-xs text-ink/75 mb-4">
        ✨ <strong>Custom Commission Workflow:</strong> Share your concept or reference image. The artist reviews feasibility, provides a quote & timeline, and shares in-progress photos during creation!
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Full Name *</label>
          <input
            className="input"
            required
            placeholder="e.g. Vikram Mehta"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email Address *</label>
          <input
            className="input"
            type="email"
            required
            placeholder="e.g. vikram@example.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Phone / WhatsApp Number *</label>
          <input
            className="input"
            required
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Preferred Artwork Type</label>
          <input
            className="input"
            placeholder="Portrait, Landscape, Abstract, Spiritual…"
            value={form.artwork_type}
            onChange={(e) => update('artwork_type', e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label">Desired Size / Dimensions</label>
          <input
            className="input"
            placeholder="e.g. 24 x 36 inches, or 3 x 4 feet"
            value={form.preferred_size}
            onChange={(e) => update('preferred_size', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Estimated Budget (Optional)</label>
          <input
            className="input"
            placeholder="e.g. ₹10,000 - ₹25,000"
            value={form.budget}
            onChange={(e) => update('budget', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Description & Vision *</label>
        <textarea
          className="input"
          rows={4}
          required
          placeholder="Describe your subject, preferred color scheme, atmosphere, or any special personal meaning…"
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
        />
      </div>

      <div>
        <label className="label">Reference Image (Optional photo to paint from)</label>
        <input
          className="input !py-2"
          type="file"
          accept="image/*"
          onChange={handleFile}
        />
        {filePreview && (
          <div className="mt-3 relative w-24 h-24 border border-rule">
            <img src={filePreview} alt="Reference Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {error && <ErrorState message={error} />}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary py-3.5 px-8 text-sm font-semibold tracking-wider uppercase"
      >
        {submitting ? 'Submitting Request…' : 'REQUEST CUSTOM ART'}
      </button>
    </form>
  );
}
