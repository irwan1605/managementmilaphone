import React, { useState } from "react";
import logo from "../assets/login.jpg";

/** Props:
 *  - onSuccess(): void
 *  - onSwitch(): void  // ke halaman Register
 *  - bg?: string       // path background (default '/boash-bg.jpg')
 */
export default function Login({ onSuccess, onSwitch, bg="/boash-bglo.jpg" }) {
  const [loading, setLoading] = useState(false);
  function login(e){ e.preventDefault(); setLoading(true); setTimeout(()=>{ setLoading(false); onSuccess(); }, 600); }

  return (
    <div className="auth">
      {/* panel kiri: background foto sekolah */}
      <div className="auth-hero" style={{ backgroundImage: `url('${bg}')` }}>
        <div className="auth-overlay" />
        <div className="auth-hero-text">
        <img src={logo} alt="Logo" className="w-10 h-100 rounded-full sidebar-head " />
          <h2>Manajemen Sekolah BoAsh</h2>
          <p>Platform terpadu: akademik, PPDB, keuangan, & fasilitas.</p>
        </div>
      </div>

      {/* panel kanan: form */}
      <div className="auth-pane">
        <form onSubmit={login} className="card card-pad" style={{width:"100%", maxWidth:420}}>
          <div style={{fontWeight:700, fontSize:18, marginBottom:8}}>Masuk</div>
          <div style={{marginTop:8}}>
            <label className="text-sm">Email</label>
            <input className="input" placeholder="admin@boash.sch.id" required/>
          </div>
          <div style={{marginTop:8}}>
            <label className="text-sm">Password</label>
            <input className="input" type="password" required/>
          </div>
          <button
            className="btn"
            style={{width:"100%", marginTop:12, background:"var(--dark)", color:"#fff", borderColor:"var(--dark)"}}
            disabled={loading}
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
          <div className="text-sm" style={{color:"var(--muted)", marginTop:6}}>
            Demo login (data bebas).
          </div>

          <div className="row" style={{justifyContent:"space-between", marginTop:12}}>
            <span className="text-sm">Belum punya akun?</span>
            <button type="button" className="btn" onClick={onSwitch}>Daftar akun</button>
          </div>
        </form>
      </div>
    </div>
  );
}
