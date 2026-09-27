import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, ClipboardList, Map, Users, Building2,
  LogOut, Bell, Settings, RefreshCw, AlertCircle,
  TrendingUp, CheckCircle, Zap, Globe, Award, Flag,
  ChevronRight, Menu, X,
} from "lucide-react";
import "./Gov.css";

const API = "http://localhost:5000/api";

// ── Jharkhand 24 districts with rough SVG path coordinates ──────────────────
const JH_DISTRICTS = [
  { id: "ranchi",         name: "Ranchi",         cx: 295, cy: 258 },
  { id: "dhanbad",        name: "Dhanbad",        cx: 390, cy: 148 },
  { id: "jamshedpur",     name: "Jamshedpur",     cx: 420, cy: 278 },
  { id: "bokaro",         name: "Bokaro",         cx: 360, cy: 188 },
  { id: "hazaribagh",     name: "Hazaribagh",     cx: 310, cy: 188 },
  { id: "giridih",        name: "Giridih",        cx: 348, cy: 155 },
  { id: "koderma",        name: "Koderma",        cx: 295, cy: 138 },
  { id: "chatra",         name: "Chatra",         cx: 255, cy: 195 },
  { id: "palamu",         name: "Palamu",         cx: 195, cy: 220 },
  { id: "garhwa",         name: "Garhwa",         cx: 158, cy: 195 },
  { id: "latehar",        name: "Latehar",        cx: 225, cy: 240 },
  { id: "khunti",         name: "Khunti",         cx: 268, cy: 288 },
  { id: "gumla",          name: "Gumla",          cx: 230, cy: 305 },
  { id: "simdega",        name: "Simdega",        cx: 195, cy: 325 },
  { id: "west-singhbhum", name: "West Singhbhum", cx: 235, cy: 355 },
  { id: "east-singhbhum", name: "East Singhbhum", cx: 408, cy: 318 },
  { id: "seraikela",      name: "Seraikela",      cx: 385, cy: 295 },
  { id: "saraikela",      name: "Saraikela",      cx: 380, cy: 300 },
  { id: "ramgarh",        name: "Ramgarh",        cx: 335, cy: 215 },
  { id: "pakur",          name: "Pakur",          cx: 440, cy: 108 },
  { id: "sahebganj",      name: "Sahebganj",      cx: 420, cy: 88  },
  { id: "dumka",          name: "Dumka",          cx: 415, cy: 130 },
  { id: "jamtara",        name: "Jamtara",        cx: 395, cy: 160 },
  { id: "deoghar",        name: "Deoghar",        cx: 378, cy: 125 },
  { id: "godda",          name: "Godda",          cx: 430, cy: 108 },
  { id: "lohardaga",      name: "Lohardaga",      cx: 248, cy: 265 },
];

const CHART_COLORS = ["#0d9488","#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#ea580c","#65a30d","#be185d"];
const PRIORITY_COLORS = { critical: "#dc2626", high: "#d97706", medium: "#2563eb", low: "#16a34a" };

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", padding: "10px 14px", borderRadius: 10, fontSize: 13, color: "#f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#2dd4bf" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", color: p.color || "#f1f5f9" }}>
          {p.name}: <strong>{typeof p.value === "number" && p.value > 1000 ? p.value.toLocaleString("en-IN") : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function GovernmentDashboard() {
  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const token = localStorage.getItem("accessToken");

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [sidebarOpen,setSidebarOpen]= useState(false);
  const [hoveredDist,setHoveredDist]= useState(null);
  const [tooltip,    setTooltip]    = useState({ x: 0, y: 0, dist: null });

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const freshToken = localStorage.getItem("accessToken");
      const res  = await fetch(`${API}/admin/analytics`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load analytics");
      setData(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  // Build district lookup from API data for the map
  const districtLookup = {};
  if (data?.charts?.districtMap) {
    data.charts.districtMap.forEach(d => {
      districtLookup[d.district?.toLowerCase()] = d;
    });
  }
  const maxDistCount = Math.max(...(data?.charts?.districtMap?.map(d => d.total) || [1]));

  const districtColor = (name) => {
    const key = name?.toLowerCase();
    const d   = districtLookup[key];
    if (!d) return "#e2e8f0";
    const ratio = d.total / maxDistCount;
    if (ratio > 0.75) return "#0d9488";
    if (ratio > 0.5)  return "#14b8a6";
    if (ratio > 0.25) return "#5eead4";
    return "#ccfbf1";
  };

  const s = data?.stats || {};

  const STAT_CARDS = [
    { label: "Total Challenges",     value: s.total            || 0, icon: <ClipboardList size={22}/>, color: "#0d9488", sub: "All submitted" },
    { label: "Pending Validation",   value: s.pendingValidation || 0, icon: <AlertCircle size={22}/>,   color: "#d97706", sub: "Needs review" },
    { label: "Validated",            value: s.validated         || 0, icon: <CheckCircle size={22}/>,   color: "#2563eb", sub: "Cleared" },
    { label: "Active Projects",      value: s.activeProjects    || 0, icon: <Zap size={22}/>,           color: "#7c3aed", sub: "In progress" },
    { label: "Completed Projects",   value: s.completedProjects || 0, icon: <Award size={22}/>,         color: "#16a34a", sub: "Done" },
    { label: "Deployed Solutions",   value: s.deployedSolutions || 0, icon: <Globe size={22}/>,         color: "#ea580c", sub: "Live" },
    { label: "Citizens Impacted",    value: (s.totalImpacted || 0).toLocaleString("en-IN"), icon: <Users size={22}/>, color: "#0891b2", sub: "People" },
    { label: "Universities Active",  value: s.uniCount          || 0, icon: <Building2 size={22}/>,     color: "#be185d", sub: "Participating" },
    { label: "Industry Partners",    value: s.industryCount     || 0, icon: <TrendingUp size={22}/>,    color: "#65a30d", sub: "Collaborating" },
    { label: "Total Citizens",       value: (s.totalCitizens || 0).toLocaleString("en-IN"), icon: <Flag size={22}/>, color: "#6366f1", sub: "Registered" },
  ];

  return (
    <div className="gov-root">

      {/* Sidebar overlay */}
      {sidebarOpen && <div className="gov-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
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
            { icon: <LayoutDashboard size={18}/>, label: "Analytics",        active: true,  onClick: () => {} },
            { icon: <ClipboardList size={18}/>,   label: "Review Challenges", active: false, onClick: () => navigate("/government/review") },
            { icon: <Map size={18}/>,             label: "District Map",      active: false, onClick: () => {} },
            { icon: <Building2 size={18}/>,       label: "Universities",      active: false, onClick: () => navigate("/university/dashboard") },
            { icon: <Users size={18}/>,           label: "Citizens",          active: false, onClick: () => {} },
            { icon: <Settings size={18}/>,        label: "Settings",          active: false, onClick: () => {} },
          ].map(n => (
            <button key={n.label} className={`gov-nav-btn ${n.active ? "active" : ""}`} onClick={n.onClick}>
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

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="gov-main">

        {/* Topbar */}
        <header className="gov-topbar">
          <div className="gov-topbar-left">
            <button className="gov-hamburger" onClick={() => setSidebarOpen(s => !s)}><Menu size={22}/></button>
            <div>
              <h1 className="gov-topbar-title">Analytics Dashboard</h1>
              <p className="gov-topbar-sub">Jharkhand Societal Innovation Portal — Real-time insights</p>
            </div>
          </div>
          <div className="gov-topbar-right">
            <button className="gov-topbar-icon" onClick={load} title="Refresh"><RefreshCw size={18}/></button>
            <button className="gov-topbar-icon" onClick={() => navigate("/government/review")} title="Review Challenges">
              <ClipboardList size={18}/>
              {s.pendingValidation > 0 && <span className="gov-topbar-badge">{s.pendingValidation}</span>}
            </button>
            <button className="gov-topbar-icon"><Bell size={18}/></button>
          </div>
        </header>

        {/* Body */}
        <div className="gov-body">

          {error && (
            <div className="gov-error">
              <AlertCircle size={16}/> {error}
              <button onClick={load} className="gov-error-retry"><RefreshCw size={12}/> Retry</button>
            </div>
          )}

          {loading ? (
            <div className="gov-loading">
              <div className="gov-spinner" />
              <p>Loading analytics from database…</p>
            </div>
          ) : (
            <>
              {/* ── Stat Cards ─────────────────────────────────────────── */}
              <div className="gov-stats-grid">
                {STAT_CARDS.map(c => (
                  <div className="gov-stat-card" key={c.label} style={{"--ac": c.color}}>
                    <div className="gov-stat-icon-wrap" style={{background: `${c.color}18`}}>
                      <span style={{color: c.color}}>{c.icon}</span>
                    </div>
                    <div className="gov-stat-body">
                      <p className="gov-stat-label">{c.label}</p>
                      <p className="gov-stat-value" style={{color: c.color}}>{c.value}</p>
                      <p className="gov-stat-sub">{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Charts Row 1 ────────────────────────────────────────── */}
              <div className="gov-charts-grid">

                {/* 1. Monthly Submissions — Line */}
                <div className="gov-chart-card gov-chart-wide">
                  <div className="gov-chart-header">
                    <h3>Monthly Challenge Submissions</h3>
                    <span className="gov-chart-badge">Last 12 months</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data.charts.monthly} margin={{top:5,right:20,left:0,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="name" tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Line type="monotone" dataKey="submissions" stroke="#0d9488" strokeWidth={2.5}
                        dot={{r:4, fill:"#0d9488"}} activeDot={{r:6}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 2. Challenges by Category — Bar */}
                <div className="gov-chart-card">
                  <div className="gov-chart-header">
                    <h3>Challenges by Category</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.charts.byCategory} layout="vertical" margin={{left:10,right:20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="name" tick={{fontSize:11, fill:"#64748b"}} width={100} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" radius={[0,6,6,0]}>
                        {data.charts.byCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 3. Priority Distribution — Donut */}
                <div className="gov-chart-card">
                  <div className="gov-chart-header">
                    <h3>Priority Distribution</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={data.charts.byPriority} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                        dataKey="value" nameKey="name" paddingAngle={3}>
                        {data.charts.byPriority.map((entry, i) => (
                          <Cell key={i} fill={PRIORITY_COLORS[entry.name] || CHART_COLORS[i]}/>
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 4. Challenge Status Pipeline — Horizontal Bar */}
                <div className="gov-chart-card gov-chart-wide">
                  <div className="gov-chart-header">
                    <h3>Challenge Status Pipeline</h3>
                    <span className="gov-chart-badge">All statuses</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.charts.byStatus} layout="vertical" margin={{left:20,right:20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="name" tick={{fontSize:11, fill:"#64748b"}} width={140} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" radius={[0,6,6,0]}>
                        {data.charts.byStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 5. Top Districts — Column Bar */}
                <div className="gov-chart-card">
                  <div className="gov-chart-header">
                    <h3>Challenges by District</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.charts.byDistrict} margin={{top:5,right:10,left:0,bottom:30}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                      <XAxis dataKey="name" tick={{fontSize:10, fill:"#64748b"}} angle={-35} textAnchor="end" axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {data.charts.byDistrict.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 6. University Participation — Donut */}
                <div className="gov-chart-card">
                  <div className="gov-chart-header">
                    <h3>University Participation</h3>
                  </div>
                  {data.charts.uniParticipation?.length === 0 ? (
                    <div className="gov-chart-empty">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={data.charts.uniParticipation} cx="50%" cy="50%"
                          innerRadius={55} outerRadius={95} dataKey="value" nameKey="name" paddingAngle={3}>
                          {data.charts.uniParticipation.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* 7. Social Impact — Bar */}
                <div className="gov-chart-card gov-chart-wide">
                  <div className="gov-chart-header">
                    <h3>Social Impact by District</h3>
                    <span className="gov-chart-badge">People impacted</span>
                  </div>
                  {data.charts.socialImpact?.length === 0 ? (
                    <div className="gov-chart-empty">No impact data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.charts.socialImpact} margin={{top:5,right:20,left:10,bottom:30}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                        <XAxis dataKey="name" tick={{fontSize:10, fill:"#64748b"}} angle={-35} textAnchor="end" axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}
                          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="impacted" name="People Impacted" fill="#0d9488" radius={[6,6,0,0]}/>
                        <Bar dataKey="challenges" name="Challenges" fill="#7c3aed" radius={[6,6,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* 8. Radar — category coverage */}
                <div className="gov-chart-card">
                  <div className="gov-chart-header">
                    <h3>Category Coverage Radar</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={data.charts.byCategory.slice(0, 8)}>
                      <PolarGrid stroke="#e2e8f0"/>
                      <PolarAngleAxis dataKey="name" tick={{fontSize:10, fill:"#64748b"}}/>
                      <Radar name="Challenges" dataKey="value" stroke="#0d9488" fill="#0d9488" fillOpacity={0.25} strokeWidth={2}/>
                      <Tooltip content={<CustomTooltip/>}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

              </div>

              {/* ── Jharkhand District Map ───────────────────────────────── */}
              <div className="gov-map-section">
                <div className="gov-chart-header" style={{marginBottom:"20px"}}>
                  <div>
                    <h3>Jharkhand — District-wise Challenge Distribution</h3>
                    <p className="gov-map-sub">Hover over a district to see details</p>
                  </div>
                  <div className="gov-map-legend">
                    {[{c:"#0d9488",l:"High (75–100%)"},{c:"#14b8a6",l:"Medium-High (50–75%)"},{c:"#5eead4",l:"Medium (25–50%)"},{c:"#ccfbf1",l:"Low (<25%)"}].map(l=>(
                      <div key={l.l} className="gov-legend-item"><span style={{background:l.c}} className="gov-legend-dot"/>{l.l}</div>
                    ))}
                  </div>
                </div>

                <div className="gov-map-container">
                  <svg viewBox="120 70 380 320" className="gov-map-svg" preserveAspectRatio="xMidYMid meet">
                    {/* State border outline (approximate) */}
                    <path d="M150,170 L200,100 L280,80 L380,85 L460,100 L490,150 L480,200 L460,260 L440,320 L400,360 L340,380 L280,370 L220,360 L175,330 L150,300 L135,260 L140,220 Z"
                      fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>

                    {/* District circles */}
                    {JH_DISTRICTS.map(d => {
                      const key = d.name.toLowerCase().replace(/\s+/g, "-");
                      const match = Object.entries(districtLookup).find(([k]) =>
                        k.toLowerCase().includes(d.name.toLowerCase().split(" ")[0].toLowerCase())
                      );
                      const info  = match?.[1];
                      const count = info?.total || 0;
                      const radius = count > 0 ? Math.max(12, Math.min(22, 10 + count * 1.5)) : 11;
                      const fill  = districtColor(d.name.toLowerCase().replace(/\s+/g,"-").replace("west-singhbhum","west singhbhum").replace("east-singhbhum","east singhbhum"));

                      return (
                        <g key={d.id}
                          onMouseEnter={e => { setHoveredDist(d.id); setTooltip({ x: e.clientX, y: e.clientY, dist: { ...d, info } }); }}
                          onMouseLeave={() => { setHoveredDist(null); setTooltip({ dist: null }); }}
                          style={{cursor: "pointer"}}
                        >
                          <circle cx={d.cx} cy={d.cy} r={radius}
                            fill={fill}
                            stroke={hoveredDist === d.id ? "#0f766e" : "#a7f3d0"}
                            strokeWidth={hoveredDist === d.id ? 2 : 1}
                            opacity={hoveredDist && hoveredDist !== d.id ? 0.65 : 1}
                          />
                          {count > 0 && (
                            <text x={d.cx} y={d.cy + 4} textAnchor="middle"
                              fontSize={count > 9 ? 9 : 10} fontWeight="700" fill="#0f172a" pointerEvents="none">
                              {count}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* District labels for major ones */}
                    {JH_DISTRICTS.filter(d => ["Ranchi","Dhanbad","Jamshedpur","Hazaribagh","Palamu","Dumka","Gumla"].includes(d.name)).map(d => (
                      <text key={`lbl-${d.id}`} x={d.cx} y={d.cy - 16}
                        textAnchor="middle" fontSize={9} fill="#475569" pointerEvents="none">
                        {d.name}
                      </text>
                    ))}
                  </svg>

                  {/* Floating tooltip */}
                  {tooltip.dist && (
                    <div className="gov-map-tooltip" style={{left: tooltip.x - 100, top: tooltip.y - 120}}>
                      <p className="gov-mtt-name">{tooltip.dist.name}</p>
                      {tooltip.dist.info ? (
                        <>
                          <p>Total: <strong>{tooltip.dist.info.total}</strong></p>
                          <p>Pending: <strong>{tooltip.dist.info.pending}</strong></p>
                          <p>Active: <strong>{tooltip.dist.info.active}</strong></p>
                          <p>Completed: <strong>{tooltip.dist.info.completed}</strong></p>
                          <p>Impacted: <strong>{(tooltip.dist.info.impacted||0).toLocaleString("en-IN")}</strong></p>
                        </>
                      ) : (
                        <p style={{color:"#94a3b8"}}>No challenges yet</p>
                      )}
                    </div>
                  )}

                  {/* District table on the right */}
                  <div className="gov-map-table">
                    <p className="gov-map-table-head">Top Districts</p>
                    {(data.charts.districtMap || []).slice(0, 10).map((d, i) => (
                      <div className="gov-map-table-row" key={d.district}>
                        <span className="gov-map-table-rank">{i + 1}</span>
                        <span className="gov-map-table-name">{d.district}</span>
                        <span className="gov-map-table-count">{d.total}</span>
                        <div className="gov-map-table-bar">
                          <div style={{width: `${(d.total / maxDistCount) * 100}%`, background:"#0d9488", height:"100%", borderRadius:4}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Quick Actions ───────────────────────────────────────── */}
              <div className="gov-quick-actions">
                <button className="gov-qa-btn gov-qa-primary" onClick={() => navigate("/government/review")}>
                  <ClipboardList size={18}/> Review {s.pendingValidation > 0 ? `${s.pendingValidation} Pending` : "Challenges"}
                  <ChevronRight size={16}/>
                </button>
                <button className="gov-qa-btn gov-qa-outline" onClick={() => navigate("/university/dashboard")}>
                  <Building2 size={18}/> University Portal <ChevronRight size={16}/>
                </button>
                <button className="gov-qa-btn gov-qa-outline" onClick={load}>
                  <RefreshCw size={18}/> Refresh Data <ChevronRight size={16}/>
                </button>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
