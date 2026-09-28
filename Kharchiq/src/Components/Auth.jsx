// src/Components/Auth.jsx
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Wallet } from "lucide-react";
import { auth } from "../firebase";

function Auth({ onNameSaved }) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please log in.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your internet connection.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (isSignup && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

        await updateProfile(credential.user, { displayName: name.trim() });
        onNameSaved(name.trim());
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(getErrorMessage(err.code));
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");

    if (!email.trim()) {
      setError("Enter your email above first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset link sent. Check your email.");
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>

          <div>
            <h2>Kharchiq</h2>
            <span>Spend Smart. Live Better.</span>
          </div>
        </div>

        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-subtitle">
          {isSignup
            ? "Sign up to start tracking your expenses."
            : "Log in to continue to your dashboard."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {!isSignup && (
            <button
              type="button"
              className="auth-link forgot"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to Kharchiq?"}{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setInfo("");
            }}
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;