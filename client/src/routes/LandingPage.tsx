
import { useState } from "react";
import type { FormEvent } from "react";
import "../styles/landing.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

interface SignupForm {
  name: string;
  email: string;
  password: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface AuthResponse {
  message: string;
  user: {
    id: number;
    homeId:number;
    name: string;
    email: string;
    createdAt?: string;
  };
  homeId:string;
  token: string;
}

export function LandingPage() {
  // Separate modal states
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Signup form state
  const [signupForm, setSignupForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
  });

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  // Separate loading and error states
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [loginError, setLoginError] = useState("");

  function openSignup() {
    setSignupError("");
    setSignupForm({ name: "", email: "", password: "" });
    setSignupOpen(true);
    setLoginOpen(false);
  }

  function openLogin() {
    setLoginError("");
    setLoginForm({ email: "", password: "" });
    setLoginOpen(true);
    setSignupOpen(false);
  }

  function closeSignup() {
    if (!signupLoading) setSignupOpen(false);
  }

  function closeLogin() {
    if (!loginLoading) setLoginOpen(false);
  }

  async function saveSession(result: AuthResponse) {
    sessionStorage.setItem("authToken", result.token);
    sessionStorage.setItem("user", JSON.stringify(result.user));

    window.location.assign(`/homes/${result.homeId}`);
  }

  // Signup API
  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (signupLoading) return;

    setSignupLoading(true);
    setSignupError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupForm.name.trim(),
          email: signupForm.email.trim(),
          password: signupForm.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create account.");
      }

      await saveSession(result as AuthResponse);
    } catch (error) {
      setSignupError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSignupLoading(false);
    }
  }

  // Login API
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loginLoading) return;

    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to login.");
      }

      await saveSession(result as AuthResponse);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <a href="/" className="brand">
          <span className="brand-icon">S</span>
          <span>
            Splitwise<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <button className="nav-login" onClick={openLogin}>
            Log in
          </button>

          <button className="nav-signup" onClick={openSignup}>
            Get started <span>↗</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-label">
            <span className="live-dot" />
            SIMPLER SHARED LIVING
          </div>

          <h1>
            Shared expenses.
            <br />
            <span>Zero awkwardness.</span>
          </h1>

          <p className="hero-description">
            Split household bills effortlessly. Keep track of everyone's
            share, know what's paid, and make shared living a little less
            complicated.
          </p>

          <div className="hero-actions">
            <button className="hero-primary" onClick={openSignup}>
              Create your free home <span>→</span>
            </button>

            <a href="#how-it-works" className="hero-secondary">
              See how it works
            </a>
          </div>

          <div className="hero-trust">
            <div className="avatar-stack">
              <span>A</span>
              <span>R</span>
              <span>P</span>
              <span>J</span>
            </div>
            <p>Made for roommates and shared homes</p>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="hero-visual">
          <div className="visual-glow" />

          <div className="preview-card">
            <div className="preview-top">
              <div>
                <p className="preview-eyebrow">YOUR HOUSEHOLD</p>
                <h3>Maple Residence</h3>
              </div>
              <span className="preview-menu">•••</span>
            </div>

            <div className="preview-balance">
              <div>
                <p>Total household expenses</p>
                <h2>$1,240.00</h2>
              </div>
              <div className="balance-icon">$</div>
            </div>

            <div className="preview-stats">
              <div>
                <span className="stat-dot paid-dot" />
                <p>Paid</p>
                <strong>$840.00</strong>
              </div>
              <div>
                <span className="stat-dot pending-dot" />
                <p>Outstanding</p>
                <strong>$400.00</strong>
              </div>
            </div>

            <div className="preview-progress">
              <div style={{ width: "67%" }} />
            </div>

            <p className="preview-progress-label">
              67% of household expenses settled
            </p>

            <div className="preview-divider" />

            <div className="preview-bill-heading">
              <h4>Recent bills</h4>
              <span>View all</span>
            </div>

            <div className="preview-bill">
              <div className="bill-icon electricity-icon">ϟ</div>
              <div className="preview-bill-info">
                <strong>Electricity</strong>
                <span>3 members · Nov 18</span>
              </div>
              <div className="preview-bill-amount">
                <strong>$120.00</strong>
                <span className="preview-paid">Settled</span>
              </div>
            </div>

            <div className="preview-bill">
              <div className="bill-icon internet-icon">⌁</div>
              <div className="preview-bill-info">
                <strong>Internet</strong>
                <span>3 members · Nov 19</span>
              </div>
              <div className="preview-bill-amount">
                <strong>$60.00</strong>
                <span className="preview-pending">Pending</span>
              </div>
            </div>
          </div>

          <div className="floating-card">
            <span className="floating-check">✓</span>
            <div>
              <strong>Payment settled!</strong>
              <p>Everyone is up to date.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="section-intro">
          <span className="section-label">WHY SPLIT?</span>
          <h2>Shared living, without the math.</h2>
          <p>
            Everything you need to manage household expenses,
            without the endless calculations and reminders.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon green-feature">÷</div>
            <h3>Fair bill splitting</h3>
            <p>
              Automatically divide bills among everyone in your home.
              Every cent is accounted for.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon blue-feature">✓</div>
            <h3>Clear payment tracking</h3>
            <p>
              Know exactly who has paid and who still has an outstanding
              share.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon purple-feature">⌂</div>
            <h3>One shared home</h3>
            <p>
              Keep household members and bills organized in one simple
              place.
            </p>
          </article>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how-it-works">
        <div className="section-intro">
          <span className="section-label">GET STARTED</span>
          <h2>Three steps. That's it.</h2>
          <p>
            Getting your household organized has never been easier.
          </p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Create your home</h3>
            <p>Set up a shared home and add your roommates.</p>
          </article>

          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Add a bill</h3>
            <p>
              Enter the bill amount and let us calculate everyone's share.
            </p>
          </article>

          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Settle your share</h3>
            <p>
              Each member pays their own share and tracks its status.
            </p>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="about">
        <div>
          <span className="section-label">LESS MATH. MORE LIVING.</span>
          <h2>Make shared expenses simple.</h2>
          <p>Bring your household together. Start splitting smarter.</p>
        </div>

        <button className="cta-button" onClick={openSignup}>
          Get started for free <span>→</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <a href="/" className="brand">
          <span className="brand-icon">S</span>
          <span>
            Splitwise<span className="brand-dot">.</span>
          </span>
        </a>

        <p>Making shared living simpler, one bill at a time.</p>
        <span>© 2026 Splitwise. All rights reserved.</span>
      </footer>

      {/* ================= SIGNUP MODAL ================= */}
      {signupOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSignup();
          }}
        >
          <div
            className="signup-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeSignup}
              disabled={signupLoading}
              aria-label="Close signup"
            >
              ×
            </button>

            <div className="modal-brand">
              <span className="brand-icon">S</span>
            </div>

            <span className="section-label">GET STARTED FOR FREE</span>
            <h2 id="signup-title">Create your account</h2>

            <p className="modal-description">
              Start managing your shared household expenses.
            </p>

            <form onSubmit={handleSignup}>
              <label htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
                value={signupForm.name}
                onChange={(event) =>
                  setSignupForm({
                    ...signupForm,
                    name: event.target.value,
                  })
                }
              />

              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={255}
                required
                value={signupForm.email}
                onChange={(event) =>
                  setSignupForm({
                    ...signupForm,
                    email: event.target.value,
                  })
                }
              />

              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm({
                    ...signupForm,
                    password: event.target.value,
                  })
                }
              />

              {signupError && (
                <p className="auth-error" role="alert">
                  {signupError}
                </p>
              )}

              <button
                type="submit"
                className="modal-submit"
                disabled={signupLoading}
              >
                {signupLoading ? "Creating account..." : "Create account →"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?
              <button type="button" onClick={openLogin}>
                Log in
              </button>
            </p>

            <p className="modal-terms">
              By signing up, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {/* ================= LOGIN MODAL ================= */}
      {loginOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLogin();
          }}
        >
          <div
            className="signup-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeLogin}
              disabled={loginLoading}
              aria-label="Close login"
            >
              ×
            </button>

            <div className="modal-brand">
              <span className="brand-icon">S</span>
            </div>

            <span className="section-label">WELCOME BACK</span>
            <h2 id="login-title">Log in to your account</h2>

            <p className="modal-description">
              Welcome back! Enter your details to continue.
            </p>

            <form onSubmit={handleLogin}>
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm({
                    ...loginForm,
                    email: event.target.value,
                  })
                }
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({
                    ...loginForm,
                    password: event.target.value,
                  })
                }
              />

              {loginError && (
                <p className="auth-error" role="alert">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="modal-submit"
                disabled={loginLoading}
              >
                {loginLoading ? "Logging in..." : "Log in →"}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?
              <button type="button" onClick={openSignup}>
                Sign up
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
