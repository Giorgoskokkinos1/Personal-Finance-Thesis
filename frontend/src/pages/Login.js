// src/pages/Login.js
import React, { useState } from "react";

const getPasswordStrength = (password) => {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMinLength = password.length >= 6;
  const isCommonCode = /^(1234|0000|1111|2222|3333|4444|5555|6666|7777|8888|9999|123456|password)$/i.test(
    password
  );

  const score = [hasLetter, hasNumber, hasMinLength, !isCommonCode].filter(
    Boolean
  ).length;

  if (!password) {
    return {
      label: "Empty",
      className: "empty",
      score: 0,
      isStrong: false,
      hasLetter,
      hasNumber,
      hasMinLength,
      isCommonCode,
    };
  }

  if (score >= 4) {
    return {
      label: "Strong",
      className: "strong",
      score,
      isStrong: true,
      hasLetter,
      hasNumber,
      hasMinLength,
      isCommonCode,
    };
  }

  if (hasLetter && hasNumber) {
    return {
      label: "Medium",
      className: "medium",
      score,
      isStrong: false,
      hasLetter,
      hasNumber,
      hasMinLength,
      isCommonCode,
    };
  }

  return {
    label: "Weak",
    className: "weak",
    score,
    isStrong: false,
    hasLetter,
    hasNumber,
    hasMinLength,
    isCommonCode,
  };
};

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    remember: true,
    terms: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const passwordStrength = getPasswordStrength(form.password);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (isForgot) {
      setMessage(
        "If this email exists, password reset instructions will be prepared."
      );
      return;
    }

    if (isSignup && form.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (form.password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (isSignup && !passwordStrength.isStrong) {
      setError("Please use a stronger password with letters and numbers.");
      return;
    }

    if (isSignup && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isSignup && !form.terms) {
      setError("Please accept the local demo terms.");
      return;
    }

    onLogin({
      email: form.email.trim(),
      name: isSignup ? form.name.trim() : undefined,
      remember: form.remember,
    });
  };

  return (
    <main className="login-shell">
      <section className="login-showcase">
        <div className="login-brand-lockup">
          <div className="login-brand-mark">
            <span>FT</span>
          </div>
          <div>
            <p className="section-kicker mb-2">Finance Tracker</p>
            <strong>Personal finance workspace</strong>
          </div>
        </div>

        <h1>Control your money with calm precision.</h1>
        <p>
          Track transactions, budgets, targets, and spending signals from one
          focused workspace built for everyday financial decisions.
        </p>

        <div className="login-signal-grid">
          <div>
            <span>Cashflow</span>
            <strong>Live</strong>
          </div>
          <div>
            <span>Budgets</span>
            <strong>Monthly</strong>
          </div>
          <div>
            <span>Targets</span>
            <strong>Active</strong>
          </div>
        </div>
      </section>

      <section className="login-card" aria-label="Account access">
        <div className="login-card-header">
          <div className="login-card-logo">
            <div className="login-brand-mark login-brand-mark-sm">
              <span>FT</span>
            </div>
            <p className="section-kicker mb-0">
              {isForgot
                ? "Account recovery"
                : isSignup
                ? "Create access"
                : "Secure access"}
            </p>
          </div>

          <div className="login-mode-tabs" aria-label="Account mode">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
            >
              Sign up
            </button>
          </div>

          <h2>
            {isForgot
              ? "Reset password"
              : isSignup
              ? "Create your account"
              : "Welcome back"}
          </h2>
          <p>
            {isForgot
              ? "Enter your email and we will prepare reset instructions."
              : isSignup
              ? "Set up local demo access and enter your finance workspace."
              : "Sign in to open your finance workspace."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control login-input"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control login-input"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          {!isForgot && (
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="login-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control login-input"
                  name="password"
                  placeholder={isSignup ? "Create password" : "Enter password"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {isSignup && (
                <div className="password-strength-panel">
                  <div className="password-strength-header">
                    <span>Password strength</span>
                    <strong className={`strength-${passwordStrength.className}`}>
                      {passwordStrength.label}
                    </strong>
                  </div>
                  <div className="password-strength-bar" aria-hidden="true">
                    <span
                      className={`strength-${passwordStrength.className}`}
                      style={{
                        width: `${Math.max(passwordStrength.score, 1) * 25}%`,
                      }}
                    ></span>
                  </div>
                  <ul>
                    <li className={passwordStrength.hasLetter ? "met" : ""}>
                      Include letters
                    </li>
                    <li className={passwordStrength.hasNumber ? "met" : ""}>
                      Include numbers
                    </li>
                    <li className={passwordStrength.hasMinLength ? "met" : ""}>
                      Use at least 6 characters
                    </li>
                    <li className={!passwordStrength.isCommonCode ? "met" : ""}>
                      Avoid common codes like 1234
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {isSignup && (
            <div className="mb-3">
              <label className="form-label">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control login-input"
                name="confirmPassword"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {!isForgot && (
            <div className="login-options mb-4">
              <label className="login-check">
                <input
                  type="checkbox"
                  name={isSignup ? "terms" : "remember"}
                  checked={isSignup ? form.terms : form.remember}
                  onChange={handleChange}
                />
                {isSignup ? "Accept local demo access" : "Remember me"}
              </label>

              {!isSignup && (
                <button
                  type="button"
                  className="login-link-button"
                  onClick={() => switchMode("forgot")}
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <button type="submit" className="btn btn-primary login-submit">
            {isForgot
              ? "Send reset instructions"
              : isSignup
              ? "Create account"
              : "Sign in"}
          </button>

          {isForgot && (
            <button
              type="button"
              className="btn btn-outline-secondary login-secondary-action"
              onClick={() => switchMode("login")}
            >
              Back to login
            </button>
          )}
        </form>

        <div className="login-footnote">
          Local demo access. Real user authentication can be added next.
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
