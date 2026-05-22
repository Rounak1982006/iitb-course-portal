import { useState, useEffect, useCallback } from "react";
import logo from "./logo.webp"

// ─── API CONFIG ───────────────────────────────────────────────────────────────
const API = "http://127.0.0.1:8000/api";

const apiFetch = async (endpoint, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
};

const CAT_COLORS = {
  "Computer Science":       { bg: "#E8F4FD", text: "#1565C0", dot: "#2196F3" },
  "Management":             { bg: "#F3E8FF", text: "#6B21A8", dot: "#9C27B0" },
  "Mathematics":            { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" },
  "Mechanical Engineering": { bg: "#FFF8E1", text: "#E65100", dot: "#FF9800" },
  "Physics":                { bg: "#FCE4EC", text: "#880E4F", dot: "#E91E63" },
};

const LEVEL_COLORS = {
  Beginner:     { bg: "#E8F5E9", text: "#2E7D32" },
  Intermediate: { bg: "#FFF8E1", text: "#E65100" },
  Advanced:     { bg: "#FFEBEE", text: "#C62828" },
  "All Levels": { bg: "#E3F2FD", text: "#1565C0" },
};

const STATUS_STYLES = {
  pending:  { bg: "#FFF8E1", text: "#E65100", label: "⏳ Pending" },
  accepted: { bg: "#E8F5E9", text: "#2E7D32", label: "✓ Accepted" },
  rejected: { bg: "#FFEBEE", text: "#C62828", label: "✕ Rejected" },
};

const emptyCourse = () => ({
  code: "", title: "", category: "Computer Science", duration: "",
  schedule: "", total_seats: "",
  level: "Beginner", instructor: "", department: "", description: "",
});

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [authMode, setAuthMode] = useState("student");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Portal
  const [courses, setCourses] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [filterCat, setFilterCat] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [detailCourse, setDetailCourse] = useState(null);
  const [regModal, setRegModal] = useState(null);
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({ phone: "", rollno: "", goal: "" });
  const [portalTab, setPortalTab] = useState("browse"); 
  // Admin
  const [adminTab, setAdminTab] = useState("courses");
  const [courseModal, setCourseModal] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourse());
  const [regFilter, setRegFilter] = useState("all");
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [dashStats, setDashStats] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── LOAD USER ON MOUNT ────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      apiFetch("/auth/me/", {}, token)
        .then(u => { setUser(u); setView(u.role === "admin" ? "admin" : "portal"); })
        .catch(() => { localStorage.removeItem("token"); setToken(null); setView("login"); });
    }
  }, []);

  // ── LOAD COURSES ──────────────────────────────────────────────────────────
  const loadCourses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQ) params.append("search", searchQ);
      if (filterCat !== "All") params.append("category", filterCat);
      const data = await apiFetch(`/courses/?${params}`, {}, token);
      setCourses(data);
    } catch (e) { showToast("Failed to load courses.", "error"); }
  }, [searchQ, filterCat, token]);

  useEffect(() => { if (view === "portal" || view === "admin") loadCourses(); }, [view, filterCat, searchQ]);

  // ── LOAD MY REGISTRATIONS ─────────────────────────────────────────────────
  const loadMyRegistrations = useCallback(async () => {
    try { const data = await apiFetch("/registrations/", {}, token); setMyRegistrations(data); } catch (e) {}
  }, [token]);

  useEffect(() => { if (view === "portal") loadMyRegistrations(); }, [view]);

  // ── LOAD ADMIN DATA ───────────────────────────────────────────────────────
  const loadAdminData = useCallback(async () => {
    try {
      const [regs, users, stats] = await Promise.all([
        apiFetch("/admin/registrations/", {}, token),
        apiFetch("/admin/users/", {}, token),
        apiFetch("/admin/dashboard/", {}, token),
      ]);
      setAllRegistrations(regs);
      setAllUsers(users);
      setDashStats(stats);
    } catch (e) { showToast("Failed to load admin data.", "error"); }
  }, [token]);

  useEffect(() => { if (view === "admin") loadAdminData(); }, [view]);

  // ── AUTH ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setAuthErr("");
    setAuthLoading(true);
    try {
      const data = await apiFetch("/auth/login/", { method: "POST", body: JSON.stringify(loginForm) });
      localStorage.setItem("token", data.access);
      setToken(data.access);
      setUser(data.user);
      setView(data.user.role === "admin" ? "admin" : "portal");
      showToast(`Welcome, ${data.user.full_name?.split(" ")[0]}!`);
    } catch (e) { setAuthErr(e.data?.error || "Invalid email or password."); }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null); setUser(null); setView("login");
    setCourses([]); setMyRegistrations([]);
    setLoginForm({ email: "", password: "" });
    setFilterCat("All"); setSearchQ(""); setDetailCourse(null);
  };

  // ── REGISTRATION ──────────────────────────────────────────────────────────
  const myRegForCourse = (courseId) => myRegistrations.find(r => r.course === courseId);

  const openRegModal = (course) => {
    setRegModal(course); setRegStep(1);
    setRegForm({ phone: "", rollno: "", goal: "" });
  };

  const submitReg = async () => {
    try {
      await apiFetch("/registrations/apply/", {
        method: "POST",
        body: JSON.stringify({ course: regModal.id, phone: regForm.phone, roll_number: regForm.rollno, motivation: regForm.goal }),
      }, token);
      await loadMyRegistrations();
      await loadCourses();
      setRegStep(3);
      showToast(`Applied for ${regModal.code}!`);
    } catch (e) { showToast(e.data?.detail || e.data?.course?.[0] || "Failed to apply.", "error"); }
  };

  // ── ADMIN: COURSES ────────────────────────────────────────────────────────
  const openAddCourse = () => { setCourseForm(emptyCourse()); setCourseModal({ mode: "add" }); };
  const openEditCourse = (c) => {
    setCourseForm({ code: c.code, title: c.title, category: c.category, duration: c.duration, schedule: c.schedule, total_seats: String(c.total_seats), level: c.level, instructor: c.instructor, department: c.department || "", description: c.description });
    setCourseModal({ mode: "edit", id: c.id });
  };

  const saveCourse = async () => {
    if (!courseForm.code || !courseForm.title || !courseForm.instructor) { showToast("Fill required fields.", "error"); return; }
    try {
      if (courseModal.mode === "add") {
        await apiFetch("/admin/courses/", { method: "POST", body: JSON.stringify(courseForm) }, token);
        showToast("Course added!");
      } else {
        await apiFetch(`/admin/courses/${courseModal.id}/`, { method: "PUT", body: JSON.stringify(courseForm) }, token);
        showToast("Course updated!");
      }
      setCourseModal(null); loadCourses();
    } catch (e) { showToast(Object.values(e.data || {})?.[0]?.[0] || "Failed to save.", "error"); }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await apiFetch(`/admin/courses/${id}/`, { method: "DELETE" }, token);
      showToast("Course deleted."); loadCourses(); loadAdminData();
    } catch (e) { showToast("Failed to delete.", "error"); }
  };

  // ── ADMIN: REGISTRATIONS ──────────────────────────────────────────────────
  const updateRegStatus = async (id, status) => {
    try {
      await apiFetch(`/admin/registrations/${id}/status/`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
      showToast(`Registration ${status}.`); loadAdminData();
    } catch (e) { showToast("Failed to update status.", "error"); }
  };

  const filteredRegs = regFilter === "all" ? allRegistrations : allRegistrations.filter(r => r.status === regFilter);

  // ── PORTAL FILTERS ────────────────────────────────────────────────────────
  const categories = ["All", ...new Set(courses.map(c => c.category))];
  const filteredCourses = courses;

  const initials = user ? (user.full_name || user.email || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "";

  // ── STYLES ────────────────────────────────────────────────────────────────
  const S = {
    root: { fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: "100vh", background: "#042045", position: "relative" },
    authWrap: { display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
    authCard: { background: "#fff", borderRadius: 24, padding: "2.5rem 2rem", width: "100%", maxWidth: 420, boxShadow: "0 8px 48px rgba(0,0,0,0.18)" },
    logoBlock: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: "1.75rem", textAlign: "center" },
    logoText: { fontSize: 18, fontWeight: 800, color: "#042045", letterSpacing: "-0.3px", lineHeight: 1.3 },
    logoSub: { fontSize: 11, color: "#888" },
    label: { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 },
    inp: { width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, color: "#111", outline: "none", boxSizing: "border-box", marginBottom: "1rem", background: "#fafafa" },
    btnPrimary: { width: "100%", padding: "11px", background: "linear-gradient(135deg,#042045,#1565C0)", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 },
    btnSec: { padding: "7px 14px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" },
    errorBox: { background: "#FEE2E2", color: "#991B1B", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: "1rem" },
    demoHint: { background: "#EEF2FF", color: "#3730A3", padding: "8px 12px", borderRadius: 8, fontSize: 11, marginTop: "1rem", textAlign: "center" },
    header: { background: "#fff", borderBottom: "1px solid #e8e8f0", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 },
    headerLogo: { display: "flex", alignItems: "center", gap: 10 },
    headerMark: { width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#042045,#1565C0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 },
    avatar: { width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#042045,#1565C0)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 },
    logoutBtn: { background: "none", border: "1.5px solid #e5e7eb", color: "#6b7280", padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12 },
    main: { padding: "2rem", maxWidth: 1200, margin: "0 auto" },
    heroH1: { fontSize: 24, fontWeight: 800, color: "#000000", margin: "0 0 4px", letterSpacing: "-0.5px" },
    heroHX: { fontSize: 24, fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.5px" },
    heroPara: { fontSize: 13, color: "#6b7280", marginBottom: "1.25rem" },
    filterBar: { display: "flex", flexWrap: "wrap", gap: 7, marginBottom: "1.1rem", alignItems: "center" },
    chip: (a) => ({ padding: "5px 13px", borderRadius: 20, border: `1.5px solid ${a ? "#042045" : "#e5e7eb"}`, background: a ? "#042045" : "#fff", color: a ? "#fff" : "#6b7280", cursor: "pointer", fontSize: 12, fontWeight: a ? 700 : 400 }),
    searchWrap: { position: "relative", marginLeft: "auto" },
    searchInp: { padding: "6px 14px 6px 32px", border: "1.5px solid #e5e7eb", borderRadius: 20, fontSize: 12, outline: "none", background: "#fff", width: 210 },
    searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "1rem" },
    card: { background: "#fff", borderRadius: 14, border: "1px solid #e8e8f0", overflow: "hidden", transition: "box-shadow 0.2s,transform 0.2s" },
    cardTop: (cat) => ({ background: CAT_COLORS[cat]?.bg || "#f3f4f6", padding: "1rem 1.2rem 0.75rem", borderBottom: "1px solid rgba(0,0,0,0.04)" }),
    catPill: (cat) => ({ display: "inline-flex", alignItems: "center", gap: 4, background: "#fff", color: CAT_COLORS[cat]?.text || "#555", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.4px" }),
    catDot: (cat) => ({ width: 5, height: 5, borderRadius: "50%", background: CAT_COLORS[cat]?.dot || "#888", display: "inline-block" }),
    codeTag: { fontSize: 10, fontWeight: 800, color: "#042045", background: "#E3F2FD", padding: "2px 7px", borderRadius: 5, marginLeft: 5 },
    cardTitle: { fontSize: 14, fontWeight: 700, color: "#1a1a2e", margin: "0 0 2px", lineHeight: 1.3 },
    cardInstr: { fontSize: 11, color: "#6b7280" },
    cardBody: { padding: "0.85rem 1.2rem" },
    cardDesc: { fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: "0.8rem" },
    metaRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.8rem" },
    meta: { fontSize: 11, color: "#6b7280", background: "#f9fafb", padding: "2px 7px", borderRadius: 5 },
    levelTag: (lv) => ({ display: "inline-block", padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: LEVEL_COLORS[lv]?.bg || "#f3f4f6", color: LEVEL_COLORS[lv]?.text || "#555" }),
    cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.65rem" },
    statusPill: (st) => ({ display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: STATUS_STYLES[st]?.bg, color: STATUS_STYLES[st]?.text }),
    enrollBtn: (st) => ({ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 700, cursor: st ? "default" : "pointer", background: st === "accepted" ? "#E8F5E9" : st === "pending" ? "#FFF8E1" : st === "rejected" ? "#FFEBEE" : "linear-gradient(135deg,#042045,#1565C0)", color: st === "accepted" ? "#2E7D32" : st === "pending" ? "#E65100" : st === "rejected" ? "#C62828" : "#fff" }),
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1rem" },
    modal: { background: "#fff", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", position: "relative" },
    closeBtn: { position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" },
    stepDots: { display: "flex", gap: 5, marginBottom: "1.4rem" },
    dot: (a) => ({ width: a ? 18 : 7, height: 7, borderRadius: 4, background: a ? "#042045" : "#e5e7eb", transition: "all 0.3s" }),
    successCircle: { width: 60, height: 60, background: "#E8F5E9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 1rem" },
    tabs: { display: "flex", gap: 0, background: "#e8eaf0", borderRadius: 10, padding: 4, marginBottom: "1.4rem", width: "fit-content" },
    tab: (a) => ({ padding: "7px 18px", borderRadius: 8, border: "none", background: a ? "#fff" : "none", color: a ? "#042045" : "#6b7280", fontWeight: a ? 700 : 400, cursor: "pointer", fontSize: 13, boxShadow: a ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }),
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { padding: "10px 14px", background: "#f3f4f6", color: "#374151", fontWeight: 700, textAlign: "left", fontSize: 11, borderBottom: "1px solid #e5e7eb" },
    td: { padding: "9px 14px", borderBottom: "1px solid #f3f4f6", color: "#374151", verticalAlign: "middle" },
    addBtn: { padding: "7px 16px", background: "linear-gradient(135deg,#042045,#1565C0)", color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer" },
    actionBtn: (color) => ({ padding: "3px 9px", border: `1.5px solid ${color}`, borderRadius: 6, background: "none", color, fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: 4 }),
    statCard: { background: "#fff", borderRadius: 12, padding: "1rem 1.25rem", border: "1px solid #e8e8f0" },
    toast: (type) => ({ position: "fixed", bottom: 24, right: 24, background: type === "success" ? "#042045" : "#C62828", color: "#fff", padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", animation: "slideUp 0.3s ease" }),
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (view === "login") {
    return (
      <div style={S.root}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
        <div style={S.authWrap}>
          <div style={S.authCard}>
            <div style={S.logoBlock}>
              <img src={logo} alt="IITB LOGO" style={{width:108,height:108}}></img>
             
              <div style={S.logoText}>IITB Course Registration Portal</div>
              <div style={S.logoSub}>Indian Institute of Technology Bombay</div>
            </div>


            

           <div style={{ display: "flex", gap: 0, marginBottom: "1.25rem", background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
  {["student", "admin"].map(m => (
    <button key={m} onClick={() => { setAuthMode(m); setAuthErr(""); }}
      style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", background: authMode === m ? "#fff" : "none", fontWeight: authMode === m ? 700 : 400, color: authMode === m ? "#042045" : "#6b7280", cursor: "pointer", fontSize: 13, boxShadow: authMode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
      {m === "student" ? "Student Sign In" : "Admin Sign In"}
    </button>
  ))}
</div>

{authErr && <div style={S.errorBox}>{authErr}</div>}

<label style={S.label}>{authMode === "student" ? "Institute Email" : "Admin Email"}</label>
<input style={S.inp} type="email"
  placeholder={authMode === "student" ? "rollno@iitb.ac.in" : "admin@iitb.ac.in"}
  value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
<label style={S.label}>Password</label>
<input style={S.inp} type="password" placeholder="••••••••"
  value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
  onKeyDown={e => e.key === "Enter" && handleLogin()} />
<button style={{ ...S.btnPrimary, opacity: authLoading ? 0.7 : 1 }} onClick={handleLogin} disabled={authLoading}>
  {authMode === "student" ? "Student Sign In →" : "Admin Sign In →"}
</button>
<div style={S.demoHint}>
  {authMode === "student"
    ? <><strong>Demo:</strong> 25B0001@iitb.ac.in / iitb1234</>
    : <><strong>Demo:</strong> admin@iitb.ac.in / admin123</>}
</div>
          </div>
        </div>
        {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
      </div>
    );
  }

  // ── SHARED HEADER ─────────────────────────────────────────────────────────
  const Header = ({ extra }) => (
    <header style={S.header}>
      <div style={S.headerLogo}>
        {/* <div style={S.headerMark}> */}
          <img src={logo} style={{width:48,height:48}}></img>
        {/* </div> */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#042045" }}>IITB Course Portal</div>
          <div style={{ fontSize: 10, color: "#888" }}>{user?.role === "admin" ? "Admin Panel" : "Student Portal"}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {extra}
        {user?.role === "admin" && view !== "admin" && (
          <button style={{ ...S.btnSec, background: "#042045", color: "#fff" }} onClick={() => setView("admin")}>Admin Panel</button>
        )}
        {view === "admin" && (
          <button style={S.btnSec} onClick={() => setView("portal")}>Student View</button>
        )}
        <div style={S.avatar}>{initials}</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{(user?.full_name || user?.email || "").split(" ")[0]}</span>
        <button style={S.logoutBtn} onClick={handleLogout}>Sign out</button>
      </div>
    </header>
  );

  // ── ADMIN PANEL ───────────────────────────────────────────────────────────
  if (view === "admin") {
    const pendingCount = dashStats?.pending_registrations || 0;
    return (
      <div style={{ ...S.root, background: "#f8f9fc" }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.hrow:hover{background:#f9fafb}`}</style>
        <Header />
        <div style={S.main}>
          <div style={{ marginBottom: "1.4rem" }}>
            <h1 style={{ ...S.heroH1, fontSize: 20 }}>Admin Dashboard</h1>
            <p style={S.heroPara}>Manage courses, review applications, and oversee enrolled students.</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: "1.5rem" }}>
            {[
              { label: "Total Courses", value: dashStats?.total_courses ?? courses.length, color: "#042045" },
              { label: "Applications", value: dashStats?.total_registrations ?? "—", color: "#1565C0" },
              { label: "Pending Review", value: pendingCount, color: "#E65100" },
              { label: "Students", value: dashStats?.total_students ?? "—", color: "#2E7D32" },
            ].map(s => (
              <div key={s.label} style={S.statCard}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={S.tabs}>
            {[["courses", "Courses"], ["registrations", "Applications"], ["users", "Users"]].map(([k, l]) => (
              <button key={k} style={S.tab(adminTab === k)} onClick={() => setAdminTab(k)}>
                {l}
                {k === "registrations" && pendingCount > 0 && (
                  <span style={{ background: "#E65100", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, marginLeft: 5 }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* COURSES TAB */}
          {adminTab === "courses" && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e8f0", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>All Courses ({courses.length})</span>
                <button style={S.addBtn} onClick={openAddCourse}>+ Add Course</button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr>{["Code", "Title", "Instructor", "Category", "Seats", "Level", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id} className="hrow">
                        <td style={S.td}><span style={{ fontWeight: 800, color: "#042045" }}>{c.code}</span></td>
                        <td style={{ ...S.td, fontWeight: 600 }}>{c.title}</td>
                        <td style={S.td}>{c.instructor}</td>
                        <td style={S.td}><span style={{ ...S.catPill(c.category), marginBottom: 0 }}><span style={S.catDot(c.category)} />{c.category}</span></td>
                        <td style={S.td}>{c.available_seats}/{c.total_seats}</td>
                        <td style={S.td}><span style={S.levelTag(c.level)}>{c.level}</span></td>
                        <td style={S.td}>
                          <button style={S.actionBtn("#1565C0")} onClick={() => openEditCourse(c)}>Edit</button>
                          <button style={S.actionBtn("#C62828")} onClick={() => deleteCourse(c.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REGISTRATIONS TAB */}
          {adminTab === "registrations" && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e8f0", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>All Applications ({allRegistrations.length})</span>
                <div style={{ display: "flex", gap: 5 }}>
                  {["all", "pending", "accepted", "rejected"].map(f => (
                    <button key={f} style={{ ...S.chip(regFilter === f), padding: "3px 10px", fontSize: 11 }} onClick={() => setRegFilter(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {filteredRegs.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📋</div>
                  <div style={{ fontWeight: 600 }}>No applications yet</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={S.table}>
                    <thead><tr>{["Student", "Roll No.", "Course", "Applied On", "Status", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredRegs.map(r => (
                        <tr key={r.id} className="hrow">
                          <td style={{ ...S.td, fontWeight: 600 }}>{r.student_name}</td>
                          <td style={S.td}>{r.student_roll || "—"}</td>
                          <td style={S.td}><span style={{ fontWeight: 800, color: "#042045" }}>{r.course_code}</span> — {r.course_title}</td>
                          <td style={S.td}>{new Date(r.applied_at).toLocaleDateString("en-IN")}</td>
                          <td style={S.td}><span style={S.statusPill(r.status)}>{STATUS_STYLES[r.status]?.label}</span></td>
                          <td style={S.td}>
                            {r.status !== "accepted" && <button style={S.actionBtn("#2E7D32")} onClick={() => updateRegStatus(r.id, "accepted")}>Accept</button>}
                            {r.status !== "rejected" && <button style={S.actionBtn("#C62828")} onClick={() => updateRegStatus(r.id, "rejected")}>Reject</button>}
                            {r.status !== "pending"  && <button style={S.actionBtn("#E65100")} onClick={() => updateRegStatus(r.id, "pending")}>Reset</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {adminTab === "users" && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e8f0", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Registered Users ({allUsers.length})</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr>{["Name", "Email", "Roll No.", "Applications"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {allUsers.map(u => (
  <tr key={u.id} className="hrow">
    <td style={{ ...S.td, fontWeight: 600 }}>{u.full_name}</td>
    <td style={S.td}>{u.email}</td>
    <td style={S.td}>{u.roll_number || "—"}</td>
    <td style={S.td}>{u.registration_count}</td>
  </tr>
))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Course Add/Edit Modal */}
        {courseModal && (
          <div style={S.overlay} onClick={e => e.target === e.currentTarget && setCourseModal(null)}>
            <div style={S.modal}>
              <button style={S.closeBtn} onClick={() => setCourseModal(null)}>✕</button>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 1.25rem", color: "#042045" }}>
                {courseModal.mode === "add" ? "Add New Course" : "Edit Course"}
              </h2>
              {[
                ["Course Code *", "code", "text", "e.g. CS101"],
                ["Course Title *", "title", "text", "e.g. Introduction to CS"],
                ["Instructor *", "instructor", "text", "Prof. Name"],
                ["Department", "dept", "text", "Dept. of ..."],
                ["Duration", "duration", "text", "e.g. 16 weeks"],
                ["Schedule", "schedule", "text", "Mon/Wed, 9–10 AM"],
                ["Seat Limit", "total_seats", "number", "50"],
              ].map(([lbl, key, type, ph]) => (
                <div key={key}>
                  <label style={S.label}>{lbl}</label>
                  <input style={S.inp} type={type} placeholder={ph}
                    value={courseForm[key]} onChange={e => setCourseForm({ ...courseForm, [key]: e.target.value })} />
                </div>
              ))}
              <label style={S.label}>Category</label>
              <select style={{ ...S.inp, cursor: "pointer" }} value={courseForm.category}
                onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}>
                {["Computer Science", "Management", "Mathematics", "Mechanical Engineering", "Physics"].map(c => <option key={c}>{c}</option>)}
              </select>
              <label style={S.label}>Level</label>
              <select style={{ ...S.inp, cursor: "pointer" }} value={courseForm.level}
                onChange={e => setCourseForm({ ...courseForm, level: e.target.value })}>
                {["Beginner", "Intermediate", "Advanced", "All Levels"].map(l => <option key={l}>{l}</option>)}
              </select>
              <label style={S.label}>Description</label>
              <textarea style={{ ...S.inp, minHeight: 75, resize: "vertical" }} placeholder="Course description..."
                value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} />
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button style={{ ...S.btnPrimary, background: "#f3f4f6", color: "#374151", flex: 1 }} onClick={() => setCourseModal(null)}>Cancel</button>
                <button style={{ ...S.btnPrimary, flex: 2 }} onClick={saveCourse}>
                  {courseModal.mode === "add" ? "Add Course" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
      </div>
    );
  }

  // ── STUDENT PORTAL ────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .cc:hover{box-shadow:0 6px 28px rgba(4,32,69,0.13)!important;transform:translateY(-2px)!important}
        input:focus,textarea:focus,select:focus{border-color:#042045!important}
      `}</style>
      <Header extra={
        myRegistrations.length > 0 ? (
          <span style={{ background: "#E3F2FD", color: "#1565C0", padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11 }}>
            {myRegistrations.length} applied
          </span>
        ) : null
      } />

      <main style={S.main}>
        <div style={{ marginBottom: "1.25rem" }}>
  <h1 style={S.heroHX}> Course Registration Portal</h1>
  <p style={S.heroPara}>Semester Registration Open</p>
</div>

{/* Tab switcher */}
<div style={{ display: "flex", gap: 0, background: "#e8eaf0", borderRadius: 10, padding: 4, marginBottom: "1.5rem", width: "fit-content" }}>
  <button
    onClick={() => setPortalTab("browse")}
    style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: portalTab === "browse" ? "#fff" : "none", fontWeight: portalTab === "browse" ? 700 : 400, color: portalTab === "browse" ? "#042045" : "#6b7280", cursor: "pointer", fontSize: 14, boxShadow: portalTab === "browse" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
    Browse Courses
  </button>
  <button
  onClick={() => setPortalTab("enrolled")}
  style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: portalTab === "enrolled" ? "#fff" : "none", fontWeight: portalTab === "enrolled" ? 700 : 400, color: portalTab === "enrolled" ? "#042045" : "#6b7280", cursor: "pointer", fontSize: 14, boxShadow: portalTab === "enrolled" ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
  Enrolled Courses
  {myRegistrations.filter(r => r.status === "accepted").length > 0 && (
    <span style={{ background: "#2E7D32", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700, marginLeft: 6 }}>
      {myRegistrations.filter(r => r.status === "accepted").length}
    </span>
  )}
</button>
  <button
    onClick={() => setPortalTab("myapps")}
    style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: portalTab === "myapps" ? "#fff" : "none", fontWeight: portalTab === "myapps" ? 700 : 400, color: portalTab === "myapps" ? "#042045" : "#6b7280", cursor: "pointer", fontSize: 14, boxShadow: portalTab === "myapps" ? "0 1px 4px rgba(0,0,0,0.1)" : "none", position: "relative" }}>
    My Applications
    {myRegistrations.length > 0 && (
      <span style={{ background: "#042045", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700, marginLeft: 6 }}>
        {myRegistrations.length}
      </span>
    )}
  </button>
</div>


        {/* Filters */}
        {portalTab === "browse" && ( 
          <>
        <div style={{ marginBottom: "1.1rem" }}>
  <div style={S.searchWrap}>
    <span style={S.searchIcon}>🔍</span>
    <input style={{ ...S.searchInp, width: 300 }} placeholder="Search by code, title or instructor..."
      value={searchQ} onChange={e => setSearchQ(e.target.value)} />
  </div>
</div>

        {/* Grid */}
        <div style={S.grid}>
          {filteredCourses.map(course => {
            const myReg = myRegForCourse(course.id);
            const st = myReg?.status;
            return (
              <div key={course.id} style={S.card} className="cc">
                <div style={S.cardTop(course.category)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <span style={S.catPill(course.category)}><span style={S.catDot(course.category)} />{course.category}</span>
                    <span style={S.levelTag(course.level)}>{course.level}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline" }}>
                    <div style={S.cardTitle}>{course.title}</div>
                    <span style={S.codeTag}>{course.code}</span>
                  </div>
                  <div style={S.cardInstr}>{course.instructor} · {course.dept}</div>
                </div>
                <div style={S.cardBody}>
                  <p style={S.cardDesc}>{course.description}</p>
                  <div style={S.metaRow}>
                    <span style={S.meta}>⏱ {course.duration}</span>
                    <span style={S.meta}>📅 {course.schedule}</span>
                    <span style={S.meta}>🪑 {course.available_seats}/{course.total_seats} seats</span>
                  </div>
                  <div style={S.cardFooter}>
                    <button style={{ ...S.btnSec, fontSize: 11 }} onClick={() => setDetailCourse(course)}>Details</button>
                    <button style={S.enrollBtn(st)} onClick={() => !st && openRegModal(course)}>
                      {st ? STATUS_STYLES[st]?.label : "Apply Now →"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredCourses.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>🔍</div>
              <div style={{ fontWeight: 700, color: "#374151" }}>No courses found</div>
              <div style={{ fontSize: 12 }}>Try adjusting your search or filter</div>
            </div>
          )}
        </div>
        </>
        )}
        {portalTab === "myapps" && (
  <div>
    {myRegistrations.length === 0 ? (
      <div style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
        <div style={{ fontWeight: 700, color: "#374151", fontSize: 16 }}>No applications yet</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Browse courses and click Apply Now to get started</div>
        <button
          style={{ ...S.btnPrimary, width: "auto", padding: "10px 24px", marginTop: 20, display: "inline-block" }}
          onClick={() => setPortalTab("browse")}>
          Browse Courses →
        </button>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {myRegistrations.map(r => (
          <div key={r.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: STATUS_STYLES[r.status]?.bg, padding: "8px 20px", borderBottom: "1px solid #e8e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_STYLES[r.status]?.text }}>
                {STATUS_STYLES[r.status]?.label}
              </span>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Applied: {new Date(r.applied_at).toLocaleDateString("en-IN")}</span>
            </div>
            <div style={{ padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>
  <div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
      <span style={{ fontWeight: 800, fontSize: 13, color: "#042045" }}>{r.course_code}</span>
      <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{r.course_title}</span>
    </div>
    <div style={{ fontSize: 12, color: "#6b7280" }}>
      📅 {r.course_schedule} &nbsp;·&nbsp; ⏱ {r.course_duration}
    </div>
  </div>
  <div style={{ textAlign: "right" }}>
                {r.status === "pending" && (
                  <div style={{ background: "#FFF8E1", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#E65100" }}>⏳ Under Review</div>
                    <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>Your application is being reviewed by the admin. You will be notified once a decision is made.</div>
                  </div>
                )}
                {r.status === "accepted" && (
                  <div style={{ background: "#E8F5E9", border: "1px solid #A7D7A7", borderRadius: 8, padding: "8px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#2E7D32" }}>✓ Application Accepted</div>
                    <div style={{ fontSize: 11, color: "#1B5E20", marginTop: 2 }}>Congratulations! You are enrolled in this course. Check your email for further details.</div>
                  </div>
                )}
                {r.status === "rejected" && (
                  <div style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8, padding: "8px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#C62828" }}>✕ Application Rejected</div>
                    <div style={{ fontSize: 11, color: "#B71C1C", marginTop: 2 }}>Unfortunately your application was not accepted this time. You may apply for other courses.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
    {portalTab === "enrolled" && (
  <div>
    {myRegistrations.filter(r => r.status === "accepted").length === 0 ? (
      <div style={{ textAlign: "center", padding: "4rem", color: "#9ca3af" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎓</div>
        <div style={{ fontWeight: 700, color: "#374151", fontSize: 16 }}>No enrolled courses yet</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Once your application is accepted it will appear here</div>
        <button
          style={{ ...S.btnPrimary, width: "auto", padding: "10px 24px", marginTop: 20, display: "inline-block" }}
          onClick={() => setPortalTab("browse")}>
          Browse Courses →
        </button>
      </div>
    ) : (
      <>
        <div style={{ marginBottom: "1rem" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>
            {myRegistrations.filter(r => r.status === "accepted").length} Course{myRegistrations.filter(r => r.status === "accepted").length !== 1 ? "s" : ""} Enrolled
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "1rem" }}>
          {myRegistrations.filter(r => r.status === "accepted").map(r => {
            const course = courses.find(c => c.id === r.course);
            return (
              <div key={r.id} style={{ background: "#fff", borderRadius: 14, border: "2px solid #A7D7A7", overflow: "hidden", boxShadow: "0 2px 12px rgba(46,125,50,0.08)" }}>
                {/* Green enrolled header */}
                <div style={{ background: "#2E7D32", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>{r.course_code}</span>
                  <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>✓ ENROLLED</span>
                </div>

                <div style={{ padding: "1rem 1.2rem" }}>
                  {/* Course title */}
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", marginBottom: 4 }}>{r.course_title}</div>

                  {/* Instructor */}
                  {course && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
                      {course.instructor} · {course.department}
                    </div>
                  )}

                  {/* Schedule and duration */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: "#6b7280", background: "#f9fafb", padding: "3px 8px", borderRadius: 5 }}>
                      📅 {r.course_schedule}
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280", background: "#f9fafb", padding: "3px 8px", borderRadius: 5 }}>
                      ⏱ {r.course_duration}
                    </span>
                    {course && (
                      <span style={{ fontSize: 11, color: "#6b7280", background: "#f9fafb", padding: "3px 8px", borderRadius: 5 }}>
                        📊 {course.level}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {course && (
                    <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 12 }}>
                      {course.description}
                    </p>
                  )}

                  {/* Enrolled on */}
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      Enrolled on {new Date(r.applied_at).toLocaleDateString("en-IN")}
                    </span>
                    <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
)}
      </main>

      {/* Detail Modal */}
      {detailCourse && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setDetailCourse(null)}>
          <div style={S.modal}>
            <button style={S.closeBtn} onClick={() => setDetailCourse(null)}>✕</button>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 3 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#042045" }}>{detailCourse.title}</h2>
              <span style={S.codeTag}>{detailCourse.code}</span>
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: "1rem" }}>{detailCourse.dept}</p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: "1rem" }}>{detailCourse.description}</p>
            {[["Instructor", detailCourse.instructor], ["Schedule", detailCourse.schedule], ["Duration", detailCourse.duration], ["Available Seats", `${detailCourse.available_seats} / ${detailCourse.total_seats}`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{l}</span>
                <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: "1rem" }}>
              {(() => {
                const r = myRegForCourse(detailCourse.id);
                return r
                  ? <div style={{ textAlign: "center", padding: "10px", background: STATUS_STYLES[r.status]?.bg, borderRadius: 10, fontWeight: 700, color: STATUS_STYLES[r.status]?.text }}>
                      {STATUS_STYLES[r.status]?.label} — Applied {r.appliedAt}
                    </div>
                  : <button style={S.btnPrimary} onClick={() => { setDetailCourse(null); openRegModal(detailCourse); }}>Apply for this Course →</button>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {regModal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setRegModal(null)}>
          <div style={S.modal}>
            <button style={S.closeBtn} onClick={() => setRegModal(null)}>✕</button>
            <div style={S.stepDots}>{[1, 2, 3].map(s => <div key={s} style={S.dot(regStep >= s)} />)}</div>

            {regStep === 1 && (
              <>
                <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 3px", color: "#042045" }}>Course Application</h2>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: "1.1rem" }}>{regModal.code} — {regModal.title}</p>
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "0.85rem", marginBottom: "1.1rem", border: "1px solid #e5e7eb" }}>
                  {[["Instructor", regModal.instructor], ["Schedule", regModal.schedule], ["Duration", regModal.duration], ["Seats", `${regModal.available_seats} available`]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: "#6b7280" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <label style={S.label}>Roll Number *</label>
                <input style={S.inp} type="text" placeholder="e.g. 25B0001" value={regForm.rollno}
                  onChange={e => setRegForm({ ...regForm, rollno: e.target.value })} />
                <label style={S.label}>Phone Number *</label>
                <input style={S.inp} type="tel" placeholder="+91 XXXXX XXXXX" value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
                <label style={S.label}>Motivation / Learning Goal (optional)</label>
                <textarea style={{ ...S.inp, resize: "vertical", minHeight: 70 }} placeholder="Why do you want to take this course?"
                  value={regForm.goal} onChange={e => setRegForm({ ...regForm, goal: e.target.value })} />
                <button style={{ ...S.btnPrimary, opacity: regForm.phone && regForm.rollno ? 1 : 0.5 }}
                  onClick={() => regForm.phone && regForm.rollno && setRegStep(2)}>Continue →</button>
              </>
            )}

            {regStep === 2 && (
              <>
                <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 3px", color: "#042045" }}>Confirm Application</h2>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: "1.1rem" }}>Please review before submitting.</p>
                {[["Course", `${regModal.code} — ${regModal.title}`], ["Applicant", user?.name], ["Email", user?.email], ["Roll No.", regForm.rollno], ["Phone", regForm.phone], ["Schedule", regModal.schedule], ["Duration", regModal.duration]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>{l}</span>
                    <span style={{ fontWeight: 600, maxWidth: "58%", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: "1.1rem" }}>
                  <button style={{ ...S.btnPrimary, background: "#f3f4f6", color: "#374151", flex: 1 }} onClick={() => setRegStep(1)}>← Back</button>
                  <button style={{ ...S.btnPrimary, flex: 2 }} onClick={submitReg}>Submit Application</button>
                </div>
              </>
            )}

            {regStep === 3 && (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={S.successCircle}>🎓</div>
                <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px", color: "#042045" }}>Application Submitted!</h2>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: "1.1rem" }}>
                  Your application for <strong>{regModal.code}</strong> is under review. You'll be notified once the admin processes it.
                </p>
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "0.85rem", marginBottom: "1.1rem", textAlign: "left", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#042045" }}>{regModal.code} — {regModal.title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{regModal.schedule} · {regModal.duration}</div>
                  <div style={{ marginTop: 7 }}><span style={S.statusPill("pending")}>{STATUS_STYLES.pending.label}</span></div>
                </div>
                <button style={S.btnPrimary} onClick={() => setRegModal(null)}>Back to Courses</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}
