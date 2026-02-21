import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { StatusPill, Spinner } from '../components/UI';

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getVehicles()])
      .then(([dash, veh]) => { setData(dash); setVehicles(veh); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const fleet = data?.fleet || {};
  const tripsData = data?.trips || {};

  return (
    <>
      <div className="kpi-grid">
        {[
          { cls:'kpi-a', icon:'🚛', val: fleet.active || 0,                    lbl:'Active On Trip' },
          { cls:'kpi-b', icon:'🔧', val: fleet.in_shop || 0,                   lbl:'In Maintenance' },
          { cls:'kpi-c', icon:'📈', val: (fleet.utilization_pct || 0) + '%',   lbl:'Fleet Utilization' },
          { cls:'kpi-d', icon:'📦', val: tripsData.pending || 0,               lbl:'Pending Cargo' },
        ].map(k => (
          <div key={k.lbl} className={`kpi ${k.cls}`}>
            <span className="kpi-icon">{k.icon}</span>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">🚛 Fleet Status</div>
            <span className="bdg bdg-v">{vehicles.length} Vehicles</span>
          </div>
          <div style={{ padding:'16px 24px' }}>
            {vehicles.map(v => (
              <div key={v.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{v.name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{v.license_plate} · {v.vehicle_type} · {v.region}</div>
                </div>
                <StatusPill status={v.status} />
              </div>
            ))}
            {!vehicles.length && <p style={{ color:'var(--muted)', fontSize:13, padding:'20px 0' }}>No vehicles yet.</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">📊 Quick Stats</div></div>
          <div className="card-body">
            {[
              { label:'Total Vehicles',      val: fleet.total || 0 },
              { label:'Available Now',       val: fleet.available || 0 },
              { label:'Trips Completed',     val: tripsData.completed || 0 },
              { label:'Trips In Progress',   val: (parseInt(tripsData.dispatched||0)+parseInt(tripsData.on_trip||0)) },
              { label:'Expired Licenses',    val: data?.drivers?.expired_licenses || 0 },
              { label:'Total Ops Cost',      val: '₹' + parseFloat(data?.financials?.total_ops_cost || 0).toLocaleString() },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                <span style={{ color:'var(--text2)' }}>{s.label}</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'var(--violet)' }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
