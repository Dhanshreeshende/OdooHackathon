import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]       = useState('manager@fleetflow.io');
  const [password, setPassword] = useState('password');
  const [role, setRole]         = useState('Fleet Manager');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="page-login" style={{ position:'relative', zIndex:10, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', width:'min(900px,96vw)', borderRadius:24, overflow:'hidden', border:'1px solid rgba(255,255,255,0.14)', boxShadow:'0 40px 100px rgba(0,0,0,0.6)', animation:'fadeUp 0.7s cubic-bezier(.16,1,.3,1)' }}>

        {/* LEFT PANEL */}
        <div style={{ background:'linear-gradient(145deg,#1e0d38,#2d0f4e,#1a1050)', padding:'60px 48px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', width:300, height:300, background:'radial-gradient(circle,rgba(168,85,247,0.25),transparent 70%)', bottom:-80, right:-80, borderRadius:'50%' }} />
          <div style={{ position:'absolute', width:200, height:200, background:'radial-gradient(circle,rgba(56,189,248,0.15),transparent 70%)', top:-40, left:-40, borderRadius:'50%' }} />

          <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1, position:'relative', zIndex:1 }}>
            Fleet<span style={{ background:'linear-gradient(90deg,#ffb347,#ff6b6b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Flow</span>
          </div>

          <div style={{ position:'relative', zIndex:1 }}>
            <h2 style={{ fontSize:32, fontWeight:800, lineHeight:1.2, marginBottom:12, background:'linear-gradient(135deg,#fff,rgba(255,255,255,0.6))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Drive smarter.<br />Deliver faster.
            </h2>
            <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.6 }}>Next-gen fleet intelligence for modern logistics teams.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, position:'relative', zIndex:1 }}>
            {[['98.4%','On-time rate'],['142','Active vehicles'],['12ms','Avg response'],['₹2.4M','Saved/month']].map(([val,lbl]) => (
              <div key={lbl} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:14 }}>
                <div style={{ fontSize:22, fontWeight:800, fontFamily:'JetBrains Mono,monospace', background:'linear-gradient(90deg,#0be881,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{val}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ background:'rgba(13,6,24,0.95)', padding:'60px 48px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <h3 style={{ fontSize:24, fontWeight:700, marginBottom:6 }}>Welcome back 👋</h3>
          <p style={{ color:'var(--muted)', fontSize:13, marginBottom:32 }}>Sign in to your FleetFlow workspace</p>

          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Select your role</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:28 }}>
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  padding:'10px 12px', borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:12,
                  fontWeight:500, cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                  border: role === r ? '1px solid var(--violet)' : '1px solid var(--border)',
                  background: role === r ? 'rgba(168,85,247,0.12)' : 'var(--glass)',
                  color: role === r ? 'var(--violet)' : 'var(--text2)',
                  boxShadow: role === r ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
                }}
              >
                {r === 'Fleet Manager' ? '🚛' : r === 'Dispatcher' ? '📦' : r === 'Safety Officer' ? '🛡️' : '📊'} {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-g">
              <label>Email address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
            <div className="form-g">
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            <div style={{ textAlign:'right', marginTop:-8, marginBottom:20 }}>
              <a href="#" style={{ fontSize:12, color:'var(--violet)', textDecoration:'none' }}>Forgot password?</a>
            </div>

            {error && (
              <div className="warn-txt" style={{ marginBottom:16 }}>⚠️ {error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width:'100%', padding:14, border:'none', borderRadius:12, background:'linear-gradient(135deg,var(--violet2),var(--violet),var(--rose))', color:'white', fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', transition:'all 0.3s', opacity:loading?0.7:1 }}
            >
              {loading ? 'Signing in...' : 'Sign In to FleetFlow →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
