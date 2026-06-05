"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ["firstName", "lastName", "username", "email", "password"];
    for (const field of required) {
      if (!form[field].trim()) {
        setError(`Please fill in all required fields.`);
        return;
      }
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, form);
      router.push("/login?registered=1");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span className="auth-title">NexChat</span>
        </div>

        <p className="auth-subtitle">Create your account to get started.</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-row" style={{ animationDelay: "0.1s" }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">First Name *</label>
              <input
                className="input-field"
                name="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Last Name *</label>
              <input
                className="input-field"
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group" style={{ animationDelay: "0.12s", marginTop: "16px" }}>
            <label className="input-label">Username *</label>
            <input
              className="input-field"
              name="username"
              placeholder="@johndoe"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className="input-group" style={{ animationDelay: "0.14s" }}>
            <label className="input-label">Email Address *</label>
            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group" style={{ animationDelay: "0.16s" }}>
            <label className="input-label">Password *</label>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "var(--text-muted)",
                  padding: 0,
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="input-group" style={{ animationDelay: "0.18s" }}>
            <label className="input-label">Phone (optional)</label>
            <input
              className="input-field"
              name="phone"
              placeholder="+91 XXXXX XXXXX"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ animationDelay: "0.2s" }}
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
