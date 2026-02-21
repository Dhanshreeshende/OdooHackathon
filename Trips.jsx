// ─── TRIPS PAGE ───────────────────────────────────────────
import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { StatusPill, Modal, FormGroup, EmptyState, Spinner } from '../components/UI';
import { useToast } from '../hooks/useToast';

const EMPTY_T = { vehicle_id:'', driver_id:'', origin:'', destination:'', cargo_weight_kg:'', distance_km:'' };

export default function Trips() {
  const [trips, setTrips]       = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusF, setStatusF]   = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY_T);
  const [capWarn, setCapWarn]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const { show, Toast }         = useToast();

  const load = () => {
    setLoading(true);
    api.getTrips({ status: statusF })
      .then(setTrips).catch(e => show(e.message,'err')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusF]);

  const openModal = async () => {
    const [veh, drv] = await Promise.all([api.getVehicles({status:'Available'}), api.getAvailDrivers()]);
    setVehicles(veh); setDrivers(drv); setModal(true);
  };

  const checkCap = (cargoVal, vId) => {
    const v = vehicles.find(v => v.id === (vId || form.vehicle_id));
    setCapWarn(v && parseInt(cargoVal) > parseInt(v.max_load_capacity_kg));
  };

  const save = async () => {
    if (capWarn) return show('Cargo exceeds vehicle capacity!', 'err');
    setSaving(true);
    try {
      await api.createTrip({ ...form, cargo_weight_kg: parseInt(form.cargo_weight_kg), distance_km: parseInt(form.distance_km)||0 });
      setModal(false); setForm(EMPTY_T); load();
      show('✅ Trip dispatched!');
    } catch (e) { show(e.message, 'err'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patchTrip(id, { status });
      setTrips(prev => prev.map(t => t.id === id ? {...t, status} : t));
      show(`Trip → ${status}`);
    } catch (e) { show(e.message, 'err'); }
  };

  return (
    <>
      {Toast}
      <div className="filter-row">
        <select value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Draft</option><option>Dispatched</option><option>Completed</option><option>Cancelled</option>
        </select>
        <button className="btn btn-grd btn-sm" onClick={openModal}>+ Create Trip</button>
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title">📦 Trip Management</div>
          <span className="bdg bdg-s">{trips.length} Trips</span>
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Trip ID</th><th>Vehicle</th><th>Driver</th><th>Route</th><th>Cargo</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {trips.map(t => (
                  <tr key={t.id}>
                    <td><span className="mono c-v fw7">{t.trip_code}</span></td>
                    <td>{t.vehicle_name || '—'}</td>
                    <td>{t.driver_name || '—'}</td>
                    <td style={{fontSize:12,color:'var(--text2)'}}>{t.origin} → {t.destination}</td>
                    <td><span className="mono">{t.cargo_weight_kg?.toLocaleString()} kg</span></td>
                    <td><StatusPill status={t.status} /></td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        {t.status==='Draft' && <button className="btn btn-grd btn-sm" onClick={()=>updateStatus(t.id,'Dispatched')}>Dispatch</button>}
                        {t.status==='Dispatched' && <button className="btn btn-success btn-sm" onClick={()=>updateStatus(t.id,'Completed')}>Complete</button>}
                        {(t.status==='Draft'||t.status==='Dispatched') && <button className="btn btn-danger btn-sm" onClick={()=>updateStatus(t.id,'Cancelled')}>Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!trips.length && <tr><td colSpan={7}><EmptyState icon="📦" message="No trips found" /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="📦 Create New Trip"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-grd" onClick={save} disabled={saving}>{saving?'Creating...':'Dispatch Trip'}</button>
        </>}
      >
        <FormGroup label="Select Vehicle (Available)">
          <select className="input" value={form.vehicle_id} onChange={e => { setForm(f=>({...f,vehicle_id:e.target.value})); checkCap(form.cargo_weight_kg, e.target.value); }}>
            <option value="">— Select —</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.max_load_capacity_kg}kg)</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Select Driver">
          <select className="input" value={form.driver_id} onChange={e => setForm(f=>({...f,driver_id:e.target.value}))}>
            <option value="">— Select —</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} – {d.license_category}</option>)}
          </select>
        </FormGroup>
        <div className="g2">
          <FormGroup label="Origin"><input className="input" value={form.origin} onChange={e=>setForm(f=>({...f,origin:e.target.value}))} placeholder="e.g. Mumbai Warehouse" /></FormGroup>
          <FormGroup label="Destination"><input className="input" value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} placeholder="e.g. Pune Hub" /></FormGroup>
        </div>
        <div className="g2">
          <FormGroup label="Cargo (kg)"><input className="input" type="number" value={form.cargo_weight_kg} onChange={e=>{setForm(f=>({...f,cargo_weight_kg:e.target.value}));checkCap(e.target.value);}} placeholder="e.g. 450" /></FormGroup>
          <FormGroup label="Distance (km)"><input className="input" type="number" value={form.distance_km} onChange={e=>setForm(f=>({...f,distance_km:e.target.value}))} placeholder="e.g. 148" /></FormGroup>
        </div>
        {capWarn && <div className="warn-txt">⚠️ Cargo exceeds vehicle max capacity!</div>}
      </Modal>
    </>
  );
}
