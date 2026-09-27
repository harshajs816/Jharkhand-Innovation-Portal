import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function UniversityLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      // authAPI.login returns response.data directly (already unwrapped by api.js)
      // AuthContext.login() wraps it and sets the user in state
      const response = await login({ email, password });

      // AuthContext.login() now returns { user, accessToken } directly
      const loggedInUser = response?.user;

      if (!loggedInUser) {
        throw new Error("User data not received from server.");
      }

      const role = loggedInUser.role?.toLowerCase();

      if (role !== "university") {
        setError("This portal is for university accounts only.");
        return;
      }

      navigate("/university/dashboard", { replace: true });
    } catch (err) {
      // Axios wraps HTTP errors — the server message lives in err.response.data.message
      const serverMessage =
        err?.response?.data?.message ||   // axios HTTP error
        err?.message ||                    // thrown Error
        "Login failed. Please try again.";

      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>University Portal</h1>
        <p style={styles.subtitle}>
          Sign in to manage challenges, teams and proposals.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="anjali@bitmesra.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "#64748b" }}>
          Don&apos;t have an account?{" "}
          <Link to="/university/register" style={{ color: "#0f766e", fontWeight: "600" }}>
            Register here
          </Link>
        </p>

        <p style={styles.note}>Test: ietkhandari@gmail.com / university@123</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f7f5",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "35px",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
  },
  title: {
    margin: "0 0 10px",
    color: "#14532d",
    fontSize: "28px",
  },
  subtitle: {
    margin: "0 0 25px",
    color: "#64748b",
    lineHeight: "1.5",
  },
  field: { marginBottom: "18px" },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
  },
  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    background: "#166534",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    color: "#b91c1c",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "18px",
    fontSize: "14px",
  },
  note: {
    marginTop: "20px",
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center",
  },
};

export default UniversityLogin;
