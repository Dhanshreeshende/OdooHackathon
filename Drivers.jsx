import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { StatusPill, ScoreRing, DriverAvatar, Modal, FormGroup, EmptyState, Spinner } from '../components/UI';
import { useToast } from '../hooks/useToast';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ full_name:'', license_number:'', license_expiry:'', license_category:'Van', phone:'' });
  const { show, Toast }       = useToast();

  const load = () => {
    setLoading(true);
    api.getDrivers().then(setDrivers).catch(e=>show(e.message,'err')).finally(()=>setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.createDriver(form);
      setModal(false); load(); show('✅ Driver added. License valid.');
    } catch (e) { show(e.message,'err'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patchDriver(id, { status });
      setDrivers(prev => prev.map(d => d.id===id ? {...d,status} : d));
      show(`Driver status → ${status}`, status==='Suspended'?'err':'ok');
    } catch (e) { show(e.message,'err'); }
  };

  return (
    <>
      {Toast}
      <div className="filter-row">
        <input className="search-inp" placeholder="🔍 Search drivers..." />
        <select>
          <option value="">All Statuses</option>
          <option>On Duty</option><option>Off Duty</option><option>Suspended</option>
        </select>
        <button className="btn btn-grd btn-sm" onClick={() => setModal(true)}>+ Add Driver</button>
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title">👤 Driver Safety & Performance</div></div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Driver</th><th>License</th><th>Expiry</th><th>Category</th><th>Trips</th><th>Score</th><th>Status</th><th>Change</th></tr></thead>
              <tbody>
                {drivers.map(d => {
                  const exp = d.license_expired;
                  const soon = d.license_expiring_soon;
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <DriverAvatar name={d.full_name} />
                          <div>
                            <div className="fw7">{d.full_name}</div>
                            <div style={{fontSize:11,color:'var(--muted)'}}>{d.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="mono" style={{fontSize:11}}>{d.license_number}</span></td>
                      <td>
                        <div style={{fontSize:13,fontWeight:600,color:exp?'var(--coral)':soon?'var(--amber)':'inherit'}}>
                          {d.license_expiry?.slice?.(0,10)}
                        </div>
                        {exp && <span className="bdg bdg-r">EXPIRED</span>}
                        {!exp && soon && <span className="bdg bdg-a">Expiring Soon</span>}
                      </td>
                      <td><span className="bdg bdg-v">{d.license_category}</span></td>
                      <td><span className="mono fw7">{d.trips_completed}</span></td>
                      <td><ScoreRing score={d.safety_score} /></td>
                      <td><StatusPill status={d.status} /></td>
                      <td>
                        <select
                          value={d.status}
                          onChange={e => updateStatus(d.id, e.target.value)}
                          style={{background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 10px',color:'var(--text)',fontFamily:'Outfit,sans-serif',fontSize:12,outline:'none',cursor:'pointer'}}
                        >
                          <option>On Duty</option>
                          <option>Off Duty</option>
                          <option>Suspended</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {!drivers.length && <tr><td colSpan={8}><EmptyState icon="👤" message="No drivers found" /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="👤 Add Driver"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-grd" onClick={save} disabled={saving}>{saving?'Adding...':'Add Driver'}</button>
        </>}
      >
        <FormGroup label="Full Name"><input className="input" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} placeholder="e.g. Alex Kumar" /></FormGroup>
        <div className="g2">
          <FormGroup label="License Number"><input className="input" value={form.license_number} onChange={e=>setForm(f=>({...f,license_number:e.target.value}))} placeholder="MH0320200012345" /></FormGroup>
          <FormGroup label="License Expiry"><input className="input" type="date" value={form.license_expiry} onChange={e=>setForm(f=>({...f,license_expiry:e.target.value}))} /></FormGroup>
        </div>
        <div className="g2">
          <FormGroup label="Category">
            <select className="input" value={form.license_category} onChange={e=>setForm(f=>({...f,license_category:e.target.value}))}>
              {['Truck','Van','Bike','All'].map(c=><option key={c}>{c}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Phone"><input className="input" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+91 98765 43210" /></FormGroup>
        </div>
      </Modal>
    </>
  );
}
