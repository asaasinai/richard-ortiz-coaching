export default function AdminSettingsPage() {
  return (
    <div style={{ maxWidth:600 }}>
      <h1 style={{ fontFamily:"Inter Tight,sans-serif",fontWeight:900,fontSize:"1.5rem",marginBottom:"1.5rem" }}>Settings</h1>
      <div className="card" style={{ display:"flex",flexDirection:"column",gap:"1.25rem" }}>
        {[
          ["Coach Name","Richard Ortiz"],
          ["Admin Email","richard@richardortizcoaching.com"],
          ["Site URL","https://richardortizcoaching.com"],
          ["Resend From","noreply@richardortizcoaching.com"],
        ].map(([label,val]) => (
          <div key={label}>
            <label>{label}</label>
            <input defaultValue={val} />
          </div>
        ))}
        <button className="btn-gold" style={{ alignSelf:"flex-start" }}>Save Settings</button>
        <p style={{ fontSize:"0.78rem",color:"var(--text-mute)" }}>Settings are managed via Vercel environment variables. Contact your developer to update API keys.</p>
      </div>
    </div>
  )
}
