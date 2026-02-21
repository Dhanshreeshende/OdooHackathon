import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Spinner } from '../components/UI';

export default function Analytics() {
  const [roi, setRoi]   = useState([]);
  const [fuel, setFuel] = useState([]);
  const [util, setUtil] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRoi(), api.getFuel(), api.getUtilization()])
      .then(([r, f, u]) => { setRoi(r); setFuel(f); setUtil(u); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxFuel = Math.max(...fuel.map(f => parseFloat(f.total_cost)), 1);
  const barColors = ['#a855f7','#38bdf8','#ff6b6b','#0be881','#ffb347','#fb7185'];
  const utilGrads = ['linear-gradient(90deg,#ffb347,#ff6b6b)','linear-gradient(90deg,#a855f7,#38bdf8)','linear-gradient(90deg,#0be881,#a3e635)'];

  if (loading) return <Spinner />;

  return (
    <>
      <div className="metric-grid">
        {[
          { val:'8.4 km/L', lbl:'Avg Fuel Efficiency' },
          { val:'₹12.3/km', lbl:'Avg Cost per KM',    style:{background:'linear-gradient(90deg,var(--mint),var(--sky))'} },
          { val:'32%',      lbl:'Avg Vehicle ROI',     style:{background:'linear-gradient(90deg,var(--violet),var(--sky))'} },
          { val:'94.2%',    lbl:'Trip Completion Rate',style:{background:'linear-gradient(90deg,var(--mint),var(--lime))'} },
        ].map(m => (
          <div key={m.lbl} className="metric-box">
            <div className="metric-val" style={m.style?{background:m.style.background,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}:{}}>{m.val}</div>
            <div className="metric-lbl">{m.lbl}</div>
          </div>
        ))}
      </div>

      <div className="g2">
        {/* Fuel Bar Chart */}
        <div className="card">
          <div className="card-hd"><div className="card-title">📊 Monthly Fuel Spend (₹)</div></div>
          <div style={{padding:'12px 20px 36px'}}>
            <div style={{display:'flex',alignItems:'flex-end',gap:10,height:160}}>
              {fuel.length ? fuel.map((f, i) => (
                <div key={f.month} title={`₹${parseFloat(f.total_cost).toLocaleString()}`}
                  style={{ flex:1, borderRadius:'8px 8px 0 0', minHeight:20, position:'relative', cursor:'pointer', transition:'opacity 0.2s',
                    height: `${Math.round((parseFloat(f.total_cost)/maxFuel)*100)}%`,
                    background:`linear-gradient(to top,${barColors[i%barColors.length]}cc,${barColors[i%barColors.length]}33)` }}
                >
                  <span style={{position:'absolute',bottom:-24,left:'50%',transform:'translateX(-50%)',fontSize:10,color:'var(--muted)',fontWeight:600,whiteSpace:'nowrap'}}>{f.month}</span>
                </div>
              )) : (
                <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:13}}>No fuel data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Utilization */}
        <div className="card">
          <div className="card-hd"><div className="card-title">🚛 Fleet Utilization by Type</div></div>
          <div className="card-body">
            {util.map((u, i) => (
              <div key={u.vehicle_type} style={{marginBottom:18}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,fontWeight:600}}>
                  <span>{u.vehicle_type}</span>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--violet)'}}>{u.utilization_pct}%</span>
                </div>
                <div className="pbar">
                  <div className="pfill" style={{width:`${u.utilization_pct}%`,background:utilGrads[i%utilGrads.length]}} />
                </div>
              </div>
            ))}
            {!util.length && <p style={{color:'var(--muted)',fontSize:13}}>No data yet.</p>}
          </div>
        </div>
      </div>

      {/* ROI Table */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">💰 Vehicle ROI Analysis</div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost btn-sm">⬇ CSV</button>
            <button className="btn btn-ghost btn-sm">⬇ PDF</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vehicle</th><th>Acquisition</th><th>Trips</th><th>Ops Cost</th><th>ROI</th><th>Fuel Eff.</th></tr></thead>
            <tbody>
              {roi.map(r => {
                const pct = parseFloat(r.roi_pct);
                const col = pct > 20 ? 'c-m' : pct > 0 ? 'c-a' : 'c-c';
                return (
                  <tr key={r.id}>
                    <td className="fw7">{r.name}</td>
                    <td className="mono">₹{parseFloat(r.acquisition_cost).toLocaleString()}</td>
                    <td className="mono fw7">{r.trip_count}</td>
                    <td className="mono c-c">₹{parseFloat(r.total_ops_cost).toLocaleString()}</td>
                    <td><span className={`mono fw7 ${col}`} style={{fontSize:15}}>{pct.toFixed(1)}%</span></td>
                    <td className="mono">{parseFloat(r.fuel_efficiency_km_per_l).toFixed(1)} km/L</td>
                  </tr>
                );
              })}
              {!roi.length && <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--muted)'}}>No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
