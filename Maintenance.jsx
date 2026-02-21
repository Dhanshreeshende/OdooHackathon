import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { StatusPill, Modal, FormGroup, EmptyState, Spinner } from '../components/UI';
import { useToast } from '../hooks/useToast';

export default function Maintenance() {
  const [logs, setLogs]         = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ vehicle_id:'', service_type:'Oil Change', cost:'', mechanic_name:'', service_date: new Date().toISOString().slice(0,10), notes:'' });
  const { show, Toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([api.getMaintenance(), api.getVehicles()])
      .then(([m, v]) => { setLogs(m); setVehicles(v); })
      .catch(e => show(e.message,'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.createMaint({ ...form, cost: parseFloat(form.cost) });
      setModal(false); load();
      show('🔧 Service logged! Vehicle moved to In Shop.', 'warn');
    } catch (e) { show(e.message, 'err'); }
    finally { setSaving(false); }
  };

  const complete = async (id) => {
    try {
      await api.completeMaint(id);
      load(); show('✅ Service completed! Vehicle now Available.');
    } catch (e) { show(e.message,'err'); }
  };

  return (
    <>
      {Toast}
      <div className="filter-row">
        <input className="search-inp" placeholder="🔍 Search logs..." />
        <button className="btn btn-grd btn-sm" onClick={() => setModal(true)}>+ Add Service Log</button>
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title">🔧 Service & Maintenance Logs</div></div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Vehicle</th><th>Service</th><th>Cost</th><th>Mechanic</th><th>Status</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {logs.map(m => (
                  <tr key={m.id}>
                    <td>{m.service_date?.slice?.(0,10)}</td>
                    <td className="fw7">{m.vehicle_name}</td>
                    <td>{m.service_type}</td>
                    <td><span className="mono c-a">₹{parseFloat(m.cost).toLocaleString()}</span></td>
                    <td>{m.mechanic_name}</td>
                    <td><StatusPill status={m.status} /></td>
                    <td style={{fontSize:12,color:'var(--muted)',maxWidth:160}}>{m.notes}</td>
                    <td>{m.status==='In Progress' && <button className="btn btn-success btn-sm" onClick={()=>complete(m.id)}>Complete</button>}</td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan={8}><EmptyState icon="🔧" message="No maintenance logs" /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="🔧 Log Service"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-amber" onClick={save} disabled={saving}>{saving?'Saving...':'Log Service'}</button>
        </>}
      >
        <FormGroup label="Vehicle">
          <select className="input" value={form.vehicle_id} onChange={e=>setForm(f=>({...f,vehicle_id:e.target.value}))}>
            <option value="">— Select —</option>
            {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </FormGroup>
        <div className="g2">
          <FormGroup label="Service Type">
            <select className="input" value={form.service_type} onChange={e=>setForm(f=>({...f,service_type:e.target.value}))}>
              {['Oil Change','Tyre Replacement','Brake Service','Engine Overhaul','AC Repair','Body Work'].map(s=><option key={s}>{s}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Date"><input className="input" type="date" value={form.service_date} onChange={e=>setForm(f=>({...f,service_date:e.target.value}))} /></FormGroup>
        </div>
        <div className="g2">
          <FormGroup label="Cost (₹)"><input className="input" type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="e.g. 5000" /></FormGroup>
          <FormGroup label="Mechanic"><input className="input" value={form.mechanic_name} onChange={e=>setForm(f=>({...f,mechanic_name:e.target.value}))} placeholder="e.g. AutoTech" /></FormGroup>
        </div>
        <FormGroup label="Notes"><textarea className="input" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Additional details..." /></FormGroup>
      </Modal>
    </>
  );
}
