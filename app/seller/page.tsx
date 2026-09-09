"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "../data";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";
import { isSupabaseConfigured } from "../../lib/supabase/config";

type Product = { id: string; name: string; description: string; price: string | null; available: boolean; status: string };
type SellerBusiness = { id: string; name: string; description: string; area: string; phone: string | null; whatsapp: string | null; landmark: string | null; status: string; verified: boolean; category: { name: string } | { name: string }[] | null; products: Product[] };

const demoBusiness: SellerBusiness = { id: "demo-business", name: "Terminus Mobile Hub", description: "Phones, accessories and honest device advice.", area: "Terminus", phone: null, whatsapp: null, landmark: "Ahmadu Bello Way", status: "published", verified: true, category: { name: "Phones & Tech" }, products: [
  { id: "demo-1", name: "iPhone 13 128GB", description: "Like new · Black", price: "₦650,000", available: true, status: "published" },
  { id: "demo-2", name: "Samsung A55", description: "Brand new · 256GB", price: "₦420,000", available: true, status: "published" },
  { id: "demo-3", name: "AirPods Pro", description: "2nd generation", price: "₦185,000", available: false, status: "published" },
] };

// Extracts a category name from Supabase's one-to-one relation response.
function categoryName(business: SellerBusiness) {
  return Array.isArray(business.category) ? business.category[0]?.name : business.category?.name;
}

export default function SellerDashboard() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<SellerBusiness[]>(isSupabaseConfigured() ? [] : [demoBusiness]);
  const [selectedId, setSelectedId] = useState(isSupabaseConfigured() ? "" : demoBusiness.id);
  const [tab, setTab] = useState("Overview");
  const [showProduct, setShowProduct] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [notice, setNotice] = useState("Loading your workspace...");

  const business = businesses.find((item) => item.id === selectedId) || businesses[0];

  // Loads businesses and products protected by the seller's Supabase session.
  useEffect(() => {
    if (!isSupabaseConfigured()) { setNotice("Demo seller workspace. Connect Supabase to persist changes."); return; }
    fetch("/api/seller/workspace")
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); return payload; })
      .then((payload: { businesses: SellerBusiness[] }) => { setBusinesses(payload.businesses); setSelectedId(payload.businesses[0]?.id || ""); setNotice(payload.businesses.length ? "Your business data is connected to Supabase." : "Add your first business to begin."); })
      .catch((error: Error) => setNotice(error.message));
  }, []);

  // Creates a seller-owned draft listing for administrator review.
  async function addBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = Object.fromEntries(form.entries());
    if (!isSupabaseConfigured()) { setNotice("Business forms persist after Supabase is connected."); setShowBusiness(false); return; }
    const response = await fetch("/api/seller/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const payload = await response.json();
    if (!response.ok) { setNotice(payload.error); return; }
    setBusinesses((current) => [...current, payload.business]);
    setSelectedId(payload.business.id);
    setShowBusiness(false);
    setNotice("Business submitted as a draft for administrator review.");
  }

  // Adds a product to the selected seller-owned business.
  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business) return;
    const form = new FormData(event.currentTarget);
    const input = { businessId: business.id, name: String(form.get("name")), description: String(form.get("description") || ""), price: String(form.get("price") || "") };
    if (!isSupabaseConfigured()) { setNotice("Product saved in demo mode only."); setShowProduct(false); return; }
    const response = await fetch("/api/seller/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const payload = await response.json();
    if (!response.ok) { setNotice(payload.error); return; }
    setBusinesses((current) => current.map((item) => item.id === business.id ? { ...item, products: [...item.products, payload.product] } : item));
    setShowProduct(false);
    setNotice("Product submitted and saved to Supabase.");
  }

  // Updates product availability while RLS ensures the product belongs to this seller.
  async function toggleStock(product: Product) {
    const available = !product.available;
    setBusinesses((current) => current.map((item) => item.id === business?.id ? { ...item, products: item.products.map((entry) => entry.id === product.id ? { ...entry, available } : entry) } : item));
    if (isSupabaseConfigured()) {
      const response = await fetch("/api/seller/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, available }) });
      if (!response.ok) setNotice("Could not update availability.");
    }
  }

  // Ends the Supabase session and returns to the public marketplace.
  async function signOut() {
    if (isSupabaseConfigured()) await createSupabaseBrowserClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return <main className="seller-dashboard">
    <header className="seller-dashboard-top"><Link className="brand" href="/"><span className="brand-mark">F</span><span>find<span>jos</span></span></Link><div className="seller-top-right"><span className="seller-preview-label">SELLER WORKSPACE</span><span className="seller-user-avatar">BO</span><button className="signout-button" onClick={signOut}>Sign out</button></div></header>
    <div className="seller-dashboard-body"><aside className="seller-side"><div className="seller-business"><span className="seller-logo">{business?.name.slice(0, 2).toUpperCase() || "FJ"}</span><div><strong>{business?.name || "No business yet"}</strong><small>{business ? categoryName(business) : "Create your first listing"} {business?.verified && <span>✓</span>}</small></div>{businesses.length > 1 && <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{businesses.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}</div><nav>{["Overview", "My profile", "Products", "Messages", "Insights"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><span>{item === "Overview" ? "▦" : item === "Products" ? "▣" : item === "Insights" ? "⌁" : item === "Messages" ? "♧" : "◉"}</span>{item}</button>)}</nav><button className="primary-dashboard-button seller-add-business" onClick={() => setShowBusiness(true)}>+ Add a business</button><div className="seller-help"><strong>Need a hand?</strong><p>Your listing is reviewed before it becomes public.</p><Link href="/">Visit FindJos →</Link></div></aside>
      <section className="seller-main"><div className="seller-main-header"><div><p className="eyebrow accent">SELLER DASHBOARD</p><h1>{tab === "Overview" ? <>Manage your <em>presence.</em></> : tab}</h1><p className="dashboard-subtitle">{notice}</p></div>{business && <Link className="seller-view-button" href={`/?q=${encodeURIComponent(business.name)}`}>View public profile ↗</Link>}</div>
        {!business ? <div className="seller-tab-placeholder"><span>✦</span><h2>Add your first business</h2><p>Create a draft listing and an administrator will review it before publication.</p><button className="primary-dashboard-button" onClick={() => setShowBusiness(true)}>Create business</button></div> : tab === "Overview" || tab === "Products" ? <><div className="seller-stat-grid"><div><span>Listing status</span><strong className="seller-status-value">{business.status}</strong><small>{business.verified ? "Verified by FindJos" : "Verification pending"}</small></div><div><span>Products</span><strong>{business.products.length}</strong><small>Keep availability current</small></div><div><span>Area</span><strong className="seller-status-value">{business.area}</strong><small>{business.landmark || "Add a landmark"}</small></div></div><section className="seller-work-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR PRODUCTS</p><h2>Inventory and services</h2></div><button className="primary-dashboard-button" onClick={() => setShowProduct(true)}>+ Add product</button></div><div className="seller-product-list">{business.products.length ? business.products.map((product) => <div className="seller-product" key={product.id}><span className="product-art product-1">▣</span><div><strong>{product.name}</strong><p>{product.description || "No description"} · {product.price || "Price on request"}</p></div><span className="status-chip">{product.status}</span><button className={product.available ? "stock-status" : "stock-status out"} onClick={() => toggleStock(product)}>{product.available ? "In stock" : "Out of stock"}</button></div>) : <div className="table-empty">No products yet. Add what customers can currently find here.</div>}</div></section></> : <div className="seller-tab-placeholder"><span>◌</span><h2>{tab}</h2><p>This section is prepared for the next operational data collected from sellers.</p><button className="primary-dashboard-button" onClick={() => setTab("Overview")}>Back to overview</button></div>}
      </section></div>
    {showBusiness && <div className="modal-backdrop" onMouseDown={() => setShowBusiness(false)}><form className="modal-card" onSubmit={addBusiness} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow accent">SELLER ONBOARDING</p><h2>Add your business</h2></div><button type="button" onClick={() => setShowBusiness(false)}>×</button></div><label>Business name<input name="name" required placeholder="Your registered or trading name" /></label><label>Category<select name="category">{categories.filter((item) => item.name !== "All").map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label>Description<textarea name="description" rows={3} placeholder="What do you offer?" /></label><label>Landmark<input name="landmark" placeholder="e.g. Beside Terminus Market gate" /></label><label>WhatsApp number<input name="whatsapp" placeholder="234..." /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowBusiness(false)}>Cancel</button><button className="primary-dashboard-button">Submit business</button></div></form></div>}
    {showProduct && business && <div className="modal-backdrop" onMouseDown={() => setShowProduct(false)}><form className="modal-card" onSubmit={addProduct} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow accent">INVENTORY</p><h2>Add a product</h2></div><button type="button" onClick={() => setShowProduct(false)}>×</button></div><label>Product name<input name="name" placeholder="e.g. iPhone 15 Pro" required /></label><label>Description<input name="description" placeholder="Condition, colour or storage" /></label><label>Price<input name="price" placeholder="e.g. ₦850,000" /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowProduct(false)}>Cancel</button><button className="primary-dashboard-button">Save product</button></div></form></div>}
  </main>;
}
