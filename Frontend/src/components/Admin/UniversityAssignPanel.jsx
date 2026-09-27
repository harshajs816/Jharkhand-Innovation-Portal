/**
 * UniversityAssignPanel.jsx
 * Fully dynamic — fetches real university profiles from MongoDB via API.
 * Matches the screenshot: skill tags, AI header bar, match cards with progress
 * bars and ✓ reason bullets, OR ASSIGN MANUALLY section with autocomplete.
 */

import { useState, useMemo, useEffect, useRef } from "react";

const API = "http://localhost:5000/api";

// ── Inline matching engine (no external import) ───────────────────────────────
const CATEGORY_KW = {
  "water-management":  ["water","hydro","aqua","iot","quality","contamination","filtration","irrigation","groundwater","sensing"],
  "agriculture":       ["agri","farm","crop","soil","irrigation","horticulture","precision","iot","agriculture"],
  "healthcare":        ["health","medical","telemedicine","nutrition","public health","bio","clinical"],
  "education":         ["edtech","education","digital","learning","school","networking","community"],
  "sanitation":        ["sanitation","toilet","waste","drainage","hygiene","civil","public health","odf"],
  "energy":            ["energy","solar","power","renewable","electrification","grid","electrical"],
  "environment":       ["environment","ecology","pollution","climate","biodiversity","waste"],
  "rural-livelihoods": ["rural","livelihood","community","social","tribal","skill"],
  "urban-development": ["urban","infrastructure","planning","smart","traffic"],
  "Water":             ["water","hydro","aqua","iot","quality","contamination","filtration","irrigation"],
};

const fuzzy = (a, b) => {
  if (!a || !b) return false;
  return a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
};

function computeMatch(challenge, univ) {
  const skills   = challenge?.aiAnalysis?.requiredSkills || [];
  const category = challenge?.category || "";
  const district = challenge?.district || "";
  const kws      = CATEGORY_KW[category] || [];
  const reasons  = [];
  let   pts      = 0;

  // Skill overlap — 10 pts each, max 4
  const skillHits = skills.filter(s => (univ.expertise || []).some(e => fuzzy(e, s)));
  pts += Math.min(skillHits.length, 4) * 10;
  skillHits.slice(0, 2).forEach(s => reasons.push(`${s} expertise`));

  // Lab match — 12 pts each, max 3
  const labHits = (univ.labs || []).filter(
    l => kws.some(k => fuzzy(l, k)) || skills.some(s => fuzzy(l, s))
  );
  pts += Math.min(labHits.length, 3) * 12;
  labHits.slice(0, 2).forEach(l => reasons.push(`${l} available`));

  // Research area — 8 pts each, max 2
  const resHits = (univ.researchAreas || []).filter(
    r => kws.some(k => fuzzy(r, k)) || skills.some(s => fuzzy(r, s))
  );
  pts += Math.min(resHits.length, 2) * 8;
  if (resHits[0]) reasons.push(`${resHits[0]} research area`);

  // Domain expertise — 10 pts
  const domainHits = (univ.expertise || []).filter(e => kws.some(k => fuzzy(e, k)));
  pts += domainHits.length >= 2 ? 10 : domainHits.length === 1 ? 5 : 0;

  // Location — 6 pts
  if (univ.district && challenge?.district &&
      univ.district.toLowerCase() === challenge.district.toLowerCase()) {
    pts += 6;
    reasons.push(`Located in ${univ.district}`);
  }

  // Normalize 50–96
  const matchScore = Math.round(50 + Math.min(pts / 80, 1) * 46);
  return {
    universityId:   univ.id,
    universityName: univ.name,
    matchScore,
    reasons: reasons.length ? reasons.slice(0, 4) : ["General research infrastructure"],
  };
}

// ── University card component ─────────────────────────────────────────────────
function UniversityCard({ match, isTop, onAssign, isAssigning, isAssigned }) {
  const barColor = match.matchScore >= 80
    ? "linear-gradient(90deg,#10b981,#34d399)"
    : match.matchScore >= 65
    ? "linear-gradient(90deg,#06b6d4,#67e8f9)"
    : "linear-gradient(90deg,#f59e0b,#fcd34d)";

  const badgeColor = match.matchScore >= 80
    ? { bg: "rgba(16,185,129,0.2)",  border: "rgba(16,185,129,0.5)",  text: "#34d399"  }
    : { bg: "rgba(99,102,241,0.2)",  border: "rgba(99,102,241,0.5)",  text: "#a5b4fc"  };

  return (
    <div style={{
      background:   isTop ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.03)",
      border:       isTop ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding:      "18px 20px",
      marginBottom: 12,
      transition:   "border-color 0.2s",
    }}>
      {/* ── Top row ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0, flex:1 }}>
          {isTop && <span style={{ fontSize:18, flexShrink:0 }}>🏆</span>}
          <span style={{ color:"#fff", fontWeight:800, fontSize:15, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {match.universityName}
          </span>
          <span style={{
            background: badgeColor.bg, border: `1px solid ${badgeColor.border}`,
            color: badgeColor.text, fontWeight:800, fontSize:12,
            padding:"3px 10px", borderRadius:20, flexShrink:0,
          }}>
            {match.matchScore}% Match
          </span>
        </div>

        {/* Assign Now */}
        {isAssigned ? (
          <div style={{ padding:"9px 20px", background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.35)", borderRadius:10, color:"#34d399", fontSize:13, fontWeight:700, flexShrink:0 }}>
            ✓ Assigned
          </div>
        ) : (
          <button
            onClick={() => onAssign(match.universityId, match.universityName)}
            disabled={isAssigning}
            style={{
              padding: "9px 22px",
              background: isAssigning ? "rgba(99,102,241,0.4)" : isTop ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "#374151",
              border: isTop ? "none" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, color:"#fff", fontSize:13, fontWeight:700,
              cursor: isAssigning ? "not-allowed" : "pointer",
              flexShrink: 0, whiteSpace:"nowrap",
              boxShadow: isTop ? "0 4px 15px rgba(99,102,241,0.35)" : "none",
              opacity: isAssigning ? 0.7 : 1, transition:"all 0.15s",
              display:"flex", alignItems:"center", gap:6,
            }}
          >
            {isAssigning ? (
              <><svg style={{width:14,height:14,animation:"uap-spin 0.8s linear infinite"}} fill="none" viewBox="0 0 24 24"><circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Assigning…</>
            ) : "Assign Now"}
          </button>
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:10, overflow:"hidden", marginBottom:12 }}>
        <div style={{ width:`${match.matchScore}%`, height:"100%", background:barColor, borderRadius:10, transition:"width 0.8s ease-out" }} />
      </div>

      {/* ── Reason bullets ───────────────────────────────────────────────── */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"5px 18px" }}>
        {match.reasons.map((r, i) => (
          <span key={i} style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ color:"#34d399", fontWeight:700 }}>✓</span>{r}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UniversityAssignPanel({ challenge, onClose, onAssigned }) {
  const [universities, setUniversities] = useState([]);
  const [loadingUnis, setLoadingUnis]   = useState(true);
  const [fetchError,  setFetchError]    = useState("");

  const [assigningId, setAssigningId]   = useState(null);
  const [assignedId,  setAssignedId]    = useState(challenge?.assignedUniversityId || null);
  const [toast,       setToast]         = useState(null);
  const [manualInput, setManualInput]   = useState("");
  const [suggestions, setSuggestions]   = useState([]);
  const inputRef = useRef(null);

  // ── Fetch universities from API ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    fetch(`${API}/admin/universities`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.data?.universities) {
          setUniversities(data.data.universities);
        } else {
          setFetchError("Could not load universities");
        }
      })
      .catch(() => setFetchError("Network error loading universities"))
      .finally(() => setLoadingUnis(false));
  }, []);

  // ── Compute AI matches ────────────────────────────────────────────────────
  const matches = useMemo(() =>
    universities
      .map(u => computeMatch(challenge, u))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5),
    [challenge, universities]
  );

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Assign handler — calls real API ──────────────────────────────────────
  const handleAssign = async (universityId, universityName) => {
    setAssigningId(universityId);
    try {
      const token       = localStorage.getItem("accessToken");
      const challengeId = challenge?._id || challenge?.id;

      if (!token) throw new Error("Not authenticated. Please log in again.");
      if (!challengeId) throw new Error("Challenge ID is missing.");

      const res  = await fetch(`${API}/admin/challenges/${challengeId}/review`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action: "assign-university", assignedUniversity: universityName }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || `Server error (${res.status})`);

      // Success — update local state immediately
      setAssignedId(universityId);
      showToast(`✓ Assigned to ${universityName} successfully!`);

      // Close modal and refresh list after toast is visible
      setTimeout(() => {
        onAssigned?.();
      }, 1200);

    } catch (e) {
      console.error("Assignment error:", e);
      showToast(e.message || "Assignment failed", "error");
    } finally {
      setAssigningId(null);
    }
  };

  const handleManualAssign = () => {
    const name = manualInput.trim();
    if (!name) return;
    const found = universities.find(u => u.name.toLowerCase() === name.toLowerCase());
    handleAssign(found?.id || `CUSTOM-${Date.now()}`, found?.name || name);
    setManualInput(""); setSuggestions([]);
  };

  const handleManualChange = (e) => {
    const v = e.target.value;
    setManualInput(v);
    setSuggestions(
      v.length >= 2
        ? universities.filter(u =>
            u.name.toLowerCase().includes(v.toLowerCase()) ||
            u.location?.toLowerCase().includes(v.toLowerCase()) ||
            u.district?.toLowerCase().includes(v.toLowerCase())
          ).slice(0, 6)
        : []
    );
  };

  if (!challenge) return null;
  const skillTags = challenge?.aiAnalysis?.requiredSkills || [];

  return (
    <div style={{
      background:"#0f172a", borderRadius:18, padding:"24px 24px 20px",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      width:"100%", maxWidth:680, position:"relative",
    }}>
      <style>{`@keyframes uap-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"absolute", top:16, right:onClose?56:16, padding:"10px 16px",
          borderRadius:10, zIndex:10,
          background: toast.type==="success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          border:     toast.type==="success" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(239,68,68,0.4)",
          color:      toast.type==="success" ? "#34d399" : "#f87171",
          fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8,
          boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
        }}>
          {toast.msg}
          <button onClick={()=>setToast(null)} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:14,lineHeight:1}}>✕</button>
        </div>
      )}

      {/* Close */}
      {onClose && (
        <button onClick={onClose} style={{ position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#94a3b8",width:30,height:30,display:"grid",placeItems:"center",cursor:"pointer",fontSize:16 }}>
          ✕
        </button>
      )}

      {/* Title */}
      <p style={{ color:"#64748b",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4 }}>
        Assigning Challenge
      </p>
      <h3 style={{ color:"#fff",fontWeight:800,fontSize:15,margin:"0 0 16px",paddingRight:onClose?36:0,lineHeight:1.3 }}>
        {challenge.title}
      </h3>

      {/* Skill tags */}
      {skillTags.length > 0 && (
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:16 }}>
          {skillTags.map(tag => (
            <span key={tag} style={{ padding:"5px 14px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:20,color:"#e2e8f0",fontSize:12,fontWeight:600 }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI header bar */}
      <div style={{
        background:"linear-gradient(135deg,rgba(79,70,229,0.35) 0%,rgba(99,102,241,0.25) 100%)",
        border:"1px solid rgba(99,102,241,0.4)", borderRadius:12, padding:"11px 18px",
        marginBottom:18, display:"flex", alignItems:"center", gap:10,
      }}>
        <span style={{ fontSize:18 }}>🤖</span>
        <div>
          <span style={{ color:"#a5b4fc",fontWeight:800,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase" }}>
            AI RECOMMENDATION ENGINE
          </span>
          <span style={{ color:"#64748b",fontSize:12,marginLeft:8 }}>
            {loadingUnis
              ? "Loading universities from database…"
              : `Matched against ${universities.length} Jharkhand Universities & Research Labs`
            }
          </span>
        </div>
      </div>

      {/* Loading / error / cards */}
      {loadingUnis ? (
        <div style={{ textAlign:"center",padding:"32px 0",color:"#64748b" }}>
          <div style={{ width:28,height:28,border:"3px solid rgba(99,102,241,0.3)",borderTopColor:"#6366f1",borderRadius:"50%",animation:"uap-spin 0.7s linear infinite",margin:"0 auto 12px" }}/>
          <p style={{ margin:0,fontSize:13 }}>Loading university data…</p>
        </div>
      ) : fetchError ? (
        <div style={{ padding:"14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,color:"#f87171",fontSize:13,marginBottom:16 }}>
          ⚠️ {fetchError} — showing manual assignment only
        </div>
      ) : matches.length === 0 ? (
        <div style={{ padding:"16px",background:"rgba(255,255,255,0.04)",borderRadius:10,color:"#64748b",fontSize:13,marginBottom:16,textAlign:"center" }}>
          No universities matched. Use manual assignment below.
        </div>
      ) : (
        matches.map((match, i) => (
          <UniversityCard
            key={match.universityId}
            match={match}
            isTop={i === 0}
            onAssign={handleAssign}
            isAssigning={assigningId === match.universityId}
            isAssigned={assignedId === match.universityId}
          />
        ))
      )}

      {/* Already assigned notice */}
      {assignedId && !toast && (
        <div style={{ padding:"10px 14px",background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:10,color:"#93c5fd",fontSize:12,marginBottom:14 }}>
          ℹ️ Challenge is already assigned. Re-assign below if needed.
        </div>
      )}

      {/* OR ASSIGN MANUALLY */}
      <div style={{ display:"flex",alignItems:"center",gap:14,margin:"20px 0 16px" }}>
        <div style={{ flex:1,height:1,background:"rgba(255,255,255,0.1)" }} />
        <span style={{ color:"#475569",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",whiteSpace:"nowrap" }}>
          OR ASSIGN MANUALLY
        </span>
        <div style={{ flex:1,height:1,background:"rgba(255,255,255,0.1)" }} />
      </div>

      {/* Manual input */}
      <div style={{ display:"flex",gap:10,position:"relative" }}>
        <div style={{ flex:1,position:"relative" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type or select custom University name..."
            value={manualInput}
            onChange={handleManualChange}
            onBlur={() => setTimeout(() => setSuggestions([]), 180)}
            onKeyDown={e => { if (e.key === "Enter") handleManualAssign(); }}
            style={{
              width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:12,padding:"12px 16px",color:"#e2e8f0",fontSize:13,outline:"none",
              boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.15s",
            }}
          />
          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <div style={{
              position:"absolute",top:"calc(100% + 6px)",left:0,right:0,
              background:"#1e293b",border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:10,overflow:"hidden",zIndex:50,boxShadow:"0 12px 30px rgba(0,0,0,0.4)",
            }}>
              {suggestions.map(u => (
                <button
                  key={u.id}
                  onMouseDown={() => { setManualInput(u.name); setSuggestions([]); }}
                  style={{
                    width:"100%",textAlign:"left",padding:"10px 16px",
                    background:"transparent",border:"none",
                    borderBottom:"1px solid rgba(255,255,255,0.06)",
                    cursor:"pointer",display:"block",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <p style={{ margin:0,color:"#e2e8f0",fontSize:13,fontWeight:600 }}>{u.name}</p>
                  <p style={{ margin:"2px 0 0",color:"#64748b",fontSize:11 }}>
                    {u.district} · {u.type} {u.accreditation ? `· ${u.accreditation}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleManualAssign}
          disabled={!manualInput.trim() || !!assigningId}
          style={{
            padding:"12px 22px",
            background: !manualInput.trim() ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#374151,#4b5563)",
            border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,
            color: !manualInput.trim() ? "#64748b" : "#e2e8f0",
            fontSize:13,fontWeight:700,
            cursor: !manualInput.trim() ? "not-allowed" : "pointer",
            flexShrink:0,transition:"all 0.15s",
          }}
        >
          Assign Custom
        </button>
      </div>

      {/* Score legend */}
      <div style={{ marginTop:16,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10 }}>
        <span style={{ fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:5 }}>
          Score factors
        </span>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"4px 14px" }}>
          {["Skill overlap","Lab match","Research areas","Domain expertise","Location proximity"].map(f => (
            <span key={f} style={{ fontSize:11,color:"#475569",display:"flex",alignItems:"center",gap:4 }}>
              <span style={{ color:"#34d399" }}>✓</span>{f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
