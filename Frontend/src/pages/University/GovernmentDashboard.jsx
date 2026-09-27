import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GovernmentDashboard() {
  const navigate = useNavigate();

  // Data states
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectModalProposal, setRejectModalProposal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Fetch all proposals
  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch("http://localhost:5000/api/government/proposals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.status === 401 || res.status === 403) {
        setError("Unauthorized access. Government role required.");
        return;
      }

      if (data.success) {
        setProposals(data.proposals || []);
      } else {
        setError(data.message || "Failed to fetch proposals");
      }
    } catch (err) {
      setError("Network error while connecting to government server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Handle Approve
  const handleApprove = async (proposalId) => {
    try {
      setActionLoadingId(proposalId);
      setError("");
      setSuccessMessage("");

      const res = await fetch(
        `http://localhost:5000/api/government/proposals/${proposalId}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "approve",
            reviewComment: "Approved by government official.",
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSuccessMessage("Proposal approved successfully!");
        fetchProposals();
      } else {
        setError(data.message || "Failed to approve proposal");
      }
    } catch (err) {
      setError("Error while sending approval");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    try {
      setActionLoadingId(rejectModalProposal._id);
      setError("");
      setSuccessMessage("");

      const res = await fetch(
        `http://localhost:5000/api/government/proposals/${rejectModalProposal._id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "reject",
            reviewComment: rejectReason.trim(),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSuccessMessage("Proposal rejected with feedback.");
        setRejectModalProposal(null);
        setRejectReason("");
        fetchProposals();
      } else {
        setError(data.message || "Failed to reject proposal");
      }
    } catch (err) {
      setError("Error while rejecting proposal");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Filtered proposals list
  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === "all") return true;
    return p.status === filterStatus;
  });

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Government Review Portal</h1>
          <p style={styles.subheading}>
            Welcome, {user.name || "Officer"} ({user.department || "Admin"})
          </p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      {/* Alerts */}
      {error && <div style={styles.errorAlert}>{error}</div>}
      {successMessage && <div style={styles.successAlert}>{successMessage}</div>}

      {/* Filter Tabs */}
      <div style={styles.tabsRow}>
        {["all", "submitted", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            style={{
              ...styles.tabBtn,
              backgroundColor: filterStatus === tab ? "#0f766e" : "#e5e7eb",
              color: filterStatus === tab ? "#fff" : "#374151",
            }}
          >
            {tab.toUpperCase()} ({proposals.filter((p) => tab === "all" || p.status === tab).length})
          </button>
        ))}
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={styles.loadingBox}>Loading proposals for review...</div>
      ) : filteredProposals.length === 0 ? (
        <div style={styles.emptyBox}>No proposals found for this filter.</div>
      ) : (
        <div style={styles.cardGrid}>
          {filteredProposals.map((item) => {
            const team = item.team || item.teamId;
            const challenge = item.challenge || item.challengeId;
            const isProcessing = actionLoadingId === item._id;

            return (
              <div key={item._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <span style={getStatusBadgeStyle(item.status)}>{item.status}</span>
                </div>

                <div style={styles.metaRow}>
                  <span>🏛️ <strong>Univ:</strong> {team?.universityName || "BIT Mesra"}</span>
                  <span>👥 <strong>Team:</strong> {team?.teamName || "N/A"}</span>
                </div>

                <div style={styles.metaRow}>
                  <span>🎯 <strong>Challenge:</strong> {challenge?.title || "N/A"}</span>
                  <span>📍 <strong>District:</strong> {challenge?.district || "N/A"}</span>
                </div>

                <div style={styles.detailBox}>
                  <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
                    <strong>Budget:</strong> ₹{item.estimatedBudget?.toLocaleString("en-IN") || "0"} |{" "}
                    <strong>Timeline:</strong> {item.estimatedTimelineMonths || "0"} Months
                  </p>
                  <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#4b5563" }}>
                    <strong>Plan Summary:</strong> {item.solutionSummary || item.description || "N/A"}
                  </p>
                  {item.reviewComment && (
                    <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#b91c1c" }}>
                      <strong>Remarks:</strong> {item.reviewComment}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={styles.cardFooter}>
                  {item.status === "submitted" || item.status === "under_review" ? (
                    <>
                      <button
                        onClick={() => handleApprove(item._id)}
                        disabled={isProcessing}
                        style={{ ...styles.btn, backgroundColor: "#16a34a", color: "#fff" }}
                      >
                        {isProcessing ? "Approving..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectModalProposal(item);
                          setRejectReason("");
                        }}
                        disabled={isProcessing}
                        style={{ ...styles.btn, backgroundColor: "#dc2626", color: "#fff" }}
                      >
                        ✕ Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic" }}>
                      Decision finalized ({item.status})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalProposal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: "0 0 10px 0" }}>Reject Proposal</h3>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "14px" }}>
              Provide constructive feedback/remarks explaining why this proposal is rejected:
            </p>
            <form onSubmit={handleRejectSubmit}>
              <textarea
                rows="4"
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Budget is too high, please provide itemized breakdown."
                style={styles.textarea}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setRejectModalProposal(null)}
                  style={{ ...styles.btn, backgroundColor: "#9ca3af", color: "#fff" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectModalProposal._id}
                  style={{ ...styles.btn, backgroundColor: "#dc2626", color: "#fff" }}
                >
                  {actionLoadingId === rejectModalProposal._id ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function getStatusBadgeStyle(status) {
  const base = {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
  };
  if (status === "approved") return { ...base, backgroundColor: "#dcfce7", color: "#15803d" };
  if (status === "rejected") return { ...base, backgroundColor: "#fee2e2", color: "#b91c1c" };
  return { ...base, backgroundColor: "#fef3c7", color: "#b45309" };
}

// Inline Styles
const styles = {
  container: {
    padding: "24px 32px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
  },
  heading: { margin: 0, fontSize: "24px", color: "#0f172a" },
  subheading: { margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" },
  logoutBtn: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  tabsRow: { display: "flex", gap: "10px", marginBottom: "20px" },
  tabBtn: {
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
  },
  errorAlert: {
    padding: "12px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "6px",
    marginBottom: "16px",
  },
  successAlert: {
    padding: "12px",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    borderRadius: "6px",
    marginBottom: "16px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  cardTitle: { margin: 0, fontSize: "16px", color: "#1e293b", fontWeight: "600" },
  metaRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "6px" },
  detailBox: {
    backgroundColor: "#f1f5f9",
    padding: "12px",
    borderRadius: "6px",
    margin: "12px 0",
  },
  cardFooter: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: "8px",
  },
  btn: {
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "13px",
  },
  loadingBox: { padding: "40px", textAlign: "center", color: "#64748b" },
  emptyBox: { padding: "40px", textAlign: "center", color: "#94a3b8", backgroundColor: "#fff", borderRadius: "8px" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "460px",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
  },
};
