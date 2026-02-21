import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Modal, FormGroup, EmptyState, Spinner } from '../components/UI';
import { useToast } from '../hooks/useToast';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ vehicle_id:'', trip_id:'', expense_type:'Fuel', liters:'', cost:'', expense_date: new Date().toISOString().slice(0,10) });
  const { show, Toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([api.getExpenses(), api.getVehicles()])
      .then(([e, v]) => { setExpenses(e); setVehicles(v); })
      .catch(err => show(err.message,'err'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.createExpense({ ...form, liters: parseFloat(form.liters)||0, cost: parseFloat(form.cost) });
      setModal(false); load(); show('⛽ Expense logged!');
    } catch (e) { show(e.message,'err'); }
    finally { setSaving(false); }
  };

  // Metrics
  const totalFuel = expenses.filter(e=>e.expense_type==='Fuel').reduce((s,e)=>s+parseFloat(e.cost),0);
  const totalOps  = expenses.reduce((s,e)=>s+parseFloat(e.cost),0);
  const totalL    = expenses.filter(e=>e.expense_type==='Fuel').reduce((s,e)=>s+parseFloat(e.liters||0),0);

  // Per-vehicle totals
  const vTotals = {};
  expenses.forEach(e => { vTotals[e.vehicle_id] = (vTotals[e.vehicle_id]||0) + parseFloat(e.cost); });

  return (
    <>
      {Toast}
      <div className="metric-grid">
        {[
          { val:`₹${totalFuel.toLocaleString()}`, lbl:'Total Fuel Cost' },
          { val:`₹${totalOps.toLocaleString()}`,  lbl:'Total Operational Cost', style:{background:'linear-gradient(90deg,var(--mint),var(--sky))'} },
          { val:`${totalL.toLocaleString()} L`,    lbl:'Total Fuel Consumed',   style:{background:'linear-gradient(90deg,var(--violet),var(--sky))'} },
          { val:expenses.length,                   lbl:'Total Records',         style:{background:'linear-gradient(90deg,var(--amber),var(--rose))'} },
        ].map(m => (
          <div key={m.lbl} className="metric-box">
            <div className="metric-val" style={m.style ? {background:m.style.background,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'} : {}}>{m.val}</div>
            <div className="metric-lbl">{m.lbl}</div>
          </div>
        ))}
      </div>

      <div className="filter-row">
        <input className="search-inp" placeholder="🔍 Search..." />
        <button className="btn btn-grd btn-sm" onClick={() => setModal(true)}>+ Log Expense</button>
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title">⛽ Fuel & Expense Records</div>
          <button className="btn btn-ghost btn-sm">⬇ Export CSV</button>
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Vehicle</th><th>Trip</th><th>Liters</th><th>Cost</th><th>Type</th><th>Total Ops Cost</th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td>{e.expense_date?.slice?.(0,10)}</td>
                    <td className="fw7">{e.vehicle_name}</td>
                    <td><span className="mono" style={{fontSize:11,color:'var(--violet)'}}>{e.trip_code||'—'}</span></td>
                    <td>{parseFloat(e.liters)>0?<span className="mono">{e.liters}L</span>:'—'}</td>
                    <td><span className="mono c-a">₹{parseFloat(e.cost).toLocaleString()}</span></td>
                    <td><span className={`bdg ${e.expense_type==='Fuel'?'bdg-s':e.expense_type==='Toll'?'bdg-a':'bdg-v'}`}>{e.expense_type}</span></td>
                    <td><span className="mono c-m fw7">₹{(vTotals[e.vehicle_id]||0).toLocaleString()}</span></td>
                  </tr>
                ))}
                {!expenses.length && <tr><td colSpan={7}><EmptyState icon="⛽" message="No expenses logged" /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="⛽ Log Expense"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-grd" onClick={save} disabled={saving}>{saving?'Saving...':'Log Expense'}</button>
        </>}
      >
        <FormGroup label="Vehicle">
          <select className="input" value={form.vehicle_id} onChange={e=>setForm(f=>({...f,vehicle_id:e.target.value}))}>
            <option value="">— Select —</option>
            {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </FormGroup>
        <div className="g2">
          <FormGroup label="Trip ID (optional)"><input className="input" value={form.trip_id} onChange={e=>setForm(f=>({...f,trip_id:e.target.value}))} placeholder="TRIP-001" /></FormGroup>
          <FormGroup label="Type">
            <select className="input" value={form.expense_type} onChange={e=>setForm(f=>({...f,expense_type:e.target.value}))}>
              {['Fuel','Toll','Driver Allowance','Other'].map(t=><option key={t}>{t}</option>)}
            </select>
          </FormGroup>
        </div>
        <div className="g2">
          <FormGroup label="Liters (if fuel)"><input className="input" type="number" value={form.liters} onChange={e=>setForm(f=>({...f,liters:e.target.value}))} placeholder="e.g. 45" /></FormGroup>
          <FormGroup label="Cost (₹)"><input className="input" type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="e.g. 4050" /></FormGroup>
        </div>
        <FormGroup label="Date"><input className="input" type="date" value={form.expense_date} onChange={e=>setForm(f=>({...f,expense_date:e.target.value}))} /></FormGroup>
      </Modal>
    </>
  );
}
