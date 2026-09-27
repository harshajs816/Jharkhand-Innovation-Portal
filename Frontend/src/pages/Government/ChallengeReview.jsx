import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, ClipboardList, Users, Building2, Settings,
  LogOut, Bell, RefreshCw, AlertCircle, CheckCircle, X,
  Search, Filter, MapPin, Calendar, Flag, ChevronDown,
  ChevronUp, Eye, Merge, Star, GraduationCap, Info,
  Copy, TrendingUp, Menu, ArrowLeft, FileText, Zap,
  UserRound, Clock,
} from "lucide-react";
import UniversityAssignPanel from "../../components/Admin/UniversityAssignPanel";

const API = "http://localhost:5000/api";

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  submitted:            { bg: "#fef3c7", color: "#b45309" },
  "ai-analysis":        { bg: "#ede9fe", color: "#6d28d9" },
  "under-review":       { bg: "#dbeafe", color: "#1d4ed8" },
  validated:            { bg: "#dcfce7", color: "#15803d" },
  "university-matching":{ bg: "#e0f2fe", color: "#0369a1" },
  "university-accepted":{ bg: "#d1fae5", color: "#065f46" },
  "team-formed":        { bg: "#fce7f3", color: "#9d174d" },
  "proposal-submitted": { bg: "#fff7ed", color: "#c2410c" },
  prototype:            { bg: "#f0fdf4", color: "#14532d" },
  "pilot-testing":      { bg: "#ecfeff", color: "#155e75" },
  deployed:             { bg: "#dcfce7", color: "#14532d" },
  completed:            { bg: "#dbeafe", color: "#1e3a8a" },
  rejected:             { bg: "#fee2e2", color: "#991b1b" },
};
const PRIORITY_STYLE = {
  critical: { bg: "#fee2e2", color: "#b91c1c" },
  high:     { bg: "#fef3c7", color: "#b45309" },
  medium:   { bg: "#dbeafe", color: "#1d4ed8" },
  low:      { bg: "#dcfce7", color: "#15803d" },
};

const statusStyle   = (s) => STATUS_STYLE[s]   || { bg: "#f1f5f9", color: "#475569" };
const priorityStyle = (p) => PRIORITY_STYLE[p] || { bg: "#f1f5f9", color: "#475569" };
const cap           = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
const dateStr       = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const REVIEW_TABS = [
  { key: "all",             label: "All" },
  { key: "submitted",       label: "Submitted" },
  { key: "ai-analysis",     label: "AI Analysed" },
  { key: "under-review",    label: "Under Review" },
  { key: "validated",       label: "Validated" },
  { key: "university-matching", label: "Matching" },
  { key: "rejected",        label: "Rejected" },
];
const CATEGORIES = ["all","water-management","education","healthcare","agriculture","energy","sanitation","rural-livelihoods","other"];
const DISTRICTS   = ["all","Ranchi","Dhanbad","Jamshedpur","Bokaro","Hazaribagh","Giridih","Koderma","Chatra","Palamu","Garhwa","Latehar","Khunti","Gumla","Simdega","West Singhbhum","East Singhbhum","Ramgarh","Dumka","Deoghar","Jamtara","Sahebganj","Pakur","Godda","Lohardaga"];

// ─────────────────────────────────────────────────────────────────────────────
export default function ChallengeReview() {
  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const token = localStorage.getItem("accessToken");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [challenges, setChallenges] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [activeTab,  setActiveTab]  = useState("submitted");
  const [district,   setDistrict]   = useState("all");
  const [category,   setCategory]   = useState("all");
  const [urgency,    setUrgency]    = useState("all");
  const [search,     setSearch]     = useState("");
  const [sidebarOpen,setSidebarOpen]= useState(false);
  const searchRef = useRef(null);

  // ── Expand / detail ────────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(null); // { type, challenge }
  const [mForm, setMForm] = useState({
    note: "", priority: "medium", university: "", duplicateOf: "",
    mergeWith: [], currentSelectionId: "",
  });
  const [mLoading, setMLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async (pg = 1) => {
    try {
      setLoading(true); setError("");
      const freshToken = localStorage.getItem("accessToken");
      const params = new URLSearchParams({
        page: pg, limit: 12,
        ...(activeTab !== "all"    && { status:   activeTab }),
        ...(district  !== "all"    && { district }),
        ...(category  !== "all"    && { category }),
        ...(urgency   !== "all"    && { urgency }),
        ...(search.trim()          && { search: search.trim() }),
      });
      const res  = await fetch(`${API}/admin/challenges?${params}`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setChallenges(data.data.challenges);
      setTotal(data.data.total);
      setPage(data.data.page);
      setPages(data.data.pages);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [activeTab, district, category, urgency, search]);

  useEffect(() => { load(1); }, [load]);

  // ── Review action ──────────────────────────────────────────────────────────
  const reviewChallenge = async (id, action, extra = {}) => {
    setMLoading(true);
    const freshToken = localStorage.getItem("accessToken");
    try {
      const res  = await fetch(`${API}/admin/challenges/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed");
      showToast(data.message || `Challenge ${action} successful`);
      setModal(null);
      setMForm({ note:"", priority:"medium", university:"", duplicateOf:"", mergeWith:[], currentSelectionId:"" });
      await load(page);
    } catch (e) { showToast(e.message, "error"); }
    finally     { setMLoading(false); }
  };

  const handleMerge = async () => {
    if (!modal?.challenge || mForm.mergeWith.length === 0) {
      showToast("Select at least one challenge to merge.", "error"); return;
    }
    setMLoading(true);
    const freshToken = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API}/admin/challenges/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify({ primaryId: modal.challenge._id, duplicateIds: mForm.mergeWith }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
      setModal(null); await load(page);
    } catch (e) { showToast(e.message, "error"); }
    finally     { setMLoading(false); }
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const openModal    = (type, challenge) => {
    setModal({ type, challenge });
    setMForm({ note:"", priority: challenge.urgency || "medium", university: challenge.assignedUniversity || "", duplicateOf:"", mergeWith:[], currentSelectionId:"" });
  };
  const closeModal = () => { if (!mLoading) { setModal(null); } };

  const pending = challenges.filter(c => ["submitted","ai-analysis","under-review"].includes(c.status)).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="rev-root">

      {sidebarOpen && <div className="gov-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar (same as dashboard) ──────────────────────────────────── */}
      <aside className={`gov-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="gov-sidebar-logo">
          <div className="gov-logo-icon">🏛️</div>
          <div>
            <span className="gov-logo-title">Jharkhand Govt</span>
            <span className="gov-logo-sub">Innovation Portal</span>
          </div>
        </div>

        <nav className="gov-nav">
          {[
            { icon: <LayoutDashboard size={18}/>, label: "Analytics",         active: false, to: "/government-dashboard" },
            { icon: <ClipboardList size={18}/>,   label: "Review Challenges",  active: true,  to: "/government/review" },
            { icon: <Building2 size={18}/>,       label: "Universities",       active: false, to: "/university/dashboard" },
            { icon: <Users size={18}/>,           label: "Citizens",           active: false, to: "#" },
            { icon: <Settings size={18}/>,        label: "Settings",           active: false, to: "#" },
          ].map(n => (
            <button key={n.label} className={`gov-nav-btn ${n.active ? "active" : ""}`}
              onClick={() => { navigate(n.to); setSidebarOpen(false); }}>
              <span className="gov-nav-icon">{n.icon}</span>
              <span>{n.label}</span>
              {n.active && <span className="gov-nav-bar" />}
            </button>
          ))}
        </nav>

        <div className="gov-sidebar-footer">
          <div className="gov-user-pill">
            <div className="gov-user-avi">{(user?.name || "A").charAt(0).toUpperCase()}</div>
            <div>
              <p className="gov-user-name">{user?.name || "Admin"}</p>
              <p className="gov-user-role">Government Officer</p>
            </div>
          </div>
          <button className="gov-logout-btn" onClick={handleLogout}><LogOut size={15}/> Logout</button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="rev-content">

        {/* Topbar */}
        <header className="rev-topbar">
          <div className="rev-topbar-left">
            <button className="gov-hamburger" onClick={() => setSidebarOpen(s => !s)}><Menu size={22}/></button>
            <button className="rev-btn rev-btn-ghost" style={{padding:"6px 10px"}} onClick={() => navigate("/government-dashboard")}>
              <ArrowLeft size={16}/>
            </button>
            <div>
              <h1 className="rev-topbar-title">Challenge Review System</h1>
              <p className="rev-topbar-sub">
                {total} challenges total · {pending > 0 ? <span style={{color:"#d97706",fontWeight:700}}>{pending} need action</span> : "all reviewed"}
              </p>
            </div>
          </div>
          <div className="rev-topbar-right">
            <button className="gov-topbar-icon" onClick={() => load(page)} title="Refresh"><RefreshCw size={18}/></button>
            <button className="gov-topbar-icon"><Bell size={18}/></button>
            <div style={{display:"flex",alignItems:"center",gap:"8px",paddingLeft:"8px"}}>
              <div className="gov-user-avi" style={{width:32,height:32,fontSize:12}}>{(user?.name||"A").charAt(0).toUpperCase()}</div>
              <div style={{display:"flex",flexDirection:"column"}}>
                <span style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{user?.name||"Admin"}</span>
                <span style={{fontSize:10,color:"#94a3b8"}}>Officer</span>
              </div>
            </div>
          </div>
        </header>

        {/* Toast */}
        {toast && (
          <div className={`gov-toast gov-toast-${toast.type}`}>
            {toast.type==="success" ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
            <span>{toast.msg}</span>
            <button onClick={()=>setToast(null)}><X size={14}/></button>
          </div>
        )}

        {/* Body */}
        <div className="rev-body">

          {error && (
            <div className="gov-error">
              <AlertCircle size={16}/> {error}
              <button onClick={() => load(page)} className="gov-error-retry"><RefreshCw size={12}/> Retry</button>
            </div>
          )}

          {/* ── Filter bar ──────────────────────────────────────────────── */}
          <div className="rev-filter-bar">
            <Search size={16} color="#94a3b8" style={{flexShrink:0}}/>
            <input ref={searchRef} type="text" placeholder="Search by title, description…"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && load(1)}/>
            <select value={district}  onChange={e => setDistrict(e.target.value)}>
              <option value="all">All Districts</option>
              {DISTRICTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{cap(c.replace(/-/g," "))}</option>)}
            </select>
            <select value={urgency}  onChange={e => setUrgency(e.target.value)}>
              <option value="all">All Priorities</option>
              {["critical","high","medium","low"].map(u => <option key={u} value={u}>{cap(u)}</option>)}
            </select>
            <button className="rev-btn rev-btn-uni" onClick={() => load(1)} style={{padding:"7px 16px",fontSize:13}}>
              <Filter size={14}/> Apply
            </button>
          </div>

          {/* ── Status Tabs ─────────────────────────────────────────────── */}
          <div className="rev-tabs">
            {REVIEW_TABS.map(t => (
              <button key={t.key} className={`rev-tab-btn ${activeTab===t.key?"active":""}`}
                onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Challenge List ───────────────────────────────────────────── */}
          {loading ? (
            <div className="gov-loading"><div className="gov-spinner"/><p>Loading challenges…</p></div>
          ) : challenges.length === 0 ? (
            <div className="rev-empty">
              <span className="rev-empty-icon">📋</span>
              <h3>No challenges found</h3>
              <p>Try adjusting your filters or check a different status tab.</p>
            </div>
          ) : (
            <>
              <div className="rev-cards-list">
                {challenges.map(ch => {
                  const isExpanded = expandedId === ch._id;
                  const ss = statusStyle(ch.status);
                  const ps = priorityStyle(ch.urgency);
                  const ai = ch.aiAnalysis;

                  return (
                    <div key={ch._id}
                      className={`rev-card rev-card-sl-${ch.status?.replace(/[^a-z-]/g,"")}`}>

                      {/* ── Card Header ─────────────────────────────────── */}
                      <div className="rev-card-header">
                        <div className="rev-card-header-left">
                          <p className="rev-card-id">{ch.challengeId || ch._id.slice(-8).toUpperCase()}</p>
                          <h3 className="rev-card-title">{ch.title}</h3>
                          <div className="rev-card-tags">
                            <span className="rev-status-chip" style={{background:ss.bg,color:ss.color}}>
                              {ch.status?.replace(/-/g," ")}
                            </span>
                            <span className="rev-priority-chip" style={{background:ps.bg,color:ps.color}}>
                              {cap(ch.urgency)} Priority
                            </span>
                            <span className="rev-category-chip">{ch.category}</span>
                            {ch.affectedPeople > 0 && (
                              <span className="rev-affected-chip">
                                👥 {ch.affectedPeople.toLocaleString("en-IN")} affected
                              </span>
                            )}
                            {ch.aiAnalysis?.priorityScore && (
                              <span style={{padding:"3px 9px",borderRadius:20,background:"#ede9fe",color:"#5b21b6",fontSize:11,fontWeight:700}}>
                                🤖 AI: {ch.aiAnalysis.priorityScore}/100
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="rev-card-header-right">
                          <span style={{fontSize:12,color:"#94a3b8"}}>{dateStr(ch.createdAt)}</span>
                          <button className="rev-btn rev-btn-ghost" style={{padding:"4px 8px",fontSize:11}}
                            onClick={() => setExpandedId(isExpanded ? null : ch._id)}>
                            {isExpanded ? <><ChevronUp size={13}/> Less</> : <><Eye size={13}/> Details</>}
                          </button>
                        </div>
                      </div>

                      {/* ── Meta Row ────────────────────────────────────── */}
                      <div className="rev-card-meta">
                        <span><MapPin size={13}/>  {ch.district}{ch.city ? `, ${ch.city}` : ""}</span>
                        <span><Calendar size={13}/> Submitted {dateStr(ch.createdAt)}</span>
                        {ch.submittedBy?.name && (
                          <span><UserRound size={13}/> {ch.submittedBy.name}</span>
                        )}
                        {ch.endorseCount > 0 && (
                          <span><TrendingUp size={13}/> {ch.endorseCount} endorsements</span>
                        )}
                        {ch.assignedUniversity && (
                          <span><GraduationCap size={13}/> {ch.assignedUniversity}</span>
                        )}
                      </div>

                      {/* ── Card Body ───────────────────────────────────── */}
                      <div className="rev-card-body">
                        <p className="rev-card-desc">{ch.description}</p>

                        {/* AI Analysis Box */}
                        {ai?.priorityScore && (
                          <div className="rev-ai-box">
                            <p className="rev-ai-title">🤖 AI Analysis</p>
                            <div className="rev-ai-grid">
                              <div className="rev-ai-item">Score: <strong>{ai.priorityScore}/100</strong></div>
                              <div className="rev-ai-item">Severity: <strong>{ai.severity}</strong></div>
                              <div className="rev-ai-item">Duplicates: <strong>{ai.duplicatesFound || 0} found</strong></div>
                              {ai.estimatedImpact && <div className="rev-ai-item" style={{gridColumn:"1/-1"}}>Impact: <strong>{ai.estimatedImpact}</strong></div>}
                            </div>
                            {ai.requiredSkills?.length > 0 && (
                              <div className="rev-ai-skills">
                                {ai.requiredSkills.map(s => <span key={s} className="rev-ai-skill-tag">{s}</span>)}
                              </div>
                            )}
                            {ai.suggestedSolutions?.length > 0 && (
                              <p className="rev-ai-solutions">
                                💡 Suggested: {ai.suggestedSolutions.slice(0,3).join(" · ")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Expanded Detail ─────────────────────────────── */}
                      {isExpanded && (
                        <div className="rev-card-expand">
                          <div className="rev-expand-grid">
                            <div className="rev-expand-item">
                              <p className="rev-expand-label">Full Description</p>
                              <p style={{margin:0,lineHeight:1.6}}>{ch.description}</p>
                            </div>
                            {ch.existingAttempts && (
                              <div className="rev-expand-item">
                                <p className="rev-expand-label">Existing Attempts</p>
                                <p style={{margin:0}}>{ch.existingAttempts}</p>
                              </div>
                            )}
                            {ch.expectedSolution && (
                              <div className="rev-expand-item">
                                <p className="rev-expand-label">Expected Solution</p>
                                <p style={{margin:0}}>{ch.expectedSolution}</p>
                              </div>
                            )}
                            {ch.address && (
                              <div className="rev-expand-item">
                                <p className="rev-expand-label">Location</p>
                                <p style={{margin:0}}>{ch.address}{ch.latitude ? ` (${ch.latitude.toFixed(4)}, ${ch.longitude.toFixed(4)})` : ""}</p>
                              </div>
                            )}
                            {ch.submittedBy?.email && (
                              <div className="rev-expand-item">
                                <p className="rev-expand-label">Submitted By</p>
                                <p style={{margin:0}}>{ch.submittedBy.name} · {ch.submittedBy.email}</p>
                              </div>
                            )}
                            {/* Media */}
                            {(ch.images?.length > 0 || ch.documents?.length > 0) && (
                              <div className="rev-expand-item" style={{gridColumn:"1/-1"}}>
                                <p className="rev-expand-label">Evidence / Media</p>
                                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                                  {ch.images?.map((img,i) => (
                                    <a key={i} href={`http://localhost:5000${img}`} target="_blank" rel="noreferrer"
                                      style={{fontSize:12,color:"#0d9488",display:"flex",alignItems:"center",gap:4,
                                        background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:6,padding:"3px 10px"}}>
                                      🖼 Image {i+1}
                                    </a>
                                  ))}
                                  {ch.documents?.map((d,i) => (
                                    <a key={i} href={`http://localhost:5000${d}`} target="_blank" rel="noreferrer"
                                      style={{fontSize:12,color:"#6366f1",display:"flex",alignItems:"center",gap:4,
                                        background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:6,padding:"3px 10px"}}>
                                      <FileText size={11}/> Doc {i+1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Timeline */}
                          {ch.timeline?.length > 0 && (
                            <div className="rev-timeline">
                              <p className="rev-expand-label" style={{marginBottom:6}}>Status Timeline</p>
                              {ch.timeline.slice(-6).reverse().map((t, i) => (
                                <div className="rev-tl-row" key={i}>
                                  <div className="rev-tl-dot" style={{background: statusStyle(t.status).color}}/>
                                  <span className="rev-tl-status">{t.status?.replace(/-/g," ")}</span>
                                  <span className="rev-tl-note">{t.note}</span>
                                  <span className="rev-tl-date">{dateStr(t.date)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Action Footer ────────────────────────────────── */}
                      <div className="rev-card-footer">
                        <div className="rev-card-footer-left">
                          {/* Primary actions — based on status */}
                          {["submitted","ai-analysis","under-review"].includes(ch.status) && (
                            <button className="rev-btn rev-btn-approve"
                              onClick={() => reviewChallenge(ch._id, "approve")}>
                              <CheckCircle size={13}/> Approve
                            </button>
                          )}
                          {["submitted","ai-analysis","under-review"].includes(ch.status) && (
                            <button className="rev-btn rev-btn-reject"
                              onClick={() => openModal("reject", ch)}>
                              <X size={13}/> Reject
                            </button>
                          )}
                          {["submitted","ai-analysis","under-review","validated"].includes(ch.status) && (
                            <button className="rev-btn rev-btn-info"
                              onClick={() => openModal("request-info", ch)}>
                              <Info size={13}/> Request Info
                            </button>
                          )}
                          {/* Assign University — available for all non-final statuses */}
                          {!["completed","deployed","impact-measured","rejected"].includes(ch.status) && (
                            <button className="rev-btn rev-btn-uni"
                              onClick={() => openModal("assign-university", ch)}>
                              <GraduationCap size={13}/>
                              {ch.assignedUniversity ? "Re-assign University" : "Assign University"}
                            </button>
                          )}
                        </div>

                        <div className="rev-card-footer-right">
                          {/* Secondary actions always available */}
                          <button className="rev-btn rev-btn-pri"
                            onClick={() => openModal("set-priority", ch)}>
                            <Flag size={13}/> Priority
                          </button>
                          <button className="rev-btn rev-btn-dup"
                            onClick={() => openModal("mark-duplicate", ch)}>
                            <Copy size={13}/> Duplicate
                          </button>
                          <button className="rev-btn rev-btn-ghost"
                            onClick={() => openModal("merge", ch)}>
                            <Merge size={13}/> Merge
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* ── Pagination ──────────────────────────────────────────── */}
              {pages > 1 && (
                <div className="rev-pagination">
                  <button className="rev-page-btn" disabled={page <= 1}
                    onClick={() => load(page - 1)}>‹ Prev</button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} className={`rev-page-btn ${page===p?"active":""}`}
                        onClick={() => load(p)}>{p}</button>
                    );
                  })}
                  <button className="rev-page-btn" disabled={page >= pages}
                    onClick={() => load(page + 1)}>Next ›</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════════ */}

      {/* ── Reject ──────────────────────────────────────────────────────── */}
      {modal?.type === "reject" && (
        <div className="rev-overlay" onClick={e => e.target===e.currentTarget&&closeModal()}>
          <div className="rev-modal">
            <div className="rev-modal-header">
              <h2 className="rev-modal-title">Reject Challenge</h2>
              <button className="rev-modal-close" onClick={closeModal}><X size={16}/></button>
            </div>
            <div className="rev-modal-body">
              <p style={{margin:"0 0 16px",fontSize:13,color:"#475569"}}>
                Challenge: <strong>{modal.challenge.title}</strong>
              </p>
              <label className="rev-form-label">Rejection Reason *</label>
              <textarea className="rev-form-textarea" rows={4} required
                value={mForm.note} onChange={e=>setMForm(p=>({...p,note:e.target.value}))}
                placeholder="Explain why this challenge is being rejected — be specific and constructive…"/>
              <div className="rev-modal-foot">
                <button className="rev-btn rev-btn-ghost" onClick={closeModal} disabled={mLoading}>Cancel</button>
                <button className="rev-btn rev-btn-danger" disabled={mLoading||!mForm.note.trim()}
                  onClick={() => reviewChallenge(modal.challenge._id, "reject", { note: mForm.note })}>
                  {mLoading ? "Rejecting…" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Request More Info ────────────────────────────────────────────── */}
      {modal?.type === "request-info" && (
        <div className="rev-overlay" onClick={e => e.target===e.currentTarget&&closeModal()}>
          <div className="rev-modal">
            <div className="rev-modal-header">
              <h2 className="rev-modal-title">Request More Information</h2>
              <button className="rev-modal-close" onClick={closeModal}><X size={16}/></button>
            </div>
            <div className="rev-modal-body">
              <p style={{margin:"0 0 16px",fontSize:13,color:"#475569"}}>
                Challenge: <strong>{modal.challenge.title}</strong>
              </p>
              <label className="rev-form-label">Information Required *</label>
              <textarea className="rev-form-textarea" rows={4} required
                value={mForm.note} onChange={e=>setMForm(p=>({...p,note:e.target.value}))}
                placeholder="Specify exactly what additional information, evidence or clarification is needed…"/>
              <div className="rev-modal-foot">
                <button className="rev-btn rev-btn-ghost" onClick={closeModal} disabled={mLoading}>Cancel</button>
                <button className="rev-btn rev-btn-info" disabled={mLoading||!mForm.note.trim()}
                  onClick={() => reviewChallenge(modal.challenge._id, "request-info", { note: mForm.note })}>
                  <Info size={13}/> {mLoading ? "Sending…" : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Duplicate ──────────────────────────────────────────────── */}
      {modal?.type === "mark-duplicate" && (
        <div className="rev-overlay" onClick={e => e.target===e.currentTarget&&closeModal()}>
          <div className="rev-modal">
            <div className="rev-modal-header">
              <h2 className="rev-modal-title">Mark as Duplicate</h2>
              <button className="rev-modal-close" onClick={closeModal}><X size={16}/></button>
            </div>
            <div className="rev-modal-body">
              <p style={{margin:"0 0 16px",fontSize:13,color:"#475569"}}>
                Challenge: <strong>{modal.challenge.title}</strong>
              </p>
              <label className="rev-form-label">Original Challenge ID (optional)</label>
              <input className="rev-form-input"
                value={mForm.duplicateOf} onChange={e=>setMForm(p=>({...p,duplicateOf:e.target.value}))}
                placeholder="e.g. JH-2026-000042 — leave blank if unknown"/>
              <label className="rev-form-label">Note</label>
              <textarea className="rev-form-textarea" rows={3}
                value={mForm.note} onChange={e=>setMForm(p=>({...p,note:e.target.value}))}
                placeholder="Optionally explain why this is a duplicate…"/>
              <div className="rev-modal-foot">
                <button className="rev-btn rev-btn-ghost" onClick={closeModal} disabled={mLoading}>Cancel</button>
                <button className="rev-btn rev-btn-dup" disabled={mLoading}
                  onClick={() => reviewChallenge(modal.challenge._id, "mark-duplicate", { note: mForm.note, duplicateOfId: mForm.duplicateOf })}>
                  <Copy size={13}/> {mLoading ? "Marking…" : "Mark Duplicate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Set Priority ────────────────────────────────────────────────── */}
      {modal?.type === "set-priority" && (
        <div className="rev-overlay" onClick={e => e.target===e.currentTarget&&closeModal()}>
          <div className="rev-modal">
            <div className="rev-modal-header">
              <h2 className="rev-modal-title">Set Priority</h2>
              <button className="rev-modal-close" onClick={closeModal}><X size={16}/></button>
            </div>
            <div className="rev-modal-body">
              <p style={{margin:"0 0 16px",fontSize:13,color:"#475569"}}>
                Challenge: <strong>{modal.challenge.title}</strong>
              </p>
              <label className="rev-form-label">Priority Level *</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
                {["critical","high","medium","low"].map(p => {
                  const ps = priorityStyle(p);
                  return (
                    <button key={p} type="button"
                      style={{
                        padding:"12px 16px", borderRadius:10, cursor:"pointer",
                        border: mForm.priority===p ? `2px solid ${ps.color}` : "1px solid #e2e8f0",
                        background: mForm.priority===p ? ps.bg : "#fff",
                        color: mForm.priority===p ? ps.color : "#64748b",
                        fontWeight:700, fontSize:13, transition:"all .12s",
                      }}
                      onClick={() => setMForm(prev=>({...prev,priority:p}))}>
                      {cap(p)} {p==="critical"?"🚨":p==="high"?"🔴":p==="medium"?"🟡":"🟢"}
                    </button>
                  );
                })}
              </div>
              <div className="rev-modal-foot">
                <button className="rev-btn rev-btn-ghost" onClick={closeModal} disabled={mLoading}>Cancel</button>
                <button className="rev-btn rev-btn-uni" disabled={mLoading}
                  onClick={() => reviewChallenge(modal.challenge._id, "set-priority", { priority: mForm.priority })}>
                  <Flag size={13}/> {mLoading ? "Saving…" : "Set Priority"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign University — AI Panel ─────────────────────────────── */}
      {modal?.type === "assign-university" && (
        <div className="rev-overlay" onClick={e => e.target===e.currentTarget&&closeModal()}>
          <div style={{maxWidth:700,width:"100%",maxHeight:"92vh",overflowY:"auto",borderRadius:18}}>
            <UniversityAssignPanel
              challenge={modal.challenge}
              onClose={closeModal}
              onAssigned={() => {
                closeModal();          // close the modal
                load(page);            // reload the challenge list from API
              }}
            />
          </div>
        </div>
      )}

      {/* ── Merge Duplicates ─────────────────────────────────────────────── */}
      {modal?.type === "merge" && (
        <div className="rev-overlay" onClick={e => e.target===e.currentTarget&&closeModal()}>
          <div className="rev-modal" style={{maxWidth:580}}>
            <div className="rev-modal-header">
              <h2 className="rev-modal-title">Merge Duplicate Challenges</h2>
              <button className="rev-modal-close" onClick={closeModal}><X size={16}/></button>
            </div>
            <div className="rev-modal-body">
              <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:"12px 14px",marginBottom:"16px",fontSize:13,color:"#92400e"}}>
                <strong>Primary challenge</strong> (will be kept): <br/>
                <span style={{fontWeight:700}}>{modal.challenge.title}</span>
                <span style={{marginLeft:8,fontSize:11,color:"#b45309"}}>({modal.challenge.challengeId})</span>
              </div>
              <label className="rev-form-label">Add Duplicate Challenge IDs to Merge</label>
              <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
                <input className="rev-form-input" style={{marginBottom:0,flex:1}}
                  value={mForm.currentSelectionId}
                  onChange={e=>setMForm(p=>({...p,currentSelectionId:e.target.value}))}
                  placeholder="Paste challenge _id or challengeId here"/>
                <button className="rev-btn rev-btn-uni" style={{padding:"7px 14px",flexShrink:0}}
                  onClick={() => {
                    const v = mForm.currentSelectionId.trim();
                    if (v && !mForm.mergeWith.includes(v)) {
                      setMForm(p=>({...p, mergeWith:[...p.mergeWith,v], currentSelectionId:""}));
                    }
                  }}>
                  <Zap size={13}/> Add
                </button>
              </div>
              {mForm.mergeWith.length > 0 && (
                <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px",marginBottom:"14px"}}>
                  <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.4}}>
                    Will be merged ({mForm.mergeWith.length})
                  </p>
                  {mForm.mergeWith.map((id,i) => (
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                      <span style={{color:"#334155",fontFamily:"monospace"}}>{id}</span>
                      <button style={{border:"none",background:"none",cursor:"pointer",color:"#f87171",padding:"2px 4px"}}
                        onClick={()=>setMForm(p=>({...p,mergeWith:p.mergeWith.filter((_,idx)=>idx!==i)}))}>
                        <X size={13}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#9a3412"}}>
                ⚠️ Merged challenges will be <strong>soft-deleted</strong>. Their endorsement counts and affected people numbers will be added to the primary challenge. This cannot be undone.
              </div>
              <div className="rev-modal-foot">
                <button className="rev-btn rev-btn-ghost" onClick={closeModal} disabled={mLoading}>Cancel</button>
                <button className="rev-btn rev-btn-danger" disabled={mLoading||mForm.mergeWith.length===0} onClick={handleMerge}>
                  <Merge size={13}/> {mLoading ? "Merging…" : `Merge ${mForm.mergeWith.length} Duplicate(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
