import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Tag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw 
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";
const UNI_API      = "http://localhost:5000/api/university";

export default function AssignedChallenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'assigned' | 'accepted' | 'rejected'

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/university/login");
        return;
      }

      const res = await fetch(`${UNI_API}/challenges/assigned`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/university/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch challenges");
      }

      setChallenges(data.challenges || []);
    } catch (err) {
      setError(err.message || "Something went wrong fetching challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const respondToChallenge = async (challengeId, action, rejectionReason = "") => {
    if (action === "reject" && !rejectionReason.trim()) {
      setActionMessage("Please enter a reason before rejecting.");
      return;
    }

    try {
      setActionLoadingId(challengeId);
      setActionMessage("");
      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${UNI_API}/challenges/${challengeId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update challenge");
      }

      // Close modal & reset
      setSelectedChallenge(null);
      setRejectReason("");
      // Refresh list
      fetchChallenges();
    } catch (err) {
      setActionMessage(err.message || "Operation failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate("/university/dashboard")}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <h1 style={styles.title}>Assigned Challenges</h1>
          <p style={styles.subtitle}>
            Review societal problems submitted by citizens and government bodies assigned to your university.
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchChallenges} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabsRow}>
        {[
          { key: "all", label: `All (${challenges.length})` },
          { key: "assigned", label: `Pending Action (${challenges.filter(c => c.status === "assigned").length})` },
          { key: "accepted", label: `Accepted (${challenges.filter(c => c.status === "accepted").length})` },
          { key: "rejected", label: `Rejected (${challenges.filter(c => c.status === "rejected").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              ...styles.tabBtn,
              ...(filter === tab.key ? styles.tabBtnActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error / Feedback Banner */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Challenges List / Grid */}
      {loading ? (
        <div style={styles.loadingBox}>Loading assigned challenges...</div>
      ) : filteredChallenges.length === 0 ? (
        <div style={styles.emptyBox}>
          No challenges found in the "{filter}" category.
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredChallenges.map((challenge) => (
            <div key={challenge._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.badgeGroup}>
                  <span style={styles.categoryBadge}>{challenge.category || "Societal"}</span>
                  <span style={{
                    ...styles.priorityBadge,
                    background: challenge.priority === "high" ? "#fee2e2" : "#fef3c7",
                    color: challenge.priority === "high" ? "#dc2626" : "#b45309",
                  }}>
                    {challenge.priority || "Medium"} Priority
                  </span>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  ...(challenge.status === "accepted" ? styles.statusAccepted : {}),
                  ...(challenge.status === "rejected" ? styles.statusRejected : {}),
                }}>
                  {challenge.status}
                </span>
              </div>

              <h2 style={styles.cardTitle}>{challenge.title}</h2>
              <p style={styles.cardDesc}>{challenge.description}</p>

              <div style={styles.metaRow}>
                <span style={styles.metaItem}>
                  <MapPin size={14} /> {challenge.district || "Jharkhand"}
                </span>
                <span style={styles.metaItem}>
                  <Calendar size={14} /> {challenge.deadline ? new Date(challenge.deadline).toLocaleDateString() : "Ongoing"}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={styles.cardActions}>
                {challenge.status === "assigned" && (
                  <>
                    <button
                      style={styles.acceptBtn}
                      disabled={actionLoadingId === challenge._id}
                      onClick={() => respondToChallenge(challenge._id, "accept")}
                    >
                      {actionLoadingId === challenge._id ? "Accepting..." : "Accept Challenge"}
                    </button>
                    <button
                      style={styles.rejectBtn}
                      disabled={actionLoadingId === challenge._id}
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setRejectReason("");
                        setActionMessage("");
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}

                {challenge.status === "accepted" && (
                  <div style={styles.acceptedBanner}>
                    <CheckCircle size={16} /> Challenge Accepted — Form team in Dashboard
                  </div>
                )}

                {challenge.status === "rejected" && (
                  <div style={styles.rejectedBanner}>
                    <XCircle size={16} /> Rejected: {challenge.rejectionReason || "No reason specified"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {selectedChallenge && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Reject Challenge</h3>
            <p style={styles.modalSubtitle}>
              Please explain why BIT Mesra cannot undertake <strong>"{selectedChallenge.title}"</strong>:
            </p>

            {actionMessage && <div style={styles.errorBox}>{actionMessage}</div>}

            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Lack of specialized lab equipment / outside research focus..."
              style={styles.textarea}
            />

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setSelectedChallenge(null)}
              >
                Cancel
              </button>
              <button
                style={styles.confirmRejectBtn}
                disabled={actionLoadingId === selectedChallenge._id}
                onClick={() => respondToChallenge(selectedChallenge._id, "reject", rejectReason)}
              >
                {actionLoadingId === selectedChallenge._id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "32px 40px",
    background: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: "8px" },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    color: "#0d9488",
    fontWeight: "600",
    fontSize: "0.88rem",
    cursor: "pointer",
    padding: "0",
    marginBottom: "8px",
  },
  title: { fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: 0 },
  subtitle: { fontSize: "0.95rem", color: "#64748b", margin: 0 },
  refreshBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    color: "#334155",
  },
  tabsRow: {
    display: "flex",
    gap: "8px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px",
    marginBottom: "24px",
  },
  tabBtn: {
    background: "none",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "0.88rem",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#0d9488",
    color: "#ffffff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  badgeGroup: { display: "flex", gap: "6px" },
  categoryBadge: {
    background: "#f0fdfa",
    color: "#0d9488",
    fontSize: "0.75rem",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  priorityBadge: {
    fontSize: "0.75rem",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  statusBadge: {
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "0.75rem",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "20px",
    textTransform: "uppercase",
  },
  statusAccepted: { background: "#ecfdf5", color: "#059669" },
  statusRejected: { background: "#fef2f2", color: "#dc2626" },
  cardTitle: { fontSize: "1.05rem", fontWeight: "700", color: "#1e293b", margin: "0 0 10px 0" },
  cardDesc: { fontSize: "0.88rem", color: "#64748b", lineHeight: "1.5", margin: "0 0 16px 0" },
  metaRow: {
    display: "flex",
    gap: "16px",
    fontSize: "0.82rem",
    color: "#64748b",
    paddingTop: "14px",
    borderTop: "1px dashed #e2e8f0",
    marginBottom: "18px",
  },
  metaItem: { display: "flex", alignItems: "center", gap: "6px" },
  cardActions: { display: "flex", gap: "10px" },
  acceptBtn: {
    flex: 1,
    background: "#0d9488",
    color: "#ffffff",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  rejectBtn: {
    flex: 1,
    background: "#ffffff",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  acceptedBanner: {
    width: "100%",
    padding: "10px",
    background: "#ecfdf5",
    color: "#059669",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  rejectedBanner: {
    width: "100%",
    padding: "10px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  loadingBox: { padding: "40px", textAlign: "center", color: "#64748b", fontSize: "1rem" },
  emptyBox: { padding: "40px", textAlign: "center", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" },
  errorBox: { padding: "12px", background: "#fee2e2", color: "#dc2626", borderRadius: "8px", marginBottom: "16px", fontSize: "0.88rem" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalCard: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    width: "100%",
    maxWidth: "460px",
  },
  modalTitle: { fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  modalSubtitle: { fontSize: "0.88rem", color: "#64748b", margin: "0 0 16px 0" },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    padding: "10px",
    fontSize: "0.9rem",
    marginBottom: "16px",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px" },
  cancelBtn: {
    background: "#f1f5f9",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  confirmRejectBtn: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
