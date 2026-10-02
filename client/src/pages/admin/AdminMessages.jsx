import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Loader, EmptyState } from '../../components/States.jsx';
import { formatDate } from '../../utils/format';

const STATUSES = ['UNREAD', 'READ', 'REPLIED'];

export default function AdminMessages() {
  const [messages, setMessages] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  function load() {
    api.get('/contact')
      .then((r) => setMessages(r.data.messages))
      .catch(() => setMessages([]));
  }

  useEffect(load, []);

  async function setStatus(id, status) {
    try {
      await api.put(`/contact/${id}/status`, { status });
      load();
    } catch (e) {
      alert('Could not update status: ' + (e.response?.data?.error || e.message));
    }
  }

  const filtered = messages?.filter((m) => {
    if (!statusFilter) return true;
    return m.status === statusFilter;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-rule">
        <div>
          <h1 className="text-2xl font-display">Customer Contact Messages</h1>
          <p className="text-xs text-ink/60 mt-1">
            General inquiries submitted through the public Contact page form.
          </p>
        </div>

        {/* Filter */}
        <select
          className="input !py-1.5 text-xs w-auto self-start sm:self-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Messages</option>
          <option value="UNREAD">Unread Only</option>
          <option value="READ">Read</option>
          <option value="REPLIED">Replied</option>
        </select>
      </div>

      {messages === null ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No messages found."
          description={statusFilter ? `No ${statusFilter.toLowerCase()} messages.` : 'New contact form messages will appear here.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((m) => {
            const cleanPhone = m.phone?.replace(/\D/g, '') || '';
            const isUnread = m.status === 'UNREAD';
            return (
              <div
                key={m.id}
                className={`border p-6 shadow-sm transition-colors space-y-3 ${
                  isUnread
                    ? 'border-ochre/60 bg-white ring-1 ring-ochre/30'
                    : 'border-rule bg-card/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-medium text-base text-ink">
                        {m.name}
                      </span>
                      {isUnread && (
                        <span className="text-[10px] bg-ochre-dark text-paper px-2 py-0.5 font-bold uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/60">
                      Email: <a href={`mailto:${m.email}`} className="text-ink underline">{m.email}</a>
                      {m.phone && (
                        <> · Phone: <a href={`tel:${m.phone}`} className="text-ink underline">{m.phone}</a></>
                      )}
                      <span> · {formatDate(m.created_at)}</span>
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] text-ink/50 uppercase tracking-wider">Status:</span>
                    <select
                      className={`text-xs py-1 px-2.5 border rounded font-medium ${
                        m.status === 'UNREAD'
                          ? 'bg-ochre/15 text-ochre-dark border-ochre/30 font-semibold'
                          : m.status === 'REPLIED'
                          ? 'bg-moss/10 text-moss border-moss/30'
                          : 'bg-white text-ink border-rule'
                      }`}
                      value={m.status}
                      onChange={(e) => setStatus(m.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-paper/80 p-4 border border-rule/50 text-xs sm:text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                  {m.message}
                </div>

                {/* Direct Action Contacts */}
                <div className="flex flex-wrap gap-3 pt-1 text-xs">
                  <a
                    href={`mailto:${m.email}?subject=Reply from Studio regarding your message&body=${encodeURIComponent(`Dear ${m.name},\n\nThank you for reaching out.\n\n`)}`}
                    onClick={() => {
                      if (m.status === 'UNREAD') setStatus(m.id, 'REPLIED');
                    }}
                    className="btn-primary !py-1.5 !px-3 font-medium text-xs inline-flex items-center gap-1.5"
                  >
                    <span>✉</span> Reply via Email
                  </a>

                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${m.name}, thank you for contacting me through my artist website.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        if (m.status === 'UNREAD') setStatus(m.id, 'REPLIED');
                      }}
                      className="btn bg-moss text-paper border-moss hover:bg-moss/90 !py-1.5 !px-3 font-medium text-xs inline-flex items-center gap-1.5"
                    >
                      <span>💬</span> Reply on WhatsApp
                    </a>
                  )}

                  {isUnread && (
                    <button
                      onClick={() => setStatus(m.id, 'READ')}
                      className="btn-outline !py-1.5 !px-3 font-medium text-xs"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
