import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Target, Users, FileCheck2, Bell, CircleHelp,
  LogOut, ChevronDown, Menu, Building2, X, Plus, Trash2,
  UploadCloud, Paperclip, TrendingUp, FolderOpen, RefreshCw,
  AlertCircle, CheckCircle, Clock, XCircle, UserRound,
  Award, Zap, BarChart3, Calendar, ArrowRight, ChevronRight,
  GitBranch, Layers, BookOpen, Flag,
} from "lucide-react";
import "./Dashboard2.css";

const UNI_API = "http://localhost:5000/api/university";
const authH   = (t) => ({ Authorization: `Bearer ${t}` });
const jsonH   = (t) => ({ "Content-Type": "application/json", ...authH(t) });
const fmt     = (n) => Number(n || 0).toLocaleString("en-IN");
const cap     = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
const dateStr = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();
  const token            = localStorage.getItem("accessToken");
  const fileRef          = useRef(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [tab,          setTab]          = useState("overview");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [challenges,  setChallenges]  = useState([]);
  const [teams,       setTeams]       = useState([]);
  const [proposals,   setProposals]   = useState([]);
  const [milestones,  setMilestones]  = useState([]);
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // ── Challenge modals ────────────────────────────────────────────────────────
  const [rejectModal,     setRejectModal]     = useState(null);
  const [rejectReason,    setRejectReason]    = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ── Team modal ──────────────────────────────────────────────────────────────
  const [teamModal,   setTeamModal]   = useState(null);
  const [teamName,    setTeamName]    = useState("");
  const [teamMembers, setTeamMembers] = useState([{ name: "", email: "", role: "Team Lead", department: "" }]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMsg,     setTeamMsg]     = useState("");

  // ── Mentor modal ─────────────────────────────────────────────────────────────
  const [mentorModal,   setMentorModal]   = useState(null);
  const [mentorForm,    setMentorForm]    = useState({ name: "", email: "", department: "" });
  const [mentorLoading, setMentorLoading] = useState(false);

  // ── Proposal modal ───────────────────────────────────────────────────────────
  const [proposalModal,   setProposalModal]   = useState(null);
  const [pForm,           setPForm]           = useState({ title: "", solutionSummary: "", detailedPlan: "", estimatedBudget: "", estimatedTimelineMonths: "", documentLink: "" });
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalMsg,     setProposalMsg]     = useState("");

  // ── Milestone modal ──────────────────────────────────────────────────────────
  const [milestoneModal,   setMilestoneModal]   = useState(null);
  const [mForm,            setMForm]            = useState({ milestoneTitle: "", status: "on-track", completionPercentage: 0, description: "", evidenceLinks: "" });
  const [milestoneLoading, setMilestoneLoading] = useState(false);

  // ── Project modals ───────────────────────────────────────────────────────────
  const [createProjModal, setCreateProjModal] = useState(null);
  const [projForm,        setProjForm]        = useState({ title: "", description: "", expectedEndDate: "" });
  const [projLoading,     setProjLoading]     = useState(false);

  const [progressModal, setProgressModal] = useState(null);
  const [progForm,      setProgForm]      = useState({ overallProgress: 0, progressNote: "", status: "active" });
  const [progLoading,   setProgLoading]   = useState(false);

  const [uploadModal,   setUploadModal]   = useState(null);
  const [uploadFile,    setUploadFile]    = useState(null);
  const [uploadDesc,    setUploadDesc]    = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // ── Toast ────────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Load all data ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const h = authH(token);
      const [cr, tr, pr, mr, projR] = await Promise.all([
        fetch(`${UNI_API}/challenges/assigned`,  { headers: h }),
        fetch(`${UNI_API}/teams`,                { headers: h }),
        fetch(`${UNI_API}/proposals/my`,          { headers: h }),
        fetch(`${UNI_API}/milestones/my`,         { headers: h }),
        fetch(`${UNI_API}/projects`,             { headers: h }),
      ]);
      if ([cr, tr, pr, mr, projR].some(r => r.status === 401)) {
        await logout(); navigate("/university/login"); return;
      }
      const [cd, td, pd, md, projD] = await Promise.all([cr, tr, pr, mr, projR].map(r => r.json()));
      setChallenges(cd.challenges       || []);
      setTeams(td.teams                 || []);
      setProposals(pd.proposals         || []);
      setMilestones(md.milestoneUpdates || []);
      setProjects(projD.projects        || []);
    } catch {
      setError("Cannot connect to backend. Check the server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const pendingCount    = challenges.filter(c => c.status === "assigned").length;
  const acceptedCount   = challenges.filter(c => ["accepted", "in-progress", "completed"].includes(c.status)).length;
  const activeProjects  = projects.filter(p => p.status === "active").length;
  const completedProj   = projects.filter(p => p.status === "completed").length;
  const avgProgress     = milestones.length
    ? Math.round(milestones.reduce((a, m) => a + Number(m.completionPercentage || 0), 0) / milestones.length)
    : 0;

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleAccept = async (id) => {
    if (!window.confirm("Accept this challenge?")) return;
    setActionLoadingId(id);
    try {
      const res  = await fetch(`${UNI_API}/challenges/${id}/respond`, { method: "PATCH", headers: jsonH(token), body: JSON.stringify({ action: "accept" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Challenge accepted successfully!");
      loadAll();
    } catch (e) { showToast(e.message, "error"); }
    finally { setActionLoadingId(null); }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) { showToast("Enter a rejection reason.", "error"); return; }
    setActionLoadingId(rejectModal._id);
    try {
      const res  = await fetch(`${UNI_API}/challenges/${rejectModal._id}/respond`, { method: "PATCH", headers: jsonH(token), body: JSON.stringify({ action: "reject", rejectionReason: rejectReason }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Challenge rejected.");
      setRejectModal(null); setRejectReason(""); loadAll();
    } catch (e) { showToast(e.message, "error"); }
    finally { setActionLoadingId(null); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) { setTeamMsg("Team name is required."); return; }
    if (teamMembers.some(m => !m.name.trim() || !m.email.trim())) { setTeamMsg("Every member needs a name and email."); return; }
    setTeamLoading(true); setTeamMsg("");
    try {
      const res  = await fetch(`${UNI_API}/teams`, { method: "POST", headers: jsonH(token), body: JSON.stringify({ teamName: teamName.trim(), challengeId: teamModal._id, members: teamMembers }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Team created!");
      setTeamModal(null); setTeamName(""); setTeamMembers([{ name: "", email: "", role: "Team Lead", department: "" }]); loadAll();
    } catch (e) { setTeamMsg(e.message); }
    finally { setTeamLoading(false); }
  };

  const memberChange = (i, f, v) => setTeamMembers(p => p.map((m, idx) => idx === i ? { ...m, [f]: v } : m));
  const addMember    = ()        => setTeamMembers(p => [...p, { name: "", email: "", role: "Member", department: "" }]);
  const removeMember = (i)       => { if (teamMembers.length > 1) setTeamMembers(p => p.filter((_, idx) => idx !== i)); };

  const handleAddMentor = async (e) => {
    e.preventDefault();
    if (!mentorForm.name.trim() || !mentorForm.email.trim()) { showToast("Name and email required.", "error"); return; }
    setMentorLoading(true);
    try {
      const res  = await fetch(`${UNI_API}/teams/${mentorModal._id}/members`, { method: "POST", headers: jsonH(token), body: JSON.stringify({ name: mentorForm.name.trim(), email: mentorForm.email.trim(), role: "Faculty Mentor", department: mentorForm.department.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Faculty mentor added!");
      setMentorModal(null); setMentorForm({ name: "", email: "", department: "" }); loadAll();
    } catch (e) { showToast(e.message, "error"); }
    finally { setMentorLoading(false); }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    const { title, solutionSummary, detailedPlan, estimatedBudget, estimatedTimelineMonths } = pForm;
    if (!title.trim() || !solutionSummary.trim() || !detailedPlan.trim()) { setProposalMsg("Title, summary and plan are required."); return; }
    if (!estimatedBudget || Number(estimatedBudget) <= 0) { setProposalMsg("Enter a valid budget."); return; }
    if (!estimatedTimelineMonths || Number(estimatedTimelineMonths) < 1) { setProposalMsg("Timeline must be at least 1 month."); return; }
    setProposalLoading(true); setProposalMsg("");
    try {
      const res  = await fetch(`${UNI_API}/proposals`, { method: "POST", headers: jsonH(token), body: JSON.stringify({ title: title.trim(), solutionSummary: solutionSummary.trim(), detailedPlan: detailedPlan.trim(), estimatedBudget: Number(estimatedBudget), estimatedTimelineMonths: Number(estimatedTimelineMonths), teamId: proposalModal._id, challengeId: proposalModal.challenge?._id, documentLink: pForm.documentLink.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Proposal submitted!");
      setProposalModal(null); setPForm({ title: "", solutionSummary: "", detailedPlan: "", estimatedBudget: "", estimatedTimelineMonths: "", documentLink: "" }); loadAll();
    } catch (e) { setProposalMsg(e.message); }
    finally { setProposalLoading(false); }
  };

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    if (!mForm.milestoneTitle.trim() || !mForm.description.trim()) { showToast("Title and description required.", "error"); return; }
    const pct = Number(mForm.completionPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) { showToast("Percentage must be 0–100.", "error"); return; }
    setMilestoneLoading(true);
    try {
      const evidenceLinks = mForm.evidenceLinks ? mForm.evidenceLinks.split(",").map(l => l.trim()).filter(Boolean) : [];
      const res  = await fetch(`${UNI_API}/milestones`, { method: "POST", headers: jsonH(token), body: JSON.stringify({ proposalId: milestoneModal._id, milestoneTitle: mForm.milestoneTitle.trim(), status: mForm.status, completionPercentage: pct, description: mForm.description.trim(), evidenceLinks }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Milestone submitted!");
      setMilestoneModal(null); loadAll();
    } catch (e) { showToast(e.message, "error"); }
    finally { setMilestoneLoading(false); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setProjLoading(true);
    try {
      const res  = await fetch(`${UNI_API}/projects`, { method: "POST", headers: jsonH(token), body: JSON.stringify({ proposalId: createProjModal._id, title: projForm.title.trim() || createProjModal.title, description: projForm.description.trim(), expectedEndDate: projForm.expectedEndDate || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Project started!");
      setCreateProjModal(null); setProjForm({ title: "", description: "", expectedEndDate: "" }); loadAll();
    } catch (e) { showToast(e.message, "error"); }
    finally { setProjLoading(false); }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    setProgLoading(true);
    try {
      const res  = await fetch(`${UNI_API}/projects/${progressModal._id}/progress`, { method: "PATCH", headers: jsonH(token), body: JSON.stringify({ overallProgress: Number(progForm.overallProgress), progressNote: progForm.progressNote, status: progForm.status }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Progress updated!");
      setProgressModal(null); loadAll();
    } catch (e) { showToast(e.message, "error"); }
    finally { setProgLoading(false); }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!uploadFile) { showToast("Select a file first.", "error"); return; }
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("document", uploadFile);
      fd.append("description", uploadDesc);
      const res  = await fetch(`${UNI_API}/projects/${uploadModal._id}/documents`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Document uploaded!");
      setUploadModal(null); setUploadFile(null); setUploadDesc(""); loadAll();
    } catch (e) { showToast(e.message, "error"); }
    finally { setUploadLoading(false); }
  };

  const handleLogout = async () => { await logout(); navigate("/university/login"); };

  const uniName  = user?.universityName || "University";
  const initials = (user?.name || "U").slice(0, 2).toUpperCase();

  const NAV = [
    { key: "overview",   label: "Overview",   icon: <LayoutDashboard size={18} /> },
    { key: "challenges", label: "Challenges",  icon: <Target size={18} />,    badge: pendingCount },
    { key: "teams",      label: "Teams",       icon: <Users size={18} /> },
    { key: "proposals",  label: "Proposals",   icon: <FileCheck2 size={18} /> },
    { key: "milestones", label: "Milestones",  icon: <BarChart3 size={18} /> },
    { key: "projects",   label: "Projects",    icon: <FolderOpen size={18} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="d2-root">

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {sidebarOpen && <div className="d2-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className={`d2-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="d2-logo">
          <div className="d2-logo-mark">🌿</div>
          <div className="d2-logo-text">
            <span className="d2-logo-title">Jharkhand</span>
            <span className="d2-logo-sub">Innovation Portal</span>
          </div>
        </div>

        {/* University badge */}
        <div className="d2-uni-badge">
          <div className="d2-uni-avatar">{initials}</div>
          <div>
            <p className="d2-uni-name">{uniName}</p>
            <p className="d2-uni-role">{user?.name || "Coordinator"}</p>
          </div>
          <div className="d2-verified-dot" title="Verified">✓</div>
        </div>

        {/* Nav */}
        <nav className="d2-nav">
          {NAV.map(n => (
            <button
              key={n.key}
              className={`d2-nav-btn ${tab === n.key ? "active" : ""}`}
              onClick={() => { setTab(n.key); setSidebarOpen(false); }}
            >
              <span className="d2-nav-icon">{n.icon}</span>
              <span className="d2-nav-label">{n.label}</span>
              {n.badge > 0 && <span className="d2-nav-badge">{n.badge}</span>}
              {tab === n.key && <span className="d2-nav-active-bar" />}
            </button>
          ))}
        </nav>

        <div className="d2-sidebar-divider" />

        {/* Bottom links */}
        <button className="d2-nav-btn" onClick={() => navigate("/university/profile")}>
          <span className="d2-nav-icon"><UserRound size={18} /></span>
          <span className="d2-nav-label">Profile</span>
        </button>
        <button className="d2-nav-btn" onClick={() => navigate("/government-dashboard")}>
          <span className="d2-nav-icon">🏛️</span>
          <span className="d2-nav-label">Govt Portal</span>
        </button>

        <div className="d2-sidebar-footer">
          <button className="d2-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="d2-main">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <header className="d2-topbar">
          <div className="d2-topbar-left">
            <button className="d2-hamburger" onClick={() => setSidebarOpen(s => !s)}>
              <Menu size={22} />
            </button>
            <div className="d2-topbar-title">
              <h1>{NAV.find(n => n.key === tab)?.label || "Dashboard"}</h1>
              <p>{uniName}</p>
            </div>
          </div>
          <div className="d2-topbar-right">
            <button className="d2-topbar-icon" onClick={loadAll} title="Refresh data">
              <RefreshCw size={19} />
            </button>
            <button className="d2-topbar-icon" onClick={() => showToast("No new notifications")} title="Notifications">
              <Bell size={19} />
              {pendingCount > 0 && <span className="d2-topbar-badge">{pendingCount}</span>}
            </button>
            <button className="d2-topbar-icon" onClick={() => navigate("/university/profile")}>
              <div className="d2-topbar-avatar">{initials}</div>
            </button>
          </div>
        </header>

        {/* ── Toast ───────────────────────────────────────────────────────── */}
        {toast && (
          <div className={`d2-toast d2-toast-${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)}><X size={14} /></button>
          </div>
        )}

        {/* ── Page body ───────────────────────────────────────────────────── */}
        <div className="d2-body">

          {error && (
            <div className="d2-error-bar">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={loadAll} className="d2-error-retry"><RefreshCw size={12} /> Retry</button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              OVERVIEW
          ══════════════════════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div className="d2-fade">
              {/* Hero */}
              <div className="d2-hero">
                <div className="d2-hero-text">
                  <div className="d2-hero-chip">🎓 Higher Education Innovation Portal</div>
                  <h2 className="d2-hero-title">Welcome back, {uniName}</h2>
                  <p className="d2-hero-desc">Manage societal challenges, lead multidisciplinary teams, and track field-verified milestones — all in one place.</p>
                  <div className="d2-hero-actions">
                    <button className="d2-hero-btn" onClick={() => setTab("challenges")}>
                      View Challenges <ArrowRight size={14} />
                    </button>
                    <button className="d2-hero-btn-ghost" onClick={loadAll}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </div>
                <div className="d2-hero-illustration" aria-hidden>
                  <div className="d2-hero-ring d2-ring-1" />
                  <div className="d2-hero-ring d2-ring-2" />
                  <div className="d2-hero-ring d2-ring-3" />
                  <span className="d2-hero-emoji">🏫</span>
                </div>
              </div>

              {/* Stat cards */}
              <div className="d2-stats">
                <StatCard accent="#0d9488" icon={<Target size={20} />}  label="Assigned"        value={challenges.length} sub={`${pendingCount} pending action`}    onClick={() => setTab("challenges")} />
                <StatCard accent="#2563eb" icon={<Zap size={20} />}     label="Available"       value={pendingCount}      sub="Awaiting response"                  onClick={() => setTab("challenges")} />
                <StatCard accent="#16a34a" icon={<Award size={20} />}   label="Accepted"        value={acceptedCount}     sub={`${challenges.filter(c => c.status === "in-progress").length} in progress`} onClick={() => setTab("challenges")} />
                <StatCard accent="#7c3aed" icon={<Users size={20} />}   label="Teams"           value={teams.length}      sub={`${teams.reduce((a, t) => a + (t.members?.length || 0), 0)} members`}  onClick={() => setTab("teams")} />
                <StatCard accent="#ea580c" icon={<FolderOpen size={20} />} label="Active Projects" value={activeProjects} sub={`${completedProj} completed`}          onClick={() => setTab("projects")} />
                <StatCard accent="#0891b2" icon={<BarChart3 size={20} />} label="Avg Progress"  value={`${avgProgress}%`} sub={`${milestones.length} updates`}        onClick={() => setTab("milestones")} />
              </div>

              {loading ? (
                <SkeletonGrid />
              ) : (
                <div className="d2-overview-grid">
                  {/* Pending Challenges */}
                  <div className="d2-card">
                    <CardHead icon={<Target size={16} />} title="Pending Action" count={pendingCount} color="#d97706" onMore={() => setTab("challenges")} />
                    {challenges.filter(c => c.status === "assigned").length === 0
                      ? <Empty icon="🎯" text="No challenges awaiting response" />
                      : challenges.filter(c => c.status === "assigned").slice(0, 4).map(c => (
                        <div className="d2-list-row" key={c._id}>
                          <div className="d2-list-dot" style={{ background: "#d97706" }} />
                          <div className="d2-list-body">
                            <p className="d2-list-title">{c.title}</p>
                            <p className="d2-list-meta">{c.district} · {cap(c.priority)} priority</p>
                          </div>
                          <div className="d2-list-actions">
                            <button className="d2-pill-accept" disabled={actionLoadingId === c._id} onClick={() => handleAccept(c._id)}>
                              {actionLoadingId === c._id ? "…" : "Accept"}
                            </button>
                            <button className="d2-pill-reject" disabled={actionLoadingId === c._id} onClick={() => { setRejectModal(c); setRejectReason(""); }}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* My Teams */}
                  <div className="d2-card">
                    <CardHead icon={<Users size={16} />} title="My Teams" count={teams.length} color="#7c3aed" onMore={() => setTab("teams")} />
                    {teams.length === 0
                      ? <Empty icon="👥" text="No teams yet — accept a challenge first" />
                      : teams.slice(0, 4).map(t => (
                        <div className="d2-list-row" key={t._id}>
                          <div className="d2-member-avi" style={{ background: "#ede9fe", color: "#7c3aed" }}>{t.teamName.charAt(0)}</div>
                          <div className="d2-list-body">
                            <p className="d2-list-title">{t.teamName}</p>
                            <p className="d2-list-meta">{t.members?.length || 0} members · {t.challenge?.title || "—"}</p>
                          </div>
                          <StatusPill status={t.status} />
                        </div>
                      ))
                    }
                  </div>

                  {/* Recent Proposals */}
                  <div className="d2-card">
                    <CardHead icon={<FileCheck2 size={16} />} title="Proposals" count={proposals.length} color="#ea580c" onMore={() => setTab("proposals")} />
                    {proposals.length === 0
                      ? <Empty icon="📑" text="No proposals submitted yet" />
                      : proposals.slice(0, 4).map(p => (
                        <div className="d2-list-row" key={p._id}>
                          <div className="d2-list-dot" style={{ background: p.status === "approved" ? "#16a34a" : p.status === "rejected" ? "#dc2626" : "#d97706" }} />
                          <div className="d2-list-body">
                            <p className="d2-list-title">{p.title}</p>
                            <p className="d2-list-meta">₹{fmt(p.estimatedBudget)} · {p.estimatedTimelineMonths}mo</p>
                          </div>
                          <StatusPill status={p.status} />
                        </div>
                      ))
                    }
                  </div>

                  {/* Milestones */}
                  <div className="d2-card">
                    <CardHead icon={<BarChart3 size={16} />} title="Recent Milestones" count={milestones.length} color="#0891b2" onMore={() => setTab("milestones")} />
                    {milestones.length === 0
                      ? <Empty icon="📊" text="No milestones yet" />
                      : milestones.slice(0, 4).map(m => (
                        <div className="d2-milestone-row" key={m._id}>
                          <div className="d2-milestone-top">
                            <p className="d2-list-title">{m.milestoneTitle}</p>
                            <span className="d2-pct">{m.completionPercentage}%</span>
                          </div>
                          <div className="d2-prog-track">
                            <div className="d2-prog-fill" style={{ width: `${m.completionPercentage}%` }} />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              CHALLENGES
          ══════════════════════════════════════════════════════════════ */}
          {tab === "challenges" && (
            <div className="d2-fade">
              <PageHead title="Challenges" sub={`${challenges.length} total · ${pendingCount} pending · ${acceptedCount} accepted`} onRefresh={loadAll} />

              {/* Filter chips */}
              <div className="d2-filter-chips">
                {["all", "assigned", "accepted", "in-progress", "completed", "rejected"].map(s => {
                  const count = s === "all" ? challenges.length : challenges.filter(c => c.status === s).length;
                  return (
                    <button key={s} className="d2-chip" onClick={() => {}} style={{ cursor: "default" }}>
                      {s === "all" ? "All" : cap(s)} <span className="d2-chip-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {loading ? <SkeletonList />
                : challenges.length === 0 ? <EmptyPage icon="🎯" title="No Challenges Yet" desc="Challenges assigned by the government will appear here." />
                : (
                  <div className="d2-list-stack">
                    {challenges.map(c => (
                      <div className={`d2-challenge-card d2-status-left-${c.status === "rejected" ? "red" : c.status === "accepted" || c.status === "completed" ? "green" : c.status === "in-progress" ? "amber" : "blue"}`} key={c._id}>
                        <div className="d2-challenge-body">
                          <div className="d2-challenge-meta-row">
                            <StatusPill status={c.status} />
                            <span className={`d2-priority-chip p-${c.priority}`}>{cap(c.priority)}</span>
                            {c.category && <span className="d2-category-chip">{c.category}</span>}
                          </div>
                          <h3 className="d2-card-title">{c.title}</h3>
                          <p className="d2-card-meta">📍 {c.district} &nbsp;·&nbsp; 📅 Deadline: {dateStr(c.deadline)}</p>
                          {c.description && <p className="d2-card-desc">{c.description}</p>}
                          {c.status === "rejected" && c.rejectionReason && (
                            <div className="d2-rejection-note">
                              <XCircle size={13} /> <span>{c.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                        <div className="d2-challenge-actions">
                          {c.status === "assigned" && (
                            <>
                              <button className="d2-btn-green" disabled={actionLoadingId === c._id} onClick={() => handleAccept(c._id)}>
                                <CheckCircle size={14} /> Accept
                              </button>
                              <button className="d2-btn-red-outline" disabled={actionLoadingId === c._id} onClick={() => { setRejectModal(c); setRejectReason(""); }}>
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                          {c.status === "accepted" && (
                            <button className="d2-btn-primary" onClick={() => {
                              const existing = teams.find(t => t.challenge?._id === c._id);
                              if (existing) showToast("Team already exists for this challenge.");
                              else { setTeamModal(c); setTeamName(""); setTeamMembers([{ name: "", email: "", role: "Team Lead", department: "" }]); setTeamMsg(""); }
                            }}>
                              <Plus size={14} /> Create Team
                            </button>
                          )}
                          {c.status === "in-progress" && <span className="d2-status-chip chip-amber">🔄 In Progress</span>}
                          {c.status === "completed" && <span className="d2-status-chip chip-green">✅ Completed</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TEAMS
          ══════════════════════════════════════════════════════════════ */}
          {tab === "teams" && (
            <div className="d2-fade">
              <PageHead title="My Teams" sub={`${teams.length} teams · ${teams.reduce((a, t) => a + (t.members?.length || 0), 0)} total members`} onRefresh={loadAll} />
              {loading ? <SkeletonGrid />
                : teams.length === 0 ? <EmptyPage icon="👥" title="No Teams Yet" desc="Accept a challenge and create your first multidisciplinary team." action={{ label: "Go to Challenges", onClick: () => setTab("challenges") }} />
                : (
                  <div className="d2-teams-grid">
                    {teams.map(t => {
                      const hasProposal = proposals.some(p => p.team?._id === t._id);
                      return (
                        <div className="d2-team-card" key={t._id}>
                          <div className="d2-team-card-header">
                            <div className="d2-team-icon">{t.teamName.charAt(0)}</div>
                            <div className="d2-team-info">
                              <h3 className="d2-team-name">{t.teamName}</h3>
                              <p className="d2-card-meta">{t.challenge?.title || "No challenge"}</p>
                            </div>
                            <StatusPill status={t.status} />
                          </div>

                          <div className="d2-members-section">
                            <p className="d2-members-label">{t.members?.length || 0} Members</p>
                            {(t.members || []).map((m, i) => (
                              <div className="d2-member-row" key={i}>
                                <div className="d2-member-avi">{m.name.charAt(0).toUpperCase()}</div>
                                <div>
                                  <p className="d2-member-name">{m.name}</p>
                                  <p className="d2-member-role">{m.role}{m.department ? ` · ${m.department}` : ""}</p>
                                </div>
                                {m.role === "Faculty Mentor" && <span className="d2-mentor-tag">Mentor</span>}
                              </div>
                            ))}
                          </div>

                          <div className="d2-team-card-footer">
                            <button className="d2-btn-outline-sm" onClick={() => { setMentorModal(t); setMentorForm({ name: "", email: "", department: "" }); }}>
                              <UserRound size={13} /> Add Mentor
                            </button>
                            {!hasProposal && t.challenge?._id && (
                              <button className="d2-btn-primary-sm" onClick={() => { setProposalModal(t); setPForm({ title: "", solutionSummary: "", detailedPlan: "", estimatedBudget: "", estimatedTimelineMonths: "", documentLink: "" }); setProposalMsg(""); }}>
                                <FileCheck2 size={13} /> Submit Proposal
                              </button>
                            )}
                            {hasProposal && <span className="d2-submitted-tag">✓ Proposal submitted</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              PROPOSALS
          ══════════════════════════════════════════════════════════════ */}
          {tab === "proposals" && (
            <div className="d2-fade">
              <PageHead title="Proposals" sub={`${proposals.length} submitted · ${proposals.filter(p => p.status === "approved").length} approved`} onRefresh={loadAll} />
              {loading ? <SkeletonList />
                : proposals.length === 0 ? <EmptyPage icon="📑" title="No Proposals Yet" desc="Create a team and submit a solution proposal for an accepted challenge." action={{ label: "View Teams", onClick: () => setTab("teams") }} />
                : (
                  <div className="d2-list-stack">
                    {proposals.map(p => {
                      const hasProject = projects.some(pr => pr.proposal?._id === p._id || pr.proposal === p._id);
                      return (
                        <div className="d2-proposal-card" key={p._id}>
                          <div className="d2-proposal-top">
                            <div className="d2-proposal-left">
                              <div className="d2-proposal-title-row">
                                <h3 className="d2-card-title">{p.title}</h3>
                                <StatusPill status={p.status} />
                              </div>
                              <div className="d2-proposal-meta-grid">
                                <span><Users size={12} /> {p.team?.teamName || "—"}</span>
                                <span><Flag size={12} /> {p.challenge?.title || "—"}</span>
                                <span><Award size={12} /> ₹{fmt(p.estimatedBudget)}</span>
                                <span><Clock size={12} /> {p.estimatedTimelineMonths} months</span>
                                <span><Calendar size={12} /> {dateStr(p.submittedAt || p.createdAt)}</span>
                              </div>
                              {p.reviewComment && (
                                <div className="d2-review-note">
                                  <span>💬</span> <span>{p.reviewComment}</span>
                                </div>
                              )}
                              {p.documentLink && (
                                <a href={p.documentLink} target="_blank" rel="noreferrer" className="d2-doc-link">
                                  <Paperclip size={12} /> View Document
                                </a>
                              )}
                            </div>
                            <div className="d2-proposal-actions">
                              {p.status === "approved" && (
                                <>
                                  <button className="d2-btn-primary-sm" onClick={() => { setMilestoneModal(p); setMForm({ milestoneTitle: "", status: "on-track", completionPercentage: 0, description: "", evidenceLinks: "" }); }}>
                                    <BarChart3 size={13} /> Add Milestone
                                  </button>
                                  {!hasProject && (
                                    <button className="d2-btn-outline-sm" onClick={() => { setCreateProjModal(p); setProjForm({ title: p.title, description: "", expectedEndDate: "" }); }}>
                                      <FolderOpen size={13} /> Start Project
                                    </button>
                                  )}
                                </>
                              )}
                              {p.status === "submitted" && (
                                <span className="d2-status-chip chip-amber"><Clock size={12} /> Awaiting Review</span>
                              )}
                              {p.status === "under-review" && (
                                <span className="d2-status-chip chip-blue">🔍 Under Review</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MILESTONES
          ══════════════════════════════════════════════════════════════ */}
          {tab === "milestones" && (
            <div className="d2-fade">
              <PageHead title="Milestones & Progress" sub={`${milestones.length} updates · ${avgProgress}% average completion`} onRefresh={loadAll} />

              {proposals.filter(p => p.status === "approved").length > 0 && (
                <div className="d2-info-banner">
                  <span>💡</span>
                  <span>You have <strong>{proposals.filter(p => p.status === "approved").length}</strong> approved proposal(s). Keep milestones updated to show progress.</span>
                  <button className="d2-btn-primary-sm" onClick={() => { const ap = proposals.find(p => p.status === "approved"); if (ap) { setMilestoneModal(ap); setMForm({ milestoneTitle: "", status: "on-track", completionPercentage: 0, description: "", evidenceLinks: "" }); } }}>
                    + Add Update
                  </button>
                </div>
              )}

              {loading ? <SkeletonList />
                : milestones.length === 0 ? <EmptyPage icon="📊" title="No Milestones Yet" desc="Milestones can be submitted once your proposal is approved by the government." />
                : (
                  <div className="d2-list-stack">
                    {milestones.map(m => (
                      <div className="d2-milestone-card" key={m._id}>
                        <div className="d2-milestone-header">
                          <div className="d2-milestone-left">
                            <div className="d2-milestone-title-row">
                              <h3 className="d2-card-title">{m.milestoneTitle}</h3>
                              <StatusPill status={m.status} />
                            </div>
                            <p className="d2-card-meta">{m.challenge?.title || "—"} · {m.proposal?.title || "—"} · {dateStr(m.submittedAt || m.createdAt)}</p>
                            {m.description && <p className="d2-card-desc">{m.description}</p>}
                          </div>
                          <div className="d2-milestone-pct-ring">
                            <svg viewBox="0 0 40 40" className="d2-ring-svg">
                              <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                              <circle cx="20" cy="20" r="16" fill="none" stroke={m.status === "completed" ? "#16a34a" : m.status === "delayed" ? "#dc2626" : "#0d9488"}
                                strokeWidth="4" strokeDasharray={`${m.completionPercentage} ${100 - m.completionPercentage}`}
                                strokeDashoffset="25" strokeLinecap="round" />
                            </svg>
                            <span className="d2-ring-label">{m.completionPercentage}%</span>
                          </div>
                        </div>
                        <div className="d2-prog-track" style={{ marginTop: "12px" }}>
                          <div className="d2-prog-fill" style={{ width: `${m.completionPercentage}%`, background: m.status === "delayed" ? "#dc2626" : undefined }} />
                        </div>
                        {m.evidenceLinks?.length > 0 && (
                          <div className="d2-evidence-links">
                            {m.evidenceLinks.map((l, i) => (
                              <a key={i} href={l} target="_blank" rel="noreferrer" className="d2-evidence-chip">
                                <Paperclip size={11} /> Evidence {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              PROJECTS
          ══════════════════════════════════════════════════════════════ */}
          {tab === "projects" && (
            <div className="d2-fade">
              <PageHead title="Projects" sub={`${activeProjects} active · ${completedProj} completed`} onRefresh={loadAll} />

              {proposals.filter(p => p.status === "approved" && !projects.some(pr => pr.proposal?._id === p._id || pr.proposal === p._id)).length > 0 && (
                <div className="d2-info-banner">
                  <FolderOpen size={15} />
                  <span>You have approved proposals without projects. Go to Proposals to start a project.</span>
                  <button className="d2-btn-primary-sm" onClick={() => setTab("proposals")}>View Proposals</button>
                </div>
              )}

              {loading ? <SkeletonList />
                : projects.length === 0 ? <EmptyPage icon="🚀" title="No Projects Yet" desc="Start a project from an approved proposal in the Proposals tab." action={{ label: "View Proposals", onClick: () => setTab("proposals") }} />
                : (
                  <div className="d2-list-stack">
                    {projects.map(proj => (
                      <div className="d2-project-card" key={proj._id}>
                        <div className="d2-project-header">
                          <div className="d2-project-icon-wrap" style={{ background: proj.status === "completed" ? "#dcfce7" : "#f0fdfa" }}>
                            <FolderOpen size={22} style={{ color: proj.status === "completed" ? "#16a34a" : "#0d9488" }} />
                          </div>
                          <div className="d2-project-info">
                            <div className="d2-project-title-row">
                              <h3 className="d2-card-title">{proj.title}</h3>
                              <StatusPill status={proj.status} />
                            </div>
                            <div className="d2-proposal-meta-grid">
                              <span><Flag size={12} /> {proj.challenge?.title || "—"}</span>
                              <span><Users size={12} /> {proj.team?.teamName || "—"}</span>
                              <span><Calendar size={12} /> Started {dateStr(proj.startDate)}</span>
                              {proj.expectedEndDate && <span><Clock size={12} /> Due {dateStr(proj.expectedEndDate)}</span>}
                            </div>
                          </div>
                          <div className="d2-project-pct">
                            <span className="d2-pct-big" style={{ color: proj.status === "completed" ? "#16a34a" : "#0d9488" }}>{proj.overallProgress}%</span>
                            <span className="d2-pct-label">complete</span>
                          </div>
                        </div>

                        <div className="d2-prog-track" style={{ margin: "14px 0 10px" }}>
                          <div className="d2-prog-fill" style={{ width: `${proj.overallProgress}%`, background: proj.status === "completed" ? "#16a34a" : undefined }} />
                        </div>

                        {proj.progressNote && <p className="d2-progress-note">"{proj.progressNote}"</p>}

                        {proj.documents?.length > 0 && (
                          <div className="d2-doc-chips">
                            {proj.documents.map((d, i) => (
                              <a key={i} href={d.fileUrl} target="_blank" rel="noreferrer" className="d2-doc-chip">
                                <Paperclip size={11} /> {d.fileName}
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="d2-project-actions">
                          {proj.status !== "completed" && (
                            <button className="d2-btn-primary-sm" onClick={() => { setProgressModal(proj); setProgForm({ overallProgress: proj.overallProgress, progressNote: proj.progressNote || "", status: proj.status }); }}>
                              <TrendingUp size={13} /> Update Progress
                            </button>
                          )}
                          <button className="d2-btn-outline-sm" onClick={() => { setUploadModal(proj); setUploadFile(null); setUploadDesc(""); }}>
                            <UploadCloud size={13} /> Upload Doc
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

        </div>{/* /d2-body */}
      </div>{/* /d2-main */}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Reject */}
      {rejectModal && (
        <Drawer title="Reject Challenge" onClose={() => { setRejectModal(null); setRejectReason(""); }}>
          <p className="d2-modal-desc">Rejecting: <strong>{rejectModal.title}</strong></p>
          <form onSubmit={handleRejectSubmit}>
            <FLabel>Reason for rejection *</FLabel>
            <textarea className="d2-ta" rows={4} required value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why your university cannot undertake this challenge…" />
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => { setRejectModal(null); setRejectReason(""); }}>Cancel</button>
              <button type="submit" className="d2-btn-red" disabled={actionLoadingId === rejectModal._id}>{actionLoadingId === rejectModal._id ? "Rejecting…" : "Confirm Rejection"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

      {/* Create Team */}
      {teamModal && (
        <Drawer title="Create Multidisciplinary Team" onClose={() => { if (!teamLoading) { setTeamModal(null); setTeamMsg(""); } }}>
          <p className="d2-modal-desc">Challenge: <strong>{teamModal.title}</strong></p>
          {teamMsg && <div className="d2-form-err">{teamMsg}</div>}
          <form onSubmit={handleCreateTeam}>
            <FLabel>Team Name *</FLabel>
            <input className="d2-inp" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. BIT Water Innovation Team" disabled={teamLoading} />

            <div className="d2-members-bar">
              <FLabel style={{ margin: 0 }}>Members</FLabel>
              <button type="button" className="d2-btn-primary-sm" onClick={addMember} disabled={teamLoading}><Plus size={13} /> Add</button>
            </div>

            <div className="d2-members-scroll">
              {teamMembers.map((m, i) => (
                <div className="d2-member-form-card" key={i}>
                  <div className="d2-mfc-head">
                    <span className="d2-mfc-num">#{i + 1}</span>
                    {teamMembers.length > 1 && (
                      <button type="button" className="d2-mfc-remove" onClick={() => removeMember(i)} disabled={teamLoading}><Trash2 size={13} /></button>
                    )}
                  </div>
                  <div className="d2-mfc-grid">
                    <input className="d2-inp" placeholder="Full name" value={m.name} onChange={e => memberChange(i, "name", e.target.value)} disabled={teamLoading} />
                    <input className="d2-inp" placeholder="Email" type="email" value={m.email} onChange={e => memberChange(i, "email", e.target.value)} disabled={teamLoading} />
                    <select className="d2-inp" value={m.role} onChange={e => memberChange(i, "role", e.target.value)} disabled={teamLoading}>
                      <option value="Team Lead">Team Lead</option>
                      <option value="Faculty Mentor">Faculty Mentor</option>
                      <option value="Researcher">Researcher</option>
                      <option value="Member">Member</option>
                    </select>
                    <input className="d2-inp" placeholder="Department" value={m.department} onChange={e => memberChange(i, "department", e.target.value)} disabled={teamLoading} />
                  </div>
                </div>
              ))}
            </div>
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => { if (!teamLoading) { setTeamModal(null); setTeamMsg(""); } }}>Cancel</button>
              <button type="submit" className="d2-btn-primary" disabled={teamLoading}>{teamLoading ? "Creating…" : "Create Team"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

      {/* Add Faculty Mentor */}
      {mentorModal && (
        <Drawer title="Add Faculty Mentor" onClose={() => { if (!mentorLoading) setMentorModal(null); }}>
          <p className="d2-modal-desc">Team: <strong>{mentorModal.teamName}</strong></p>
          <form onSubmit={handleAddMentor}>
            <FLabel>Full Name *</FLabel>
            <input className="d2-inp" value={mentorForm.name} onChange={e => setMentorForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. Firstname Lastname" disabled={mentorLoading} />
            <FLabel>Email *</FLabel>
            <input className="d2-inp" type="email" value={mentorForm.email} onChange={e => setMentorForm(p => ({ ...p, email: e.target.value }))} placeholder="mentor@university.ac.in" disabled={mentorLoading} />
            <FLabel>Department</FLabel>
            <input className="d2-inp" value={mentorForm.department} onChange={e => setMentorForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Civil Engineering" disabled={mentorLoading} />
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => setMentorModal(null)}>Cancel</button>
              <button type="submit" className="d2-btn-primary" disabled={mentorLoading}>{mentorLoading ? "Adding…" : "Add Mentor"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

      {/* Submit Proposal */}
      {proposalModal && (
        <Drawer title="Submit Solution Proposal" wide onClose={() => { if (!proposalLoading) { setProposalModal(null); setProposalMsg(""); } }}>
          <p className="d2-modal-desc">Team: <strong>{proposalModal.teamName}</strong> · Challenge: <strong>{proposalModal.challenge?.title || "—"}</strong></p>
          {proposalMsg && <div className="d2-form-err">{proposalMsg}</div>}
          <form onSubmit={handleSubmitProposal}>
            <FLabel>Proposal Title *</FLabel>
            <input className="d2-inp" value={pForm.title} placeholder="e.g. Smart Water Purification System" onChange={e => setPForm(p => ({ ...p, title: e.target.value }))} disabled={proposalLoading} />
            <FLabel>Solution Summary *</FLabel>
            <textarea className="d2-ta" rows={3} value={pForm.solutionSummary} placeholder="Brief overview of your proposed solution…" onChange={e => setPForm(p => ({ ...p, solutionSummary: e.target.value }))} disabled={proposalLoading} />
            <FLabel>Detailed Implementation Plan *</FLabel>
            <textarea className="d2-ta" rows={5} value={pForm.detailedPlan} placeholder="Step-by-step approach, technology, team roles, expected outcomes…" onChange={e => setPForm(p => ({ ...p, detailedPlan: e.target.value }))} disabled={proposalLoading} />
            <div className="d2-form-row">
              <div>
                <FLabel>Estimated Budget (₹) *</FLabel>
                <input className="d2-inp" type="number" min="1" value={pForm.estimatedBudget} placeholder="e.g. 250000" onChange={e => setPForm(p => ({ ...p, estimatedBudget: e.target.value }))} disabled={proposalLoading} />
              </div>
              <div>
                <FLabel>Timeline (months) *</FLabel>
                <input className="d2-inp" type="number" min="1" value={pForm.estimatedTimelineMonths} placeholder="e.g. 6" onChange={e => setPForm(p => ({ ...p, estimatedTimelineMonths: e.target.value }))} disabled={proposalLoading} />
              </div>
            </div>
            <FLabel>Document Link (optional)</FLabel>
            <input className="d2-inp" type="url" value={pForm.documentLink} placeholder="https://drive.google.com/…" onChange={e => setPForm(p => ({ ...p, documentLink: e.target.value }))} disabled={proposalLoading} />
            <p className="d2-inp-hint">Paste a shareable Google Drive / OneDrive link</p>
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => { if (!proposalLoading) { setProposalModal(null); setProposalMsg(""); } }}>Cancel</button>
              <button type="submit" className="d2-btn-primary" disabled={proposalLoading}>{proposalLoading ? "Submitting…" : "Submit Proposal"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

      {/* Add Milestone */}
      {milestoneModal && (
        <Drawer title="Submit Milestone Update" onClose={() => { if (!milestoneLoading) setMilestoneModal(null); }}>
          <p className="d2-modal-desc">Proposal: <strong>{milestoneModal.title}</strong></p>
          <form onSubmit={handleSubmitMilestone}>
            <FLabel>Milestone Title *</FLabel>
            <input className="d2-inp" value={mForm.milestoneTitle} placeholder="e.g. IoT Sensor Calibration Complete" onChange={e => setMForm(p => ({ ...p, milestoneTitle: e.target.value }))} disabled={milestoneLoading} />
            <div className="d2-form-row">
              <div>
                <FLabel>Status *</FLabel>
                <select className="d2-inp" value={mForm.status} onChange={e => setMForm(p => ({ ...p, status: e.target.value }))} disabled={milestoneLoading}>
                  <option value="on-track">On Track</option>
                  <option value="delayed">Delayed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <FLabel>Completion % *</FLabel>
                <input className="d2-inp" type="number" min="0" max="100" value={mForm.completionPercentage} onChange={e => setMForm(p => ({ ...p, completionPercentage: e.target.value }))} disabled={milestoneLoading} />
              </div>
            </div>
            <div className="d2-prog-track" style={{ marginBottom: "14px" }}>
              <div className="d2-prog-fill" style={{ width: `${mForm.completionPercentage}%` }} />
            </div>
            <FLabel>Work Description *</FLabel>
            <textarea className="d2-ta" rows={4} value={mForm.description} placeholder="Describe work completed in this milestone…" onChange={e => setMForm(p => ({ ...p, description: e.target.value }))} disabled={milestoneLoading} />
            <FLabel>Evidence Links (comma-separated)</FLabel>
            <input className="d2-inp" value={mForm.evidenceLinks} placeholder="https://github.com/…, https://drive.google.com/…" onChange={e => setMForm(p => ({ ...p, evidenceLinks: e.target.value }))} disabled={milestoneLoading} />
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => { if (!milestoneLoading) setMilestoneModal(null); }}>Cancel</button>
              <button type="submit" className="d2-btn-primary" disabled={milestoneLoading}>{milestoneLoading ? "Submitting…" : "Submit Milestone"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

      {/* Start Project */}
      {createProjModal && (
        <Drawer title="Start Project" onClose={() => { if (!projLoading) setCreateProjModal(null); }}>
          <p className="d2-modal-desc">From proposal: <strong>{createProjModal.title}</strong></p>
          <form onSubmit={handleCreateProject}>
            <FLabel>Project Title</FLabel>
            <input className="d2-inp" value={projForm.title} onChange={e => setProjForm(p => ({ ...p, title: e.target.value }))} placeholder="Defaults to proposal title" disabled={projLoading} />
            <FLabel>Description</FLabel>
            <textarea className="d2-ta" rows={3} value={projForm.description} onChange={e => setProjForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief project description…" disabled={projLoading} />
            <FLabel>Expected End Date</FLabel>
            <input className="d2-inp" type="date" value={projForm.expectedEndDate} onChange={e => setProjForm(p => ({ ...p, expectedEndDate: e.target.value }))} disabled={projLoading} />
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => setCreateProjModal(null)}>Cancel</button>
              <button type="submit" className="d2-btn-primary" disabled={projLoading}>{projLoading ? "Starting…" : "Start Project"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

      {/* Update Progress */}
      {progressModal && (
        <Drawer title="Update Project Progress" onClose={() => { if (!progLoading) setProgressModal(null); }}>
          <p className="d2-modal-desc">Project: <strong>{progressModal.title}</strong></p>
          <form onSubmit={handleUpdateProgress}>
            <FLabel>Overall Progress — {progForm.overallProgress}%</FLabel>
            <input type="range" min="0" max="100" value={progForm.overallProgress} onChange={e => setProgForm(p => ({ ...p, overallProgress: e.target.value }))} className="d2-slider" disabled={progLoading} />
            <div className="d2-prog-track" style={{ marginBottom: "16px" }}>
              <div className="d2-prog-fill" style={{ width: `${progForm.overallProgress}%` }} />
            </div>
            <FLabel>Project Status</FLabel>
            <select className="d2-inp" value={progForm.status} onChange={e => setProgForm(p => ({ ...p, status: e.target.value }))} disabled={progLoading}>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <FLabel>Progress Note</FLabel>
            <textarea className="d2-ta" rows={3} value={progForm.progressNote} onChange={e => setProgForm(p => ({ ...p, progressNote: e.target.value }))} placeholder="What was achieved recently?" disabled={progLoading} />
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => setProgressModal(null)}>Cancel</button>
              <button type="submit" className="d2-btn-primary" disabled={progLoading}>{progLoading ? "Saving…" : "Save Progress"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

      {/* Upload Document */}
      {uploadModal && (
        <Drawer title="Upload Document" onClose={() => { if (!uploadLoading) { setUploadModal(null); setUploadFile(null); setUploadDesc(""); } }}>
          <p className="d2-modal-desc">Project: <strong>{uploadModal.title}</strong></p>
          <form onSubmit={handleUploadDoc}>
            <div className="d2-file-zone" onClick={() => fileRef.current?.click()}>
              <UploadCloud size={32} strokeWidth={1.5} />
              {uploadFile
                ? <><p className="d2-file-name">{uploadFile.name}</p><p className="d2-file-size">{(uploadFile.size / 1024).toFixed(1)} KB</p></>
                : <><p className="d2-file-prompt">Click or drag to upload</p><p className="d2-file-hint">PDF, DOCX, XLS, PNG, JPG — max 20 MB</p></>
              }
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={e => setUploadFile(e.target.files[0] || null)} />
            <FLabel>Description (optional)</FLabel>
            <input className="d2-inp" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="e.g. Final Report Q2" disabled={uploadLoading} />
            <DFoot>
              <button type="button" className="d2-btn-ghost" onClick={() => { setUploadModal(null); setUploadFile(null); setUploadDesc(""); }}>Cancel</button>
              <button type="submit" className="d2-btn-primary" disabled={uploadLoading || !uploadFile}><UploadCloud size={14} /> {uploadLoading ? "Uploading…" : "Upload"}</button>
            </DFoot>
          </form>
        </Drawer>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure UI helpers
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ accent, icon, label, value, sub, onClick }) {
  return (
    <button className="d2-stat-card" style={{ "--a": accent }} onClick={onClick} type="button">
      <div className="d2-stat-icon-wrap" style={{ background: `${accent}18` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p className="d2-stat-label">{label}</p>
      <p className="d2-stat-value" style={{ color: accent }}>{value}</p>
      <p className="d2-stat-sub">{sub}</p>
    </button>
  );
}

function CardHead({ icon, title, count, color, onMore }) {
  return (
    <div className="d2-card-head">
      <div style={{ display: "flex", alignItems: "center", gap: "7px", color }}>
        {icon}
        <h3 className="d2-card-head-title">{title}</h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="d2-count-chip" style={{ background: `${color}15`, color }}>{count}</span>
        {onMore && count > 0 && (
          <button className="d2-more-btn" onClick={onMore}><ChevronRight size={14} /></button>
        )}
      </div>
    </div>
  );
}

function PageHead({ title, sub, onRefresh }) {
  return (
    <div className="d2-page-head">
      <div>
        <h2 className="d2-page-title">{title}</h2>
        <p className="d2-page-sub">{sub}</p>
      </div>
      <button className="d2-refresh-btn" onClick={onRefresh}><RefreshCw size={15} /></button>
    </div>
  );
}

const STATUS_MAP = {
  assigned:      ["#dbeafe", "#1d4ed8"],
  accepted:      ["#dcfce7", "#15803d"],
  rejected:      ["#fee2e2", "#b91c1c"],
  "in-progress": ["#fef9c3", "#854d0e"],
  "under-review":["#e0e7ff", "#4338ca"],
  submitted:     ["#fef3c7", "#a16207"],
  approved:      ["#dcfce7", "#15803d"],
  active:        ["#dcfce7", "#15803d"],
  "on-track":    ["#dcfce7", "#15803d"],
  delayed:       ["#fee2e2", "#b91c1c"],
  completed:     ["#dbeafe", "#1d4ed8"],
  "on-hold":     ["#f1f5f9", "#475569"],
  cancelled:     ["#fee2e2", "#b91c1c"],
  inactive:      ["#f1f5f9", "#475569"],
};
function StatusPill({ status }) {
  const [bg, fg] = STATUS_MAP[status] || ["#f1f5f9", "#475569"];
  return <span className="d2-status-pill" style={{ background: bg, color: fg }}>{status || "—"}</span>;
}

function Empty({ icon, text }) {
  return (
    <div className="d2-empty-small">
      <span className="d2-empty-ico">{icon}</span>
      <p>{text}</p>
    </div>
  );
}

function EmptyPage({ icon, title, desc, action }) {
  return (
    <div className="d2-empty-page">
      <span className="d2-empty-page-ico">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action && <button className="d2-btn-primary" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

function Drawer({ title, children, onClose, wide }) {
  return (
    <div className="d2-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`d2-drawer ${wide ? "d2-drawer-wide" : ""}`}>
        <div className="d2-drawer-head">
          <h2 className="d2-drawer-title">{title}</h2>
          <button className="d2-drawer-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="d2-drawer-body">{children}</div>
      </div>
    </div>
  );
}

function DFoot({ children }) {
  return <div className="d2-drawer-foot">{children}</div>;
}

function FLabel({ children, style }) {
  return <label className="d2-flabel" style={style}>{children}</label>;
}

function SkeletonGrid() {
  return (
    <div className="d2-overview-grid">
      {[1, 2, 3, 4].map(i => <div key={i} className="d2-skeleton-card"><div className="d2-sk-head" /><div className="d2-sk-line" /><div className="d2-sk-line short" /></div>)}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="d2-list-stack">
      {[1, 2, 3].map(i => <div key={i} className="d2-skeleton-card"><div className="d2-sk-head" /><div className="d2-sk-line" /><div className="d2-sk-line short" /></div>)}
    </div>
  );
}
