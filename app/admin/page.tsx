"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { businesses, categories, type Business } from "../data";
import { isSupabaseConfigured } from "../../lib/supabase/config";

type ListingState = Business & { status: "Published" | "Draft" | "Needs review" | "Hidden" };

const initialListings: ListingState[] = businesses.map((business, index) => ({
  ...business,
  status: index === 4 ? "Needs review" : "Published",
}));

// Converts a business record into the compact row model used by the admin table.
function listingStatus(status: ListingState["status"]) {
  return status.toLowerCase().replace(" ", "-");
}

export default function AdminPage() {
  const [listings, setListings] = useState(initialListings);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All listings");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("Welcome back, administrator.");

  // Loads the administrator's complete listing queue when Supabase is active.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetch("/api/admin/listings")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load listings.")))
      .then((payload: { listings?: ListingState[] }) => setListings(payload.listings || []))
      .catch((error: Error) => setNotice(error.message));
  }, []);

  // Filters rows on the client for the demo; this will become a server query later.
  const filteredListings = useMemo(() => listings.filter((listing) => {
    const matchesQuery = [listing.name, listing.category, listing.area].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All listings" || listing.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [listings, query, statusFilter]);

  // Changes publication state without mutating the original listing object.
  async function updateStatus(id: string, status: ListingState["status"]) {
    setListings((current) => current.map((listing) => listing.id === id ? { ...listing, status } : listing));
    if (isSupabaseConfigured()) {
      const databaseStatus = status === "Needs review" ? "draft" : status.toLowerCase();
      const response = await fetch("/api/admin/listings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: databaseStatus }) });
      if (!response.ok) { setNotice("Could not save that listing status."); return; }
    }
    setNotice(`Listing ${status.toLowerCase()}.`);
  }

  // Adds a safe dummy listing so the admin workflow is demonstrable before Supabase.
  async function createListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "New Terminus business");
    const category = String(form.get("category") || "Services");
    const newListing: ListingState = {
      id: `listing-${Date.now()}`, name, category, description: String(form.get("description") || "A new local business in Terminus."), area: "Terminus", hours: "Hours to confirm", rating: "New", tags: [category.toLowerCase()], accent: "green", status: "Draft",
    };
    if (isSupabaseConfigured()) {
      const response = await fetch("/api/admin/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newListing) });
      if (!response.ok) { setNotice("Could not create listing."); return; }
      const payload = await response.json() as { listing: ListingState };
      setListings((current) => [payload.listing, ...current]);
    } else {
      setListings((current) => [newListing, ...current]);
    }
    setShowCreate(false);
    setNotice(`${name} saved as a draft.`);
  }

  // Persists verification changes and immediately reflects them in the table.
  async function toggleVerified(id: string, verified: boolean) {
    setListings((current) => current.map((item) => item.id === id ? { ...item, verified } : item));
    if (isSupabaseConfigured()) {
      const response = await fetch("/api/admin/listings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, verified }) });
      if (!response.ok) { setNotice("Could not save verification status."); return; }
    }
    setNotice(verified ? "Listing verified." : "Verification removed.");
  }

  const selectedListing = listings.find((listing) => listing.id === selectedId);

  return <main className="dashboard-shell">
    <aside className="dashboard-rail">
      <Link className="brand dashboard-brand" href="/"><span className="brand-mark">F</span><span>find<span>jos</span></span></Link>
      <p className="dashboard-label">ADMIN CONSOLE</p>
      <nav className="dashboard-nav"><Link className="dashboard-nav-link active" href="/admin"><span>▦</span> Overview</Link><Link className="dashboard-nav-link" href="/admin"><span>◈</span> Listings <b>{listings.length}</b></Link><Link className="dashboard-nav-link" href="/admin"><span>♧</span> Claims <b>3</b></Link><Link className="dashboard-nav-link" href="/admin"><span>⚑</span> Reports <b>2</b></Link><Link className="dashboard-nav-link" href="/admin"><span>⚙</span> Settings</Link></nav>
      <div className="dashboard-rail-bottom"><div className="admin-identity"><span className="admin-avatar">JD</span><div><strong>Admin account</strong><small>Owner access</small></div><span>•••</span></div><Link className="back-to-site" href="/">← Back to FindJos</Link></div>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-header"><div><p className="eyebrow accent">WEDNESDAY, SEPTEMBER 09</p><h1>Good morning, <em>admin.</em></h1><p className="dashboard-subtitle">Here is what is happening across FindJos today.</p></div><div className="dashboard-header-actions"><button className="notification-button">♧<b>2</b></button><Link className="dashboard-profile" href="/">JD</Link></div></header>
      <p className="dashboard-notice">{notice}</p>
      <div className="stat-grid"><StatCard label="Total listings" value={String(listings.length)} delta="+6 this week" icon="◈" /><StatCard label="Published" value={String(listings.filter((item) => item.status === "Published").length)} delta="Ready to discover" icon="✓" /><StatCard label="Needs attention" value={String(listings.filter((item) => item.status === "Needs review").length)} delta="Review queue" icon="!" warning /></div>
      <section className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">DIRECTORY CONTROL</p><h2>Business listings</h2></div><button className="primary-dashboard-button" onClick={() => setShowCreate(true)}>+ Add listing</button></div><div className="listing-toolbar"><div className="dashboard-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search listings..." /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All listings</option><option>Published</option><option>Draft</option><option>Needs review</option><option>Hidden</option></select><button className="filter-button">≡ Filter</button></div><div className="table-wrap"><table><thead><tr><th>Business</th><th>Category</th><th>Area</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredListings.map((listing) => <tr key={listing.id}><td><div className="table-business"><span className={`table-art ${listing.accent}`}>{listing.category === "Phones & Tech" ? "▣" : "◈"}</span><div><strong>{listing.name} {listing.verified && <span className="verified">✓</span>}</strong><small>Updated today</small></div></div></td><td>{listing.category}</td><td>{listing.area}</td><td><span className={`listing-status ${listingStatus(listing.status)}`}><i />{listing.status}</span></td><td><div className="table-actions"><button onClick={() => setSelectedId(listing.id)}>Edit</button><button onClick={() => updateStatus(listing.id, listing.status === "Published" ? "Hidden" : "Published")}>{listing.status === "Published" ? "Hide" : "Publish"}</button></div></td></tr>)}</tbody></table>{!filteredListings.length && <div className="table-empty">No listings match those filters.</div>}</div></section>
      <section className="dashboard-lower"><div className="dashboard-panel queue-panel"><div className="panel-heading"><div><p className="eyebrow">REVIEW QUEUE</p><h2>Needs your attention</h2></div><button className="text-action">View queue →</button></div><div className="queue-item"><span className="queue-icon amber">!</span><div><strong>Northline Fitness</strong><p>New listing submitted by a seller</p></div><button onClick={() => updateStatus("northline-fitness", "Published")}>Review</button></div><div className="queue-item"><span className="queue-icon blue">♧</span><div><strong>3 business claims</strong><p>Owners are waiting for approval</p></div><button>Review</button></div></div><div className="dashboard-panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">ACTIVITY</p><h2>Recently added</h2></div></div><p className="activity-big">{listings.length}<span> listings live in Terminus</span></p><div className="activity-bar"><i /><i /><i /><i /><i /><i /><i /></div><p className="activity-caption">Your directory is growing steadily <span>↗</span></p></div></section>
    </section>
    {showCreate && <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}><form className="modal-card" onSubmit={createListing} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow accent">NEW DIRECTORY ENTRY</p><h2>Create a listing</h2></div><button type="button" onClick={() => setShowCreate(false)}>×</button></div><label>Business name<input name="name" placeholder="e.g. Terminus Fresh Market" required /></label><label>Category<select name="category" defaultValue="Services">{categories.filter((item) => item.name !== "All").map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label>Description<textarea name="description" placeholder="What does this business offer?" rows={3} /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary-dashboard-button">Save draft</button></div></form></div>}
    {selectedListing && <div className="modal-backdrop" onMouseDown={() => setSelectedId(null)}><div className="modal-card" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow accent">LISTING CONTROL</p><h2>{selectedListing.name}</h2></div><button onClick={() => setSelectedId(null)}>×</button></div><p className="modal-copy">Manage publication, review status, and the public verification checkmark.</p><div className="edit-controls"><label>Publication status<select value={selectedListing.status} onChange={(event) => updateStatus(selectedListing.id, event.target.value as ListingState["status"])}><option>Published</option><option>Draft</option><option>Needs review</option><option>Hidden</option></select></label><button className="verify-toggle" onClick={() => toggleVerified(selectedListing.id, !selectedListing.verified)}>{selectedListing.verified ? "✓ Verified listing" : "Add verified checkmark"}</button></div><div className="modal-actions"><button className="outline-button" onClick={() => setSelectedId(null)}>Close</button><Link className="primary-dashboard-button" href={`/?q=${selectedListing.name}`}>View public listing</Link></div></div></div>}
  </main>;
}

function StatCard({ label, value, delta, icon, warning = false }: { label: string; value: string; delta: string; icon: string; warning?: boolean }) {
  return <div className="stat-card"><span className={`stat-icon ${warning ? "warning" : ""}`}>{icon}</span><p>{label}</p><strong>{value}</strong><small>{delta}</small></div>;
}
