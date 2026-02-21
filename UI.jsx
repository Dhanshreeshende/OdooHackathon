// ── StatusPill ────────────────────────────────────────────
const STATUS_CLASS = {
  'Available': 'available', 'On Trip': 'on-trip', 'In Shop': 'in-shop', 'Retired': 'retired',
  'Dispatched': 'dispatched', 'Completed': 'completed', 'Cancelled': 'cancelled', 'Draft': 'draft',
  'On Duty': 'on-duty', 'Off Duty': 'off-duty', 'Suspended': 'suspended', 'In Progress': 'in-progress',
};

export function StatusPill({ status }) {
  const cls = STATUS_CLASS[status] || 'draft';
  return <span className={`pill p-${cls}`}>{status}</span>;
}

// ── Badge ─────────────────────────────────────────────────
export function Badge({ children, variant = 'v' }) {
  return <span className={`bdg bdg-${variant}`}>{children}</span>;
}

// ── ScoreRing ─────────────────────────────────────────────
export function ScoreRing({ score }) {
  const cls = score >= 90 ? 'ring-g' : score >= 75 ? 'ring-y' : 'ring-r';
  return <div className={`score-ring ${cls}`}>{score}</div>;
}

// ── EmptyState ────────────────────────────────────────────
export function EmptyState({ icon = '📭', message = 'No records found' }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--muted)' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>{icon}</div>
      <p style={{ fontSize:14 }}>{message}</p>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'40px' }}>
      <div className="loader" />
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="m-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="m-head">
          <div className="m-title">{title}</div>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">{children}</div>
        {footer && <div className="m-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ── FormGroup ─────────────────────────────────────────────
export function FormGroup({ label, children }) {
  return (
    <div className="form-g">
      <label>{label}</label>
      {children}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }) {
  return (
    <div className="tgl-wrap">
      <label className="tgl">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="tgl-sl" />
      </label>
      {label && <span style={{ fontSize:11, color:'var(--muted)' }}>{label}</span>}
    </div>
  );
}

// ── DriverAvatar ──────────────────────────────────────────
export function DriverAvatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';
  return <div className="drv-av">{initials}</div>;
}
