import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { StatusPill, Toggle, Modal, FormGroup, EmptyState, Spinner } from '../components/UI';
import { useToast } from '../hooks/useToast';

const EMPTY = { name:'', license_plate:'', vehicle_type:'Van', region:'North', max_load_capacity_kg:'', odometer_km:'', acquisition_cost:'' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeF, setTypeF]       = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const { show, Toast }         = useToast();

  const load = () => {
    setLoading(true);
    api.getVehicles({ search, type: typeF })
      .then(setVehicles).catch(e => show(e.message,'err')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, typeF]);

  const save = async () => {
    setSaving(true);
    try {
      await api.createVehicle({ ...form, max_load_capacity_kg: parseInt(form.max_load_capacity_kg), odometer_km: parseInt(form.odometer_km)||0, acquisition_cost: parseFloat(form.acquisition_cost)||0 });
      setModal(false); setForm(EMPTY); load();
      show('✅ Vehicle added successfully!');
    } catch (e) { show(e.message, 'err'); }
    finally { setSaving(false); }
  };

  const toggleRetired = async (v) => {
    const newStatus = v.status === 'Retired' ? 'Available' : 'Retired';
    try {
      await api.patchVehicle(v.id, { status: newStatus });
      setVehicles(prev => prev.map(x => x.id === v.id ? {...x, status: newStatus} : x));
      show(`${v.name} → ${newStatus}`);
    } catch (e) { show(e.message, 'err'); }
  };

  return (
    <>
      {Toast}
      <div className="filter-row">
        <input className="search-inp" placeholder="🔍 Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option value="">All Types</option>
          <option>Truck</option><option>Van</option><option>Bike</option>
        </select>
        <button className="btn btn-grd btn-sm" onClick={() => setModal(true)}>+ Add Vehicle</button>
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title">🚛 Vehicle Registry</div>
          <span className="bdg bdg-v">{vehicles.length} Vehicles</span>
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Vehicle</th><th>Plate</th><th>Type</th>
                <th>Max Load</th><th>Odometer</th><th>Status</th><th>Retire</th>
              </tr></thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td><div className="fw7">{v.name}</div><div style={{fontSize:11,color:'var(--muted)'}}>{v.vehicle_type} · {v.region}</div></td>
                    <td><span className="mono c-v">{v.license_plate}</span></td>
                    <td><span className={`bdg ${v.vehicle_type==='Truck'?'bdg-a':v.vehicle_type==='Van'?'bdg-s':'bdg-g'}`}>{v.vehicle_type}</span></td>
                    <td><span className="mono">{parseInt(v.max_load_capacity_kg).toLocaleString()} kg</span></td>
                    <td><span className="mono">{parseInt(v.odometer_km).toLocaleString()} km</span></td>
                    <td><StatusPill status={v.status} /></td>
                    <td><Toggle checked={v.status==='Retired'} onChange={() => toggleRetired(v)} label="Retired" /></td>
                  </tr>
                ))}
                {!vehicles.length && <tr><td colSpan={7}><EmptyState icon="🚛" message="No vehicles found" /></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="🚛 Add New Vehicle"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-grd" onClick={save} disabled={saving}>{saving?'Adding...':'Add Vehicle'}</button>
        </>}
      >
        <div className="g2">
          <FormGroup label="Vehicle Name / Model"><input className="input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Tata Ace – Van-05" /></FormGroup>
          <FormGroup label="License Plate"><input className="input" value={form.license_plate} onChange={e => setForm(f=>({...f,license_plate:e.target.value}))} placeholder="MH-01-AB-1234" /></FormGroup>
        </div>
        <div className="g2">
          <FormGroup label="Type"><select className="input" value={form.vehicle_type} onChange={e => setForm(f=>({...f,vehicle_type:e.target.value}))}><option>Truck</option><option>Van</option><option>Bike</option></select></FormGroup>
          <FormGroup label="Region"><select className="input" value={form.region} onChange={e => setForm(f=>({...f,region:e.target.value}))}><option>North</option><option>South</option><option>East</option><option>West</option></select></FormGroup>
        </div>
        <div className="g2">
          <FormGroup label="Max Load (kg)"><input className="input" type="number" value={form.max_load_capacity_kg} onChange={e => setForm(f=>({...f,max_load_capacity_kg:e.target.value}))} placeholder="e.g. 1000" /></FormGroup>
          <FormGroup label="Odometer (km)"><input className="input" type="number" value={form.odometer_km} onChange={e => setForm(f=>({...f,odometer_km:e.target.value}))} placeholder="0" /></FormGroup>
        </div>
        <FormGroup label="Acquisition Cost (₹)"><input className="input" type="number" value={form.acquisition_cost} onChange={e => setForm(f=>({...f,acquisition_cost:e.target.value}))} placeholder="e.g. 850000" /></FormGroup>
      </Modal>
    </>
  );
}
