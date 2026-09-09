"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";
import { isSupabaseConfigured } from "../../lib/supabase/config";

// Demonstrates the future role-based sign-in entry point with local demo routing.
export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"seller" | "admin">("seller");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [nextPath, setNextPath] = useState("");
  const [busy, setBusy] = useState(false);

  // Reads optional redirect information in the browser without blocking static prerendering.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMessage(params.get("error") || "");
    setNextPath(params.get("next") || "");
  }, []);

  // Authenticates a real Supabase user when configured and otherwise keeps demo routing available.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (!isSupabaseConfigured()) {
      router.push(role === "admin" ? "/admin" : "/seller");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const result = mode === "sign-up"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role: "seller" } } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setBusy(false);
      return;
    }

    if (mode === "sign-up") {
      setMessage("Account created. Check your email if confirmation is enabled, then sign in.");
      setMode("sign-in");
      setBusy(false);
      return;
    }

    router.push(nextPath || (role === "admin" ? "/admin" : "/seller"));
  }

  return <main className="auth-shell"><Link className="brand auth-brand" href="/"><span className="brand-mark">F</span><span>find<span>jos</span></span></Link><section className="auth-card"><p className="eyebrow accent">{mode === "sign-up" ? "JOIN FINDJOS" : "WELCOME BACK"}</p><h1>{mode === "sign-up" ? <>Put your business <em>on the map.</em></> : <>Sign in to <em>FindJos.</em></>}</h1><p className="auth-copy">{mode === "sign-up" ? "Create a seller account and start managing your local presence." : "Manage your local presence or keep the directory useful for Jos."}</p><div className="role-switch" role="tablist" aria-label="Choose account type"><button className={role === "seller" ? "active" : ""} onClick={() => { setRole("seller"); setMode("sign-in"); }}>Business owner</button><button className={role === "admin" ? "active" : ""} onClick={() => { setRole("admin"); setMode("sign-in"); }}>Administrator</button></div>{message && <p className="auth-message">{message}</p>}<form onSubmit={handleSubmit}>{mode === "sign-up" && <label>Your name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" required /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={role === "admin" ? "admin@findjos.com" : "you@business.com"} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required /></label><button className="auth-submit" disabled={busy}>{busy ? "Please wait..." : `${mode === "sign-up" ? "Create seller account" : `Continue as ${role === "admin" ? "administrator" : "seller"}`} →`}</button></form>{role === "seller" && <p className="auth-foot">{mode === "sign-in" ? <>New to FindJos? <button onClick={() => setMode("sign-up")}>Create a seller account</button></> : <>Already registered? <button onClick={() => setMode("sign-in")}>Sign in</button></>}</p>}{role === "admin" && <p className="auth-foot">Administrator access is provisioned by the platform owner.</p>}<p className="auth-demo-note">{isSupabaseConfigured() ? "Secure authentication provided by Supabase." : "Demo mode: add Supabase keys to enable real authentication."}</p></section><p className="auth-back"><Link href="/">← Continue browsing without an account</Link></p></main>;
}
