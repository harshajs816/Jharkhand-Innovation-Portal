import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Search,
  Users,
  PlusSquare,
  UserRound,
  FileCheck2,
  Bell,
  CircleHelp,
  LogOut,
  ChevronDown,
  Menu,
  Pencil,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  BadgeCheck,
  Calendar,
  BookOpen,
  GraduationCap,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  GitBranch,
} from "lucide-react";
import "./Dashboard.css";
import "./Profile.css";

const UNI_API = "http://localhost:5000/api/university";

// ── Blank templates ────────────────────────────────────────────────────────────
const blankBranch  = () => ({ name: "", intake: "" });
const blankCourse  = () => ({
  name:       "",
  code:       "",
  department: "",
  duration:   "",
  degree:     "",
  mode:       "full-time",
  intake:     "",
  branches:   [blankBranch()],
});

export default function UniversityProfile() {
  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const token = localStorage.getItem("accessToken");

  // ── Profile state ─────────────────────────────────────────────────────────
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");
  const [form,     setForm]     = useState({});

  // ── Courses state ─────────────────────────────────────────────────────────
  const [courses,         setCourses]         = useState([]);
  const [coursesSaving,   setCoursesSaving]   = useState(false);
  const [coursesMsg,      setCoursesMsg]      = useState("");
  const [expandedCourse,  setExpandedCourse]  = useState(null); // index of expanded course card

  // ── Array section states (Faculty Expertise, Labs, etc.) ──────────────────
  const [facultyExpertise,       setFacultyExpertise]       = useState([]);
  const [researchAreas,          setResearchAreas]          = useState([]);
  const [labs,                   setLabs]                   = useState([]);
  const [innovationCentres,      setInnovationCentres]      = useState([]);
  const [incubationFacilities,   setIncubationFacilities]   = useState([]);
  const [availableTechnologies,  setAvailableTechnologies]  = useState([]);

  // per-section saving flags and messages
  const [sectionSaving, setSectionSaving] = useState({});
  const [sectionMsg,    setSectionMsg]    = useState({});

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch profile + courses
  // ─────────────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res  = await fetch(`${UNI_API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load profile");
      setProfile(data.profile);
      setForm(flattenProfile(data.profile));
      // courses come embedded in profile
      setCourses(hydrateCourses(data.profile.courses || []));
      // other array sections
      setFacultyExpertise(data.profile.facultyExpertise      || []);
      setResearchAreas(data.profile.researchAreas            || []);
      setLabs(data.profile.labs                              || []);
      setInnovationCentres(data.profile.innovationCentres    || []);
      setIncubationFacilities(data.profile.incubationFacilities || []);
      setAvailableTechnologies(data.profile.availableTechnologies || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const flattenProfile = (p) => ({
    universityName:     p.universityName     || "",
    universityCode:     p.universityCode     || "",
    registrationNumber: p.registrationNumber || "",
    establishedYear:    p.establishedYear    || "",
    universityType:     p.universityType     || "state",
    accreditation:      p.accreditation      || "",
    website:            p.website            || "",
    contactEmail:       p.contactEmail       || "",
    contactPhone:       p.contactPhone       || "",
    address:            p.address            || "",
    city:               p.city               || "",
    district:           p.district           || "",
    state:              p.state              || "Jharkhand",
    pincode:            p.pincode            || "",
    description:        p.description        || "",
  });

  // Convert DB courses to local editable state (ensure branches always array)
  const hydrateCourses = (arr) =>
    arr.map((c) => ({
      name:       c.name       || "",
      code:       c.code       || "",
      department: c.department || "",
      duration:   c.duration   !== undefined ? String(c.duration) : "",
      degree:     c.degree     || "",
      mode:       c.mode       || "full-time",
      intake:     c.intake     !== undefined ? String(c.intake)   : "",
      branches:   (c.branches || []).length > 0
        ? c.branches.map((b) => ({ name: b.name || "", intake: b.intake !== undefined ? String(b.intake) : "" }))
        : [blankBranch()],
    }));

  // Strip blank branches before sending to backend
  const sanitiseCourses = (arr) =>
    arr
      .filter((c) => c.name.trim())
      .map((c) => ({
        name:       c.name.trim(),
        code:       c.code.trim(),
        department: c.department.trim(),
        duration:   c.duration ? Number(c.duration) : undefined,
        degree:     c.degree.trim(),
        mode:       c.mode,
        intake:     c.intake ? Number(c.intake) : 0,
        branches:   c.branches
          .filter((b) => b.name.trim())
          .map((b) => ({ name: b.name.trim(), intake: b.intake ? Number(b.intake) : 0 })),
      }));

  // ─────────────────────────────────────────────────────────────────────────
  // Profile save
  // ─────────────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveMsg("");
      const res  = await fetch(`${UNI_API}/profile`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      setProfile(data.profile);
      setForm(flattenProfile(data.profile));
      setEditing(false);
      setSaveMsg("Profile updated successfully!");
      setTimeout(() => setSaveMsg(""), 4000);
    } catch (err) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setForm(flattenProfile(profile));
    setEditing(false);
    setSaveMsg("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Courses CRUD — all local until "Save Courses" is clicked
  // ─────────────────────────────────────────────────────────────────────────
  const addCourse = () => {
    setCourses((prev) => [...prev, blankCourse()]);
    setExpandedCourse(courses.length); // auto-expand newly added
  };

  const removeCourse = (idx) => {
    setCourses((prev) => prev.filter((_, i) => i !== idx));
    setExpandedCourse(null);
  };

  const updateCourseField = (idx, field, value) => {
    setCourses((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const addBranch = (courseIdx) => {
    setCourses((prev) =>
      prev.map((c, i) =>
        i === courseIdx ? { ...c, branches: [...c.branches, blankBranch()] } : c
      )
    );
  };

  const removeBranch = (courseIdx, branchIdx) => {
    setCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIdx) return c;
        const updated = c.branches.filter((_, bi) => bi !== branchIdx);
        return { ...c, branches: updated.length ? updated : [blankBranch()] };
      })
    );
  };

  const updateBranchField = (courseIdx, branchIdx, field, value) => {
    setCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIdx) return c;
        const branches = c.branches.map((b, bi) =>
          bi === branchIdx ? { ...b, [field]: value } : b
        );
        return { ...c, branches };
      })
    );
  };

  const handleSaveCourses = async () => {
    try {
      setCoursesSaving(true);
      setCoursesMsg("");
      const payload = sanitiseCourses(courses);
      const res     = await fetch(`${UNI_API}/profile/courses`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ courses: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save courses");
      setCourses(hydrateCourses(data.courses));
      setCoursesMsg("Courses saved successfully!");
      setTimeout(() => setCoursesMsg(""), 4000);
    } catch (err) {
      setCoursesMsg(err.message);
    } finally {
      setCoursesSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Generic save for array sections
  // ─────────────────────────────────────────────────────────────────────────
  const saveSection = async (sectionKey, endpoint, data) => {
    setSectionSaving(p => ({ ...p, [sectionKey]: true }));
    setSectionMsg(p => ({ ...p, [sectionKey]: "" }));
    try {
      // Strip MongoDB _id from each item and coerce types before sending
      const cleaned = data.map(item => {
        const obj = { ...item };
        delete obj._id;
        // Coerce numeric fields
        if (obj.capacity   !== undefined && obj.capacity   !== "") obj.capacity   = Number(obj.capacity);
        if (obj.established !== undefined && obj.established !== "") obj.established = Number(obj.established);
        // Ensure patented is a real boolean
        if (obj.patented !== undefined) obj.patented = obj.patented === true || obj.patented === "true";
        return obj;
      });

      const res  = await fetch(`${UNI_API}/profile/${endpoint}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ [sectionKey]: cleaned }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Save failed");
      setSectionMsg(p => ({ ...p, [sectionKey]: "Saved successfully!" }));
      setTimeout(() => setSectionMsg(p => ({ ...p, [sectionKey]: "" })), 4000);
    } catch (err) {
      setSectionMsg(p => ({ ...p, [sectionKey]: err.message }));
    } finally {
      setSectionSaving(p => ({ ...p, [sectionKey]: false }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Misc
  // ─────────────────────────────────────────────────────────────────────────
  const handleLogout  = async () => { await logout(); navigate("/university/login"); };
  const displayName   = profile?.universityName || user?.universityName || "University";
  const initials      = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const totalBranches = courses.reduce((acc, c) => acc + (c.branches?.filter((b) => b.name.trim()).length || 0), 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">🌿</div>
          <div>
            <h2 className="logo-title">Jharkhand Societal<br />Innovation Collabor...</h2>
          </div>
        </div>

        <nav style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <button className="dash-nav-btn" onClick={() => navigate("/university/dashboard")}>
            <LayoutDashboard size={20} /><span>Dashboard</span>
          </button>
          <button className="dash-nav-btn" onClick={() => navigate("/assigned-challenges")}>
            <Building2 size={20} /><span>Assigned Challenges</span>
          </button>
          <button className="dash-nav-btn" onClick={() => navigate("/assigned-challenges")}>
            <Search size={20} /><span>Explore Challenges</span>
          </button>
          <button className="dash-nav-btn" onClick={() => navigate("/university/dashboard")}>
            <Users size={20} /><span>My Teams</span>
          </button>
          <button className="dash-nav-btn" onClick={() => navigate("/university/dashboard")}>
            <PlusSquare size={20} /><span>Create Team</span>
          </button>
          <button className="dash-nav-btn" onClick={() => navigate("/university/dashboard")}>
            <FileCheck2 size={20} /><span>Submit Proposal</span>
          </button>
          <button className="dash-nav-btn active">
            <UserRound size={20} /><span>Profile</span>
          </button>
          <button
            onClick={() => navigate("/government-dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "10px 14px", marginTop: "16px",
              backgroundColor: "#134e4a", color: "#a7f3d0",
              border: "1px dashed #2dd4bf", borderRadius: "8px",
              cursor: "pointer", fontSize: "13px", fontWeight: "600",
            }}
          >
            🏛️ Switch to Govt Portal
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button onClick={handleLogout} className="sidebar-logout-button">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="main-area">

        {/* Top header */}
        <header className="top-header">
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Menu size={22} style={{ cursor: "pointer" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "22px", color: "#102049", fontWeight: "700" }}>
                University Profile
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#26435a", fontWeight: "600", marginTop: "3px" }}>
                <Building2 size={14} />
                <span>{displayName}</span>
                {profile?.isVerified && (
                  <span style={{ width: 16, height: 16, background: "#16a34a", borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", fontSize: "10px" }}>✓</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <button style={{ border: "none", background: "transparent", cursor: "pointer", color: "#102049" }}>
              <CircleHelp size={24} />
            </button>
            <button style={{ border: "none", background: "transparent", cursor: "pointer", color: "#102049", position: "relative" }}>
              <Bell size={24} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#16a34a", borderRadius: "50%" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="profile-avatar">{initials}</div>
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#102049" }}>{user?.name}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Faculty Coordinator</p>
              </div>
              <ChevronDown size={16} color="#64748b" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="page-content">

          {saveMsg && (
            <div className={`prof-banner ${saveMsg.includes("successfully") ? "prof-banner-success" : "prof-banner-error"}`}>
              {saveMsg.includes("successfully") ? "✅ " : "❌ "}{saveMsg}
            </div>
          )}

          {loading ? (
            <div className="prof-loading">Loading your profile...</div>
          ) : error ? (
            <div className="prof-banner prof-banner-error">{error}</div>
          ) : (
            <>
              {/* ── Hero ─────────────────────────────────────────────────── */}
              <form onSubmit={handleSave}>
                <div className="prof-hero">
                  <div className="prof-avatar-wrap">
                    <div className="prof-avatar">{initials}</div>
                    {profile?.isVerified && (
                      <span className="prof-verified-badge"><BadgeCheck size={14} /> Verified</span>
                    )}
                  </div>

                  <div className="prof-hero-info">
                    <h2 className="prof-hero-name">{displayName}</h2>
                    <p className="prof-hero-sub">
                      {profile?.universityType
                        ? profile.universityType.charAt(0).toUpperCase() + profile.universityType.slice(1)
                        : "University"}
                      {profile?.city && ` · ${profile.city}`}
                      {profile?.district && `, ${profile.district}`}
                    </p>
                    {profile?.accreditation && (
                      <span className="prof-accred-tag">🏅 {profile.accreditation}</span>
                    )}
                  </div>

                  <div className="prof-hero-actions">
                    {!editing ? (
                      <button type="button" className="prof-edit-btn" onClick={() => setEditing(true)}>
                        <Pencil size={15} /> Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button type="button" className="prof-cancel-btn" onClick={handleCancel} disabled={saving}>
                          <X size={15} /> Cancel
                        </button>
                        <button type="submit" className="prof-save-btn" disabled={saving}>
                          <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Info cards grid ──────────────────────────────────── */}
                <div className="prof-grid">

                  {/* Basic Information */}
                  <div className="prof-card">
                    <div className="prof-card-header">
                      <BookOpen size={18} className="prof-card-icon" />
                      <h3>Basic Information</h3>
                    </div>
                    <div className="prof-fields">
                      <Field label="University Name"        name="universityName"     value={form.universityName}     editing={editing} onChange={handleChange} required />
                      <Field label="University Code"        name="universityCode"     value={form.universityCode}     editing={editing} onChange={handleChange} />
                      <Field label="Registration Number"    name="registrationNumber" value={form.registrationNumber} editing={editing} onChange={handleChange} />
                      <Field label="Established Year"       name="establishedYear"    value={form.establishedYear}    editing={editing} onChange={handleChange} type="number" />
                      <div className="prof-field">
                        <label className="prof-field-label">University Type</label>
                        {editing ? (
                          <select name="universityType" value={form.universityType} onChange={handleChange} className="prof-input">
                            <option value="government">Government</option>
                            <option value="private">Private</option>
                            <option value="central">Central</option>
                            <option value="state">State</option>
                            <option value="deemed">Deemed</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <p className="prof-value">{form.universityType || "—"}</p>
                        )}
                      </div>
                      <Field label="Accreditation (NAAC/NBA etc.)" name="accreditation" value={form.accreditation} editing={editing} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="prof-card">
                    <div className="prof-card-header">
                      <Phone size={18} className="prof-card-icon" />
                      <h3>Contact Details</h3>
                    </div>
                    <div className="prof-fields">
                      <Field label="Contact Email" name="contactEmail" value={form.contactEmail} editing={editing} onChange={handleChange} type="email" icon={<Mail size={14} />} />
                      <Field label="Contact Phone" name="contactPhone" value={form.contactPhone} editing={editing} onChange={handleChange} type="tel"   icon={<Phone size={14} />} />
                      <Field label="Website"       name="website"      value={form.website}      editing={editing} onChange={handleChange} type="url"   icon={<Globe size={14} />} />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="prof-card">
                    <div className="prof-card-header">
                      <MapPin size={18} className="prof-card-icon" />
                      <h3>Location</h3>
                    </div>
                    <div className="prof-fields">
                      <Field label="Address"  name="address"  value={form.address}  editing={editing} onChange={handleChange} />
                      <Field label="City"     name="city"     value={form.city}     editing={editing} onChange={handleChange} />
                      <Field label="District" name="district" value={form.district} editing={editing} onChange={handleChange} />
                      <Field label="State"    name="state"    value={form.state}    editing={editing} onChange={handleChange} />
                      <Field label="Pincode"  name="pincode"  value={form.pincode}  editing={editing} onChange={handleChange} />
                    </div>
                  </div>

                  {/* About */}
                  <div className="prof-card prof-card-full">
                    <div className="prof-card-header">
                      <Calendar size={18} className="prof-card-icon" />
                      <h3>About the University</h3>
                    </div>
                    <div className="prof-fields">
                      <div className="prof-field">
                        <label className="prof-field-label">Description</label>
                        {editing ? (
                          <textarea name="description" value={form.description} onChange={handleChange}
                            rows={5} placeholder="Briefly describe the university's focus, achievements and vision..."
                            className="prof-textarea" />
                        ) : (
                          <p className="prof-value prof-description">{form.description || "No description provided."}</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Stats row */}
                <div className="prof-stats-row">
                  <StatPill icon="🎯" label="Account Status"  value={profile?.isVerified ? "Verified" : "Unverified"} color={profile?.isVerified ? "#16a34a" : "#d97706"} />
                  <StatPill icon="🏛️" label="Type"            value={profile?.universityType ? profile.universityType.charAt(0).toUpperCase() + profile.universityType.slice(1) : "—"} color="#0d9488" />
                  <StatPill icon="📅" label="Established"      value={profile?.establishedYear || "—"} color="#2563eb" />
                  <StatPill icon="📍" label="District"         value={profile?.district || "—"} color="#7c3aed" />
                  <StatPill icon="🎓" label="Total Courses"    value={courses.filter(c => c.name.trim()).length} color="#0d9488" />
                  <StatPill icon="🌿" label="Total Branches"   value={totalBranches} color="#16a34a" />
                </div>
              </form>

              {/* ════════════════════════════════════════════════════════════
                  COURSES & DEPARTMENTS SECTION
              ════════════════════════════════════════════════════════════ */}
              <div className="courses-section">

                {/* Section header */}
                <div className="courses-header">
                  <div className="courses-header-left">
                    <GraduationCap size={22} className="courses-header-icon" />
                    <div>
                      <h2 className="courses-title">Courses &amp; Departments</h2>
                      <p className="courses-subtitle">
                        {courses.filter(c => c.name.trim()).length} courses &nbsp;·&nbsp; {totalBranches} branches registered
                      </p>
                    </div>
                  </div>
                  <div className="courses-header-actions">
                    <button type="button" className="courses-add-btn" onClick={addCourse}>
                      <Plus size={16} /> Add Course
                    </button>
                    <button
                      type="button"
                      className="prof-save-btn"
                      onClick={handleSaveCourses}
                      disabled={coursesSaving}
                      style={{ fontSize: "13px", padding: "9px 18px" }}
                    >
                      <Save size={15} /> {coursesSaving ? "Saving..." : "Save Courses"}
                    </button>
                  </div>
                </div>

                {/* Courses feedback banner */}
                {coursesMsg && (
                  <div className={`prof-banner ${coursesMsg.includes("successfully") ? "prof-banner-success" : "prof-banner-error"}`}
                    style={{ marginTop: "12px" }}>
                    {coursesMsg.includes("successfully") ? "✅ " : "❌ "}{coursesMsg}
                  </div>
                )}

                {/* Empty state */}
                {courses.length === 0 && (
                  <div className="courses-empty">
                    <GraduationCap size={40} color="#cbd5e1" />
                    <p>No courses added yet.</p>
                    <button type="button" className="courses-add-btn" onClick={addCourse}>
                      <Plus size={15} /> Add Your First Course
                    </button>
                  </div>
                )}

                {/* Course cards */}
                <div className="courses-list">
                  {courses.map((course, ci) => {
                    const isOpen    = expandedCourse === ci;
                    const validName = course.name.trim() || `Course ${ci + 1}`;
                    const branchCount = course.branches.filter(b => b.name.trim()).length;

                    return (
                      <div className="course-card" key={ci}>

                        {/* ── Course card header (always visible) ────────── */}
                        <div
                          className="course-card-top"
                          onClick={() => setExpandedCourse(isOpen ? null : ci)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && setExpandedCourse(isOpen ? null : ci)}
                        >
                          <div className="course-card-top-left">
                            <div className="course-index-badge">{ci + 1}</div>
                            <div>
                              <p className="course-name-preview">
                                {validName}
                                {course.degree && <span className="course-degree-tag">{course.degree}</span>}
                              </p>
                              <p className="course-meta-preview">
                                {course.department && <span>{course.department}</span>}
                                {course.duration   && <span>{course.duration} yr</span>}
                                {course.mode       && <span>{course.mode}</span>}
                                {branchCount > 0   && (
                                  <span className="course-branch-count">
                                    <GitBranch size={11} /> {branchCount} branch{branchCount !== 1 ? "es" : ""}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="course-card-top-right">
                            <button
                              type="button"
                              className="course-delete-btn"
                              onClick={(e) => { e.stopPropagation(); removeCourse(ci); }}
                              title="Remove course"
                            >
                              <Trash2 size={15} />
                            </button>
                            {isOpen
                              ? <ChevronDownIcon size={18} color="#64748b" />
                              : <ChevronRight    size={18} color="#64748b" />
                            }
                          </div>
                        </div>

                        {/* ── Course form (expandable) ─────────────────── */}
                        {isOpen && (
                          <div className="course-card-body">

                            {/* Row 1: Name + Degree + Code */}
                            <div className="course-form-row">
                              <div className="course-form-field course-form-field--wide">
                                <label className="prof-field-label">Course Name <span style={{ color: "#ef4444" }}>*</span></label>
                                <input
                                  className="prof-input"
                                  placeholder="e.g. B.E / B.Tech, B.Sc Agriculture, MBA..."
                                  value={course.name}
                                  onChange={(e) => updateCourseField(ci, "name", e.target.value)}
                                />
                              </div>
                              <div className="course-form-field">
                                <label className="prof-field-label">Degree Level</label>
                                <select
                                  className="prof-input"
                                  value={course.degree}
                                  onChange={(e) => updateCourseField(ci, "degree", e.target.value)}
                                >
                                  <option value="">Select…</option>
                                  <option value="UG">UG (Undergraduate)</option>
                                  <option value="PG">PG (Postgraduate)</option>
                                  <option value="PhD">PhD / Doctorate</option>
                                  <option value="Diploma">Diploma</option>
                                  <option value="Certificate">Certificate</option>
                                  <option value="Integrated">Integrated (5-yr)</option>
                                </select>
                              </div>
                              <div className="course-form-field">
                                <label className="prof-field-label">Course Code</label>
                                <input
                                  className="prof-input"
                                  placeholder="e.g. BTECH01"
                                  value={course.code}
                                  onChange={(e) => updateCourseField(ci, "code", e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Row 2: Department + Duration + Mode + Intake */}
                            <div className="course-form-row">
                              <div className="course-form-field course-form-field--wide">
                                <label className="prof-field-label">Department / School</label>
                                <input
                                  className="prof-input"
                                  placeholder="e.g. School of Engineering, Faculty of Agriculture..."
                                  value={course.department}
                                  onChange={(e) => updateCourseField(ci, "department", e.target.value)}
                                />
                              </div>
                              <div className="course-form-field">
                                <label className="prof-field-label">Duration (years)</label>
                                <input
                                  className="prof-input"
                                  type="number"
                                  min="1"
                                  max="10"
                                  placeholder="4"
                                  value={course.duration}
                                  onChange={(e) => updateCourseField(ci, "duration", e.target.value)}
                                />
                              </div>
                              <div className="course-form-field">
                                <label className="prof-field-label">Mode</label>
                                <select
                                  className="prof-input"
                                  value={course.mode}
                                  onChange={(e) => updateCourseField(ci, "mode", e.target.value)}
                                >
                                  <option value="full-time">Full-Time</option>
                                  <option value="part-time">Part-Time</option>
                                  <option value="online">Online</option>
                                  <option value="hybrid">Hybrid</option>
                                </select>
                              </div>
                              <div className="course-form-field">
                                <label className="prof-field-label">Total Intake</label>
                                <input
                                  className="prof-input"
                                  type="number"
                                  min="0"
                                  placeholder="e.g. 240"
                                  value={course.intake}
                                  onChange={(e) => updateCourseField(ci, "intake", e.target.value)}
                                />
                              </div>
                            </div>

                            {/* ── Branches ──────────────────────────────── */}
                            <div className="branches-section">
                              <div className="branches-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <GitBranch size={16} color="#0d9488" />
                                  <span className="branches-label">Specialisation Branches</span>
                                </div>
                                <button
                                  type="button"
                                  className="branch-add-btn"
                                  onClick={() => addBranch(ci)}
                                >
                                  <Plus size={13} /> Add Branch
                                </button>
                              </div>

                              <div className="branches-list">
                                {course.branches.map((branch, bi) => (
                                  <div className="branch-row" key={bi}>
                                    <span className="branch-num">{bi + 1}</span>

                                    <input
                                      className="prof-input branch-name-input"
                                      placeholder="e.g. Computer Science & Engineering, Horticulture..."
                                      value={branch.name}
                                      onChange={(e) => updateBranchField(ci, bi, "name", e.target.value)}
                                    />

                                    <div className="branch-intake-wrap">
                                      <span className="branch-intake-label">Intake</span>
                                      <input
                                        className="prof-input branch-intake-input"
                                        type="number"
                                        min="0"
                                        placeholder="60"
                                        value={branch.intake}
                                        onChange={(e) => updateBranchField(ci, bi, "intake", e.target.value)}
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      className="branch-remove-btn"
                                      onClick={() => removeBranch(ci, bi)}
                                      title="Remove branch"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* ── /Branches ─────────────────────────────── */}

                          </div>
                        )}
                        {/* ── /Course form ──────────────────────────────── */}

                      </div>
                    );
                  })}
                </div>
                {/* ── /Course cards ─────────────────────────────────────── */}

                {/* Bottom save button (repeated for convenience on long lists) */}
                {courses.length > 2 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                    <button
                      type="button"
                      className="prof-save-btn"
                      onClick={handleSaveCourses}
                      disabled={coursesSaving}
                      style={{ fontSize: "13px", padding: "9px 18px" }}
                    >
                      <Save size={15} /> {coursesSaving ? "Saving..." : "Save Courses"}
                    </button>
                  </div>
                )}

              </div>
              {/* ── /COURSES SECTION ──────────────────────────────────────── */}

              {/* ════════════════════════════════════════════════════════════
                  FACULTY EXPERTISE
              ════════════════════════════════════════════════════════════ */}
              <ArraySection
                icon="👨‍🏫"
                title="Faculty Expertise"
                subtitle="Areas of expertise offered by your faculty members"
                sectionKey="facultyExpertise"
                endpoint="faculty-expertise"
                items={facultyExpertise}
                setItems={setFacultyExpertise}
                saving={sectionSaving.facultyExpertise}
                msg={sectionMsg.facultyExpertise}
                onSave={(items) => saveSection("facultyExpertise", "faculty-expertise", items)}
                fields={[
                  { key: "area",        label: "Expertise Area",  placeholder: "e.g. Machine Learning, Water Management, Soil Science", required: true, wide: true },
                  { key: "facultyName", label: "Faculty Name",    placeholder: "e.g. Dr. R. K. Singh" },
                  { key: "department",  label: "Department",      placeholder: "e.g. Computer Science & Engineering" },
                ]}
                blankItem={{ area: "", facultyName: "", department: "" }}
                displayField="area"
                emptyText="No faculty expertise added yet."
              />

              {/* ════════════════════════════════════════════════════════════
                  RESEARCH AREAS
              ════════════════════════════════════════════════════════════ */}
              <ArraySection
                icon="🔬"
                title="Research Areas"
                subtitle="Active research domains at your university"
                sectionKey="researchAreas"
                endpoint="research-areas"
                items={researchAreas}
                setItems={setResearchAreas}
                saving={sectionSaving.researchAreas}
                msg={sectionMsg.researchAreas}
                onSave={(items) => saveSection("researchAreas", "research-areas", items)}
                fields={[
                  { key: "name",        label: "Research Area",  placeholder: "e.g. Renewable Energy, Food Security, IoT", required: true, wide: true },
                  { key: "description", label: "Brief Description", placeholder: "e.g. Focus on solar micro-grids for rural electrification" },
                ]}
                blankItem={{ name: "", description: "" }}
                displayField="name"
                emptyText="No research areas added yet."
              />

              {/* ════════════════════════════════════════════════════════════
                  LABS
              ════════════════════════════════════════════════════════════ */}
              <ArraySection
                icon="🧪"
                title="Laboratories"
                subtitle="Research and teaching labs at your university"
                sectionKey="labs"
                endpoint="labs"
                items={labs}
                setItems={setLabs}
                saving={sectionSaving.labs}
                msg={sectionMsg.labs}
                onSave={(items) => saveSection("labs", "labs", items)}
                fields={[
                  { key: "name",        label: "Lab Name",       placeholder: "e.g. Advanced Computing Lab, Soil Testing Lab", required: true, wide: true },
                  { key: "department",  label: "Department",     placeholder: "e.g. Civil Engineering" },
                  { key: "incharge",    label: "Lab Incharge",   placeholder: "e.g. Prof. Anita Sharma" },
                  { key: "equipment",   label: "Key Equipment",  placeholder: "e.g. Spectrophotometer, IoT Sensors, 3D Printer" },
                  { key: "description", label: "Description",    placeholder: "Brief description of lab capabilities" },
                ]}
                blankItem={{ name: "", department: "", incharge: "", equipment: "", description: "" }}
                displayField="name"
                emptyText="No laboratories added yet."
              />

              {/* ════════════════════════════════════════════════════════════
                  INNOVATION CENTRES
              ════════════════════════════════════════════════════════════ */}
              <ArraySection
                icon="💡"
                title="Innovation Centres"
                subtitle="Centers driving innovation and entrepreneurship"
                sectionKey="innovationCentres"
                endpoint="innovation-centres"
                items={innovationCentres}
                setItems={setInnovationCentres}
                saving={sectionSaving.innovationCentres}
                msg={sectionMsg.innovationCentres}
                onSave={(items) => saveSection("innovationCentres", "innovation-centres", items)}
                fields={[
                  { key: "name",        label: "Centre Name",    placeholder: "e.g. Centre for Innovation & Entrepreneurship", required: true, wide: true },
                  { key: "description", label: "Description",    placeholder: "Focus areas, facilities, achievements..." },
                ]}
                blankItem={{ name: "", description: "" }}
                displayField="name"
                emptyText="No innovation centres added yet."
              />

              {/* ════════════════════════════════════════════════════════════
                  INCUBATION FACILITIES
              ════════════════════════════════════════════════════════════ */}
              <ArraySection
                icon="🚀"
                title="Incubation Facilities"
                subtitle="Startup incubation and acceleration programmes"
                sectionKey="incubationFacilities"
                endpoint="incubation-facilities"
                items={incubationFacilities}
                setItems={setIncubationFacilities}
                saving={sectionSaving.incubationFacilities}
                msg={sectionMsg.incubationFacilities}
                onSave={(items) => saveSection("incubationFacilities", "incubation-facilities", items)}
                fields={[
                  { key: "name",        label: "Incubator Name", placeholder: "e.g. BIT Mesra Technology Incubator", required: true, wide: true },
                  { key: "focus",       label: "Focus Sectors",  placeholder: "e.g. Agri-Tech, FinTech, HealthTech" },
                  { key: "capacity",    label: "Capacity (startups)", placeholder: "e.g. 20", type: "number" },
                  { key: "established", label: "Established Year",    placeholder: "e.g. 2018", type: "number" },
                  { key: "description", label: "Description",         placeholder: "Facilities, funding support, success stories..." },
                ]}
                blankItem={{ name: "", focus: "", capacity: "", established: "", description: "" }}
                displayField="name"
                emptyText="No incubation facilities added yet."
              />

              {/* ════════════════════════════════════════════════════════════
                  AVAILABLE TECHNOLOGIES
              ════════════════════════════════════════════════════════════ */}
              <ArraySection
                icon="⚙️"
                title="Available Technologies"
                subtitle="Technologies, patents and tools available for collaboration"
                sectionKey="availableTechnologies"
                endpoint="available-technologies"
                items={availableTechnologies}
                setItems={setAvailableTechnologies}
                saving={sectionSaving.availableTechnologies}
                msg={sectionMsg.availableTechnologies}
                onSave={(items) => saveSection("availableTechnologies", "available-technologies", items)}
                fields={[
                  { key: "name",        label: "Technology Name", placeholder: "e.g. Low-Cost Water Filtration Module", required: true, wide: true },
                  { key: "category",    label: "Category",        placeholder: "e.g. IoT, Biotech, Civil, Agriculture" },
                  { key: "description", label: "Description",     placeholder: "Brief description of the technology and its application" },
                  { key: "patented",    label: "Patented?",       type: "select-bool" },
                ]}
                blankItem={{ name: "", category: "", description: "", patented: false }}
                displayField="name"
                emptyText="No technologies added yet."
              />

            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Reusable field component ──────────────────────────────────────────────────
function Field({ label, name, value, editing, onChange, type = "text", required = false, icon }) {
  return (
    <div className="prof-field">
      <label className="prof-field-label">
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {editing ? (
        <div className={`prof-input-wrap ${icon ? "has-icon" : ""}`}>
          {icon && <span className="prof-input-icon">{icon}</span>}
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="prof-input"
            required={required}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      ) : (
        <p className="prof-value">
          {icon && <span className="prof-value-icon">{icon}</span>}
          {value || <span className="prof-empty">Not provided</span>}
        </p>
      )}
    </div>
  );
}

function StatPill({ icon, label, value, color }) {
  return (
    <div className="prof-stat-pill">
      <span className="prof-stat-icon">{icon}</span>
      <div>
        <p className="prof-stat-label">{label}</p>
        <p className="prof-stat-value" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ArraySection — generic add/edit/delete/save section for all 6 new arrays
// ─────────────────────────────────────────────────────────────────────────────
function ArraySection({
  icon, title, subtitle,
  sectionKey, items, setItems,
  saving, msg, onSave,
  fields, blankItem, displayField, emptyText,
}) {
  const [expanded, setExpanded] = useState(null);

  const addItem = () => {
    setExpanded(items.length); // set before setItems so index is correct
    setItems(p => [...p, { ...blankItem }]);
  };

  const removeItem = (idx) => {
    setItems(p => p.filter((_, i) => i !== idx));
    setExpanded(null);
  };

  const updateItem = (idx, key, value) => {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  return (
    <div className="arr-section">
      {/* Header */}
      <div className="arr-header">
        <div className="arr-header-left">
          <span className="arr-icon">{icon}</span>
          <div>
            <h2 className="arr-title">{title}</h2>
            <p className="arr-subtitle">{subtitle} &nbsp;·&nbsp; <strong>{items.length}</strong> added</p>
          </div>
        </div>
        <div className="arr-header-actions">
          <button type="button" className="arr-add-btn" onClick={addItem}>
            <Plus size={15} /> Add
          </button>
          <button
            type="button"
            className="arr-save-btn"
            onClick={() => onSave(items)}
            disabled={saving}
          >
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`prof-banner ${msg.includes("successfully") ? "prof-banner-success" : "prof-banner-error"}`}
          style={{ marginTop: "10px" }}>
          {msg.includes("successfully") ? "✅ " : "❌ "}{msg}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="arr-empty">
          <span style={{ fontSize: "28px" }}>{icon}</span>
          <p>{emptyText}</p>
          <button type="button" className="arr-add-btn" onClick={addItem}>
            <Plus size={14} /> Add First Entry
          </button>
        </div>
      )}

      {/* Items */}
      <div className="arr-list">
        {items.map((item, idx) => {
          const isOpen   = expanded === idx;
          const preview  = item[displayField]?.trim() || `Entry ${idx + 1}`;

          return (
            <div className="arr-item-card" key={idx}>
              {/* Collapsed header — always visible */}
              <div
                className="arr-item-top"
                onClick={() => setExpanded(isOpen ? null : idx)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setExpanded(isOpen ? null : idx)}
              >
                <div className="arr-item-top-left">
                  <div className="arr-index-dot">{idx + 1}</div>
                  <span className="arr-item-preview">{preview}</span>
                </div>
                <div className="arr-item-top-right">
                  <button
                    type="button"
                    className="arr-remove-btn"
                    onClick={e => { e.stopPropagation(); removeItem(idx); }}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isOpen
                    ? <ChevronDownIcon size={16} color="#64748b" />
                    : <ChevronRight    size={16} color="#64748b" />
                  }
                </div>
              </div>

              {/* Expanded fields */}
              {isOpen && (
                <div className="arr-item-body">
                  <div className="arr-fields-grid">
                    {fields.map(f => (
                      <div
                        key={f.key}
                        className={`arr-field ${f.wide ? "arr-field--wide" : ""}`}
                      >
                        <label className="prof-field-label">
                          {f.label}{f.required && <span style={{ color: "#ef4444" }}> *</span>}
                        </label>

                        {f.type === "select-bool" ? (
                          <select
                            className="prof-input"
                            value={item[f.key] ? "true" : "false"}
                            onChange={e => updateItem(idx, f.key, e.target.value === "true")}
                          >
                            <option value="false">No</option>
                            <option value="true">Yes — Patented</option>
                          </select>
                        ) : f.type === "number" ? (
                          <input
                            type="number"
                            className="prof-input"
                            placeholder={f.placeholder}
                            value={item[f.key] || ""}
                            onChange={e => updateItem(idx, f.key, e.target.value)}
                          />
                        ) : f.key === "description" ? (
                          <textarea
                            className="prof-textarea"
                            rows={3}
                            placeholder={f.placeholder}
                            value={item[f.key] || ""}
                            onChange={e => updateItem(idx, f.key, e.target.value)}
                          />
                        ) : (
                          <input
                            type="text"
                            className="prof-input"
                            placeholder={f.placeholder}
                            value={item[f.key] || ""}
                            onChange={e => updateItem(idx, f.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
