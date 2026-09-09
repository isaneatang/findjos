"use client";

import { useEffect, useMemo, useState } from "react";
import { businesses, categories, type Business } from "./data";
import { BottomNav } from "./components/BottomNav";
import { BusinessCard } from "./components/BusinessCard";
import { SellerPanel } from "./components/SellerPanel";
import Link from "next/link";

type View = "discover" | "saved" | "seller" | "profile";

// Filters the dummy directory using the same keywords a future database search will receive.
function searchBusinesses(items: Business[], query: string, category: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((business) => {
    const matchesCategory = category === "All" || business.category === category;
    const searchableText = [business.name, business.category, business.description, ...business.tags]
      .join(" ")
      .toLowerCase();
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
}

export default function HomePage() {
  const [activeView, setActiveView] = useState<View>("discover");
  const [directory, setDirectory] = useState<Business[]>(businesses);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Loads published Supabase listings when configured, while retaining dummy data offline.
  useEffect(() => {
    fetch("/api/businesses")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Directory unavailable")))
      .then((payload: { businesses?: Business[] }) => {
        if (payload.businesses?.length) setDirectory(payload.businesses);
      })
      .catch(() => {
        // Demo listings remain visible when the local app has no Supabase project yet.
      });
  }, []);

  // Recomputes visible listings only when the search controls or source data change.
  const visibleBusinesses = useMemo(
    () => searchBusinesses(directory, query, selectedCategory),
    [directory, query, selectedCategory],
  );

  // Toggles a listing in local browser state; Supabase will replace this later.
  function toggleSaved(id: string) {
    setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function handleCategory(category: string) {
    setSelectedCategory(category);
    setActiveView("discover");
  }

  const savedBusinesses = directory.filter((business) => savedIds.includes(business.id));

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="FindJos home">
          <span className="brand-mark">F</span>
          <span>find<span>jos</span></span>
        </a>
        <div className="location-pill"><span className="pin">⌖</span> Terminus, Jos <span className="chevron">⌄</span></div>
        <button className="profile-button" onClick={() => setActiveView("profile")} aria-label="Open profile">JD</button>
      </header>

      <div className="page-grid" id="top">
        <aside className="desktop-rail">
          <p className="eyebrow">YOUR LOCAL GUIDE</p>
          <nav className="rail-links" aria-label="Main navigation">
            <button className={activeView === "discover" ? "rail-link active" : "rail-link"} onClick={() => setActiveView("discover")}><span>⌕</span> Discover</button>
            <button className={activeView === "saved" ? "rail-link active" : "rail-link"} onClick={() => setActiveView("saved")}><span>♡</span> Saved <b>{savedIds.length || ""}</b></button>
            <button className={activeView === "seller" ? "rail-link active" : "rail-link"} onClick={() => setActiveView("seller")}><span>▣</span> For business</button>
          </nav>
          <div className="rail-note"><span className="note-spark">✦</span><strong>Know a place we should add?</strong><p>Help someone find it.</p><button onClick={() => setActiveView("seller")}>Suggest a business <span>↗</span></button></div>
          <div className="rail-footer">Built for Jos <span>•</span> v0.1 demo</div>
        </aside>

        <section className="content-column">
          {activeView === "seller" ? <SellerPanel /> : activeView === "profile" ? <ProfileView /> : (
            <>
              <section className="hero-block">
                <p className="eyebrow accent">DISCOVER JOS, YOUR WAY</p>
                <h1>What are you <em>looking</em> for?</h1>
                <p className="hero-copy">Find trusted businesses, useful services, and hidden gems around you.</p>
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “phone repair” or “suya”..." aria-label="Search businesses and services" />
                  <button onClick={() => setQuery("")} className="search-action">{query ? "Clear" : "⌘ K"}</button>
                </div>
              </section>

              {activeView === "saved" ? <section className="section-block"><SectionHeading eyebrow="YOUR SHORTLIST" title="Saved places" action="Browse all" /><div className="business-grid">{savedBusinesses.length ? savedBusinesses.map((business) => <BusinessCard key={business.id} business={business} saved={true} onSave={toggleSaved} />) : <EmptyState onBrowse={() => setActiveView("discover")} />}</div></section> : (
                <>
                  <section className="section-block category-section"><SectionHeading eyebrow="BROWSE BY NEED" title="Start exploring" action="See all" /><div className="category-row">{categories.map((category) => <button key={category.name} className={selectedCategory === category.name ? "category-tile selected" : "category-tile"} onClick={() => handleCategory(category.name)}><span className="category-icon">{category.icon}</span><span>{category.name}</span></button>)}</div></section>
                  <section className="section-block"><div className="section-heading"><div><p className="eyebrow">{query || selectedCategory !== "All" ? "SEARCH RESULTS" : "CURATED FOR YOU"}</p><h2>{query || selectedCategory !== "All" ? `${visibleBusinesses.length} places found` : "Places worth knowing"}</h2></div><button className="text-action" onClick={() => { setQuery(""); setSelectedCategory("All"); }}>View all <span>→</span></button></div><div className="business-grid">{visibleBusinesses.map((business) => <BusinessCard key={business.id} business={business} saved={savedIds.includes(business.id)} onSave={toggleSaved} />)}</div>{!visibleBusinesses.length && <EmptyState onBrowse={() => { setQuery(""); setSelectedCategory("All"); }} />}</section>
                </>
              )}
            </>
          )}
        </section>
      </div>
      <BottomNav active={activeView} onChange={setActiveView} savedCount={savedIds.length} />
    </main>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action: string }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><button className="text-action">{action} <span>→</span></button></div>;
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return <div className="empty-state"><span>◌</span><h3>Nothing here yet</h3><p>Explore the Terminus directory to start building your shortlist.</p><button onClick={onBrowse}>Browse places</button></div>;
}

function ProfileView() {
  return <section className="profile-view"><p className="eyebrow accent">YOUR FINDJOS PROFILE</p><h1>Welcome, <em>friend.</em></h1><div className="profile-card"><div className="profile-avatar">JD</div><div><strong>Guest viewer</strong><p>You are browsing as a guest.</p></div><Link className="profile-signin" href="/login">Sign in</Link></div><div className="profile-benefits"><h2>Make FindJos yours</h2><p>Create an account later to save places and keep your discoveries across devices.</p><Link className="dark-button" href="/login">Create viewer account <span>→</span></Link></div></section>;
}
