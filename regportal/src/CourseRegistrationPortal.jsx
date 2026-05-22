import { useState } from "react";
import logo from "./logo.webp";

const COURSES = [
  {
    id: 1,
    title: "Introduction to Data Science",
    category: "Technology",
    duration: "8 weeks",
    schedule: "Mon & Wed, 6–8 PM",
    seats: 12,
    fee: "₹4,999",
    level: "Beginner",
    instructor: "Dr. Priya Mehta",
    desc: "Learn Python, pandas, and visualization fundamentals with real datasets.",
  },
  {
    id: 2,
    title: "UX Design Foundations",
    category: "Design",
    duration: "6 weeks",
    schedule: "Tue & Thu, 5–7 PM",
    seats: 8,
    fee: "₹3,499",
    level: "Beginner",
    instructor: "Rohan Kapoor",
    desc: "From user research to wireframes — master the full design thinking process.",
  },
  {
    id: 3,
    title: "Financial Planning & Investing",
    category: "Finance",
    duration: "4 weeks",
    schedule: "Saturdays, 10 AM–1 PM",
    seats: 20,
    fee: "₹2,499",
    level: "All Levels",
    instructor: "Anjali Sharma, CFA",
    desc: "Build wealth confidently with practical strategies in mutual funds and equity.",
  },
  {
    id: 4,
    title: "Advanced React Development",
    category: "Technology",
    duration: "10 weeks",
    schedule: "Mon/Wed/Fri, 7–9 PM",
    seats: 3,
    fee: "₹7,999",
    level: "Advanced",
    instructor: "Vikram Nair",
    desc: "Deep-dive into hooks, state management, performance and advanced patterns.",
  },
  {
    id: 5,
    title: "Business Communication",
    category: "Soft Skills",
    duration: "3 weeks",
    schedule: "Weekdays, 8–9 AM",
    seats: 15,
    fee: "₹1,799",
    level: "Intermediate",
    instructor: "Meera Pillai",
    desc: "Write sharper emails, lead confident meetings, and present persuasively.",
  },
  {
    id: 6,
    title: "Digital Marketing Mastery",
    category: "Marketing",
    duration: "5 weeks",
    schedule: "Tue & Sat, 6–8 PM",
    seats: 18,
    fee: "₹3,999",
    level: "Intermediate",
    instructor: "Arjun Bose",
    desc: "SEO, paid ads, social media strategy and analytics — all in one course.",
  },
];

const MOCK_USERS = [
  { email: "25B0001@iitb.ac.in", password: "iitb1234", name: "IITIAN Agent" },
];

const categoryColors = {
  Technology: { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
  Design: { bg: "#EEEDFE", text: "#534AB7", dot: "#7F77DD" },
  Finance: { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  "Soft Skills": { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27" },
  Marketing: { bg: "#FAECE7", text: "#993C1D", dot: "#D85A30" },
};

const levelBadge = {
  Beginner: { bg: "#EAF3DE", text: "#3B6D11" },
  Intermediate: { bg: "#FAEEDA", text: "#854F0B" },
  Advanced: { bg: "#FCEBEB", text: "#A32D2D" },
  "All Levels": { bg: "#E6F1FB", text: "#185FA5" },
};

export default function App() {
  const [view, setView] = useState("login"); // login | register | portal | enrolled
  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(MOCK_USERS);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState(null);
  const [authErr, setAuthErr] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [regForm, setRegForm] = useState({ phone: "", org: "", goal: "" });
  const [regStep, setRegStep] = useState(1); // 1 = details, 2 = confirm, 3 = success

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = () => {
    setAuthErr("");
    const found = users.find(
      (u) => u.email === loginForm.email && u.password === loginForm.password
    );
    if (!found) { setAuthErr("Invalid email or password."); return; }
    setUser(found);
    setView("portal");
    showToast(`Welcome back, ${found.name.split(" ")[0]}!`);
  };

  const handleSignup = () => {
    setAuthErr("");
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setAuthErr("Please fill in all fields."); return;
    }
    if (signupForm.password !== signupForm.confirm) {
      setAuthErr("Passwords do not match."); return;
    }
    if (users.find((u) => u.email === signupForm.email)) {
      setAuthErr("An account with this email already exists."); return;
    }
    const newUser = { email: signupForm.email, password: signupForm.password, name: signupForm.name };
    setUsers([...users, newUser]);
    setUser(newUser);
    setView("portal");
    showToast(`Account created! Welcome, ${signupForm.name.split(" ")[0]}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setView("login");
    setEnrolledIds([]);
    setLoginForm({ email: "", password: "" });
  };

  const openRegister = (course) => {
    setSelectedCourse(course);
    setRegForm({ phone: "", org: "", goal: "" });
    setRegStep(1);
    setView("enrolled");
  };

  const submitRegistration = () => {
    setEnrolledIds([...enrolledIds, selectedCourse.id]);
    setRegStep(3);
    showToast(`Registered for "${selectedCourse.title}"!`);
  };

  const categories = ["All", ...new Set(COURSES.map((c) => c.category))];

  const filtered = COURSES.filter((c) => {
    const matchCat = filterCat === "All" || c.category === filterCat;
    const matchQ =
      c.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchQ;
  });

  const initials = user ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "";

  const styles = {
    root: {
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      minHeight: "100vh",
      background: "#042045",
      position: "relative",
    },
    // ─── AUTH ──────────────────────────────────────────────────────────────────
    authWrap: {
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
    },
    authCard: {
      background: "#fff",
      borderRadius: 40,
      padding: "2.5rem 2rem",
      width: "100%",
      maxWidth: 420,
      boxShadow: "0 4px 40px rgba(0, 0, 0, 0.08)",
      border: "1px solid #e8e8f0",
    },
    logo: {
      display: "flex",
      flexDirection:"column",
      alignItems: "center",
      gap: 10,
      marginBottom: "1.75rem",
      textAlign:"centre",
    },
    logoMark: {
      width: 38,
      height: 38,
      borderRadius: 10,
      background: "linear-gradient(135deg, #534AB7, #378ADD)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 18,
      fontWeight: 700,
    },
    logoText: {
      fontSize: 30,
      fontWeight: 700,
      color: "#1a1a2e",
      letterSpacing: "-0.3px",
    },
    logoSub: { fontSize: 11, color: "#888", marginTop: 1 },
    h2: { fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" },
    subtitle: { fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" },
    label: { fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1.5px solid #e5e7eb",
      borderRadius: 10,
      fontSize: 14,
      color: "#111",
      outline: "none",
      boxSizing: "border-box",
      marginBottom: "1rem",
      transition: "border-color 0.2s",
      background: "#fafafa",
    },
    btnPrimary: {
      width: "100%",
      padding: "11px",
      background: "linear-gradient(135deg, #534AB7, #378ADD)",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      marginTop: 4,
      letterSpacing: "0.2px",
    },
    errorBox: {
      background: "#FEE2E2",
      color: "#991B1B",
      padding: "10px 12px",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: "1rem",
    },
    switchLink: { color: "#534AB7", cursor: "pointer", fontWeight: 600, textDecoration: "none" },
    demoHint: {
      background: "#EEF2FF",
      color: "#4338CA",
      padding: "8px 12px",
      borderRadius: 8,
      fontSize: 12,
      marginTop: "1rem",
      textAlign: "center",
    },
    // ─── PORTAL ────────────────────────────────────────────────────────────────
    header: {
      background: "#fff",
      borderBottom: "1px solid #e8e8f0",
      padding: "0 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 60,
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #534AB7, #378ADD)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      fontSize: 13,
    },
    logoutBtn: {
      background: "none",
      border: "1.5px solid #e5e7eb",
      color: "#6b7280",
      padding: "6px 14px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 500,
    },
    main: { padding: "2rem", maxWidth: 1100, margin: "0 auto" },
    heroText: { marginBottom: "2rem" },
    heroH1: { fontSize: 28, fontWeight: 800, color: "#1a1a2e", margin: "0 0 6px", letterSpacing: "-0.5px" },
    heroPara: { fontSize: 15, color: "#6b7280" },
    filterBar: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: "1.5rem",
      alignItems: "center",
    },
    filterChip: (active) => ({
      padding: "6px 14px",
      borderRadius: 20,
      border: `1.5px solid ${active ? "#534AB7" : "#e5e7eb"}`,
      background: active ? "#EEEDFE" : "#fff",
      color: active ? "#534AB7" : "#6b7280",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      transition: "all 0.15s",
    }),
    searchInput: {
      padding: "7px 14px 7px 36px",
      border: "1.5px solid #e5e7eb",
      borderRadius: 20,
      fontSize: 13,
      outline: "none",
      background: "#fff",
      marginLeft: "auto",
      width: 200,
    },
    searchWrap: { position: "relative", display: "flex", alignItems: "center" },
    searchIcon: { position: "absolute", left: 12, color: "#9ca3af", fontSize: 15 },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "1.25rem",
    },
    card: {
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #e8e8f0",
      overflow: "hidden",
      transition: "box-shadow 0.2s, transform 0.2s",
      cursor: "default",
    },
    cardHeader: (cat) => ({
      background: categoryColors[cat]?.bg || "#f3f4f6",
      padding: "1.1rem 1.25rem 0.75rem",
      borderBottom: "1px solid rgba(0,0,0,0.04)",
    }),
    catPill: (cat) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "#fff",
      color: categoryColors[cat]?.text || "#555",
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 20,
      marginBottom: 8,
      letterSpacing: "0.3px",
      textTransform: "uppercase",
    }),
    catDot: (cat) => ({
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: categoryColors[cat]?.dot || "#888",
      display: "inline-block",
    }),
    cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", margin: "0 0 2px", lineHeight: 1.3 },
    cardInstructor: { fontSize: 13, color: "#6b7280" },
    cardBody: { padding: "1rem 1.25rem" },
    cardDesc: { fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: "1rem" },
    metaRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1rem" },
    meta: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12,
      color: "#6b7280",
      background: "#f9fafb",
      padding: "4px 9px",
      borderRadius: 6,
    },
    cardFooter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: "0.75rem",
    },
    fee: { fontSize: 18, fontWeight: 800, color: "#1a1a2e" },
    seats: (n) => ({ fontSize: 12, color: n <= 3 ? "#A32D2D" : "#6b7280" }),
    enrollBtn: (enrolled) => ({
      padding: "8px 18px",
      borderRadius: 9,
      border: "none",
      background: enrolled ? "#EAF3DE" : "linear-gradient(135deg, #534AB7, #378ADD)",
      color: enrolled ? "#3B6D11" : "#fff",
      fontWeight: 600,
      fontSize: 13,
      cursor: enrolled ? "default" : "pointer",
    }),
    levelTag: (level) => ({
      display: "inline-block",
      padding: "3px 9px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      background: levelBadge[level]?.bg || "#f3f4f6",
      color: levelBadge[level]?.text || "#555",
    }),
    // ─── REGISTRATION MODAL OVERLAY ────────────────────────────────────────────
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      padding: "1rem",
    },
    modal: {
      background: "#fff",
      borderRadius: 20,
      padding: "2rem",
      width: "100%",
      maxWidth: 480,
      maxHeight: "90vh",
      overflowY: "auto",
      position: "relative",
    },
    closeBtn: {
      position: "absolute",
      top: 16,
      right: 16,
      background: "#f3f4f6",
      border: "none",
      borderRadius: "50%",
      width: 30,
      height: 30,
      cursor: "pointer",
      fontSize: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    stepDots: { display: "flex", gap: 6, marginBottom: "1.5rem" },
    dot: (active) => ({
      width: active ? 20 : 8,
      height: 8,
      borderRadius: 4,
      background: active ? "#534AB7" : "#e5e7eb",
      transition: "all 0.3s",
    }),
    successCircle: {
      width: 64,
      height: 64,
      background: "#EAF3DE",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 28,
      margin: "0 auto 1rem",
    },
    // ─── TOAST ─────────────────────────────────────────────────────────────────
    toast: (type) => ({
      position: "fixed",
      bottom: 24,
      right: 24,
      background: type === "success" ? "#1a1a2e" : "#A32D2D",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 500,
      zIndex: 9999,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      animation: "slideUp 0.3s ease",
    }),
  };

  // ─── AUTH SCREEN ────────────────────────────────────────────────────────────
  if (view === "login") {
    return (
      <div style={styles.root}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:none; }}`}</style>
        <div style={styles.authWrap}>
          <div style={styles.authCard}>
            {/* Logo */}
            <div style={styles.logo}>
              {/* <div style={styles.logoMark}>A</div> */}
              <img src={logo} alt="IITB Logo" style={{width:100,height:100}} ></img>
              <div>
                <div style={styles.logoText}>IITB COURSE REGISTRATION</div>
                {/* <div style={styles.logoSub}>Public Course Registry</div> */}
              </div>
            </div>

            {/* Toggle */}
            <div style={{ display: "flex", gap: 0, marginBottom: "1.5rem", background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setAuthMode(m); setAuthErr(""); }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: "none",
                    background: authMode === m ? "#fff" : "none",
                    fontWeight: authMode === m ? 700 : 400,
                    color: authMode === m ? "#1a1a2e" : "#6b7280",
                    cursor: "pointer",
                    fontSize: 14,
                    boxShadow: authMode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "login" ? "Student Sign In" : "Admin Sign In"}
                </button>
              ))}
            </div>

            {authErr && <div style={styles.errorBox}>{authErr}</div>}

            {authMode === "login" ? (
              <>
                <label style={styles.label}>Email address</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="eg: 25BXXXX@iitb.ac.in"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button style={styles.btnPrimary} onClick={handleLogin}>Sign In →</button>
                <div style={styles.demoHint}>
                  <strong>Demo:</strong> 25B0001@iitb.ac.in / iitb1234
                </div>
              </>
            ) : (
              <>
                <label style={styles.label}>Full name</label>
                <input style={styles.input} type="text" placeholder="Your full name"
                  value={signupForm.name} onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })} />
                <label style={styles.label}>Email address</label>
                <input style={styles.input} type="email" placeholder="eg: XXXX@iitb.ac.in"
                  value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                <label style={styles.label}>Password</label>
                <input style={styles.input} type="password" placeholder="••••••••"
                  value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                {/* <label style={styles.label}>OTP</label> */}
                {/* <input style={styles.input} type="password" placeholder="" */}
                  {/* value={signupForm.confirm} onChange={(e) => setSignupForm({ ...signupForm, confirm: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()} /> */}
                <button style={styles.btnPrimary} onClick={handleSignup}>Sign In →</button>
              </>
            )}
          </div>
        </div>
        {toast && <div style={styles.toast(toast.type)}>{toast.msg}</div>}
      </div>
    );
  }

  // ─── MAIN PORTAL ────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:none; }}
        .course-card:hover { box-shadow: 0 8px 32px rgba(83,74,183,0.12) !important; transform: translateY(-2px) !important; }
        input:focus { border-color: #534AB7 !important; }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>A</div>
          <div style={{ ...styles.logoText, fontSize: 17 }}>Ascend Learning</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            {enrolledIds.length > 0 && (
              <span style={{ background: "#EEEDFE", color: "#534AB7", padding: "3px 10px", borderRadius: 20, fontWeight: 600, fontSize: 12 }}>
                {enrolledIds.length} enrolled
              </span>
            )}
          </span>
          <div style={styles.avatar}>{initials}</div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{user?.name.split(" ")[0]}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Hero */}
        <div style={styles.heroText}>
          <h1 style={styles.heroH1}>Browse & Register for Courses</h1>
          <p style={styles.heroPara}>
            {filtered.length} course{filtered.length !== 1 ? "s" : ""} available · Enroll instantly, start learning right away
          </p>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          {categories.map((cat) => (
            <button key={cat} style={styles.filterChip(filterCat === cat)} onClick={() => setFilterCat(cat)}>
              {cat}
            </button>
          ))}
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              placeholder="Search courses..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
        </div>

        {/* Course Grid */}
        <div style={styles.grid}>
          {filtered.map((course) => {
            const enrolled = enrolledIds.includes(course.id);
            return (
              <div key={course.id} style={styles.card} className="course-card">
                <div style={styles.cardHeader(course.category)}>
                  <div style={styles.catPill(course.category)}>
                    <span style={styles.catDot(course.category)} />
                    {course.category}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={styles.cardTitle}>{course.title}</div>
                      <div style={styles.cardInstructor}>with {course.instructor}</div>
                    </div>
                    <span style={styles.levelTag(course.level)}>{course.level}</span>
                  </div>
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.cardDesc}>{course.desc}</p>
                  <div style={styles.metaRow}>
                    <span style={styles.meta}>⏱ {course.duration}</span>
                    <span style={styles.meta}>📅 {course.schedule}</span>
                  </div>
                  <div style={styles.cardFooter}>
                    <div>
                      <div style={styles.fee}>{course.fee}</div>
                      <div style={styles.seats(course.seats)}>
                        {course.seats <= 3 ? `⚠️ Only ${course.seats} seats left!` : `${course.seats} seats available`}
                      </div>
                    </div>
                    <button
                      style={styles.enrollBtn(enrolled)}
                      onClick={() => !enrolled && openRegister(course)}
                    >
                      {enrolled ? "✓ Enrolled" : "Register →"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 600, color: "#374151" }}>No courses found</div>
              <div style={{ fontSize: 14 }}>Try a different search or category</div>
            </div>
          )}
        </div>
      </main>

      {/* Registration Modal */}
      {view === "enrolled" && selectedCourse && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setView("portal")}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setView("portal")}>✕</button>

            {/* Steps indicator */}
            <div style={styles.stepDots}>
              {[1, 2, 3].map((s) => <div key={s} style={styles.dot(regStep >= s)} />)}
            </div>

            {regStep === 1 && (
              <>
                <h2 style={{ ...styles.h2, marginBottom: 4 }}>Register for Course</h2>
                <p style={styles.subtitle}>{selectedCourse.title}</p>

                {/* Course summary */}
                <div style={{ background: "#f9fafb", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>Duration</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedCourse.duration}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>Schedule</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedCourse.schedule}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>Course Fee</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#534AB7" }}>{selectedCourse.fee}</span>
                  </div>
                </div>

                <label style={styles.label}>Phone number</label>
                <input style={styles.input} type="tel" placeholder="+91 98765 43210"
                  value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />

                <label style={styles.label}>Organisation / College (optional)</label>
                <input style={styles.input} type="text" placeholder="Where do you work or study?"
                  value={regForm.org} onChange={(e) => setRegForm({ ...regForm, org: e.target.value })} />

                <label style={styles.label}>What's your learning goal?</label>
                <textarea
                  style={{ ...styles.input, resize: "vertical", minHeight: 80 }}
                  placeholder="e.g. Career switch, upskilling, personal interest..."
                  value={regForm.goal}
                  onChange={(e) => setRegForm({ ...regForm, goal: e.target.value })}
                />

                <button
                  style={{ ...styles.btnPrimary, opacity: regForm.phone ? 1 : 0.5 }}
                  onClick={() => regForm.phone && setRegStep(2)}
                >
                  Continue →
                </button>
              </>
            )}

            {regStep === 2 && (
              <>
                <h2 style={styles.h2}>Confirm Registration</h2>
                <p style={styles.subtitle}>Please review your details before submitting.</p>

                {[
                  ["Course", selectedCourse.title],
                  ["Instructor", selectedCourse.instructor],
                  ["Schedule", selectedCourse.schedule],
                  ["Duration", selectedCourse.duration],
                  ["Fee", selectedCourse.fee],
                  ["Name", user?.name],
                  ["Email", user?.email],
                  ["Phone", regForm.phone],
                  ...(regForm.org ? [["Organisation", regForm.org]] : []),
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>{label}</span>
                    <span style={{ fontWeight: 500, color: "#1a1a2e", maxWidth: "55%", textAlign: "right" }}>{val}</span>
                  </div>
                ))}

                <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
                  <button
                    style={{ ...styles.btnPrimary, background: "#f3f4f6", color: "#374151", flex: 1 }}
                    onClick={() => setRegStep(1)}
                  >← Back</button>
                  <button style={{ ...styles.btnPrimary, flex: 2 }} onClick={submitRegistration}>
                    Confirm & Register
                  </button>
                </div>
              </>
            )}

            {regStep === 3 && (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={styles.successCircle}>🎉</div>
                <h2 style={{ ...styles.h2, textAlign: "center" }}>You're registered!</h2>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" }}>
                  A confirmation has been sent to <strong>{user?.email}</strong>. You'll hear from the course coordinator within 24 hours.
                </p>
                <div style={{ background: "#f9fafb", borderRadius: 12, padding: "1rem", marginBottom: "1.5rem", textAlign: "left", border: "1px solid #e5e7eb" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selectedCourse.title}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{selectedCourse.schedule} · {selectedCourse.duration}</div>
                </div>
                <button style={styles.btnPrimary} onClick={() => setView("portal")}>
                  Browse More Courses
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div style={styles.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}
