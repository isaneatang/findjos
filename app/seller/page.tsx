"use client";

import { useState } from "react";
import Link from "next/link";

type Product = { id: number; name: string; detail: string; price: string; status: "In stock" | "Out of stock" };

const starterProducts: Product[] = [
  { id: 1, name: "iPhone 13 128GB", detail: "Like new · Black", price: "₦650,000", status: "In stock" },
  { id: 2, name: "Samsung A55", detail: "Brand new · 256GB", price: "₦420,000", status: "In stock" },
  { id: 3, name: "AirPods Pro", detail: "2nd generation", price: "₦185,000", status: "Out of stock" },
];

// Provides the seller's first usable workspace without requiring an account yet.
export default function SellerDashboard() {
  const [products, setProducts] = useState(starterProducts);
  const [tab, setTab] = useState("Overview");
  const [showProduct, setShowProduct] = useState(false);
  const [notice, setNotice] = useState("Your profile is live and visible to FindJos visitors.");

  // Adds a product to local demo state; Supabase will persist this later.
  function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProducts((current) => [...current, { id: Date.now(), name: String(form.get("name")), detail: String(form.get("detail") || "Details to add"), price: String(form.get("price") || "Price on request"), status: "In stock" }]);
    setShowProduct(false);
    setNotice("Product saved. It is ready for review.");
  }

  function toggleStock(id: number) {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, status: product.status === "In stock" ? "Out of stock" : "In stock" } : product));
    setNotice("Product availability updated.");
  }

  return <main className="seller-dashboard"><header className="seller-dashboard-top"><Link className="brand" href="/"><span className="brand-mark">F</span><span>find<span>jos</span></span></Link><div className="seller-top-right"><span className="seller-preview-label">SELLER PREVIEW</span><span className="seller-user-avatar">TM</span><Link href="/">Exit dashboard</Link></div></header><div className="seller-dashboard-body"><aside className="seller-side"><div className="seller-business"><span className="seller-logo">TM</span><div><strong>Terminus Mobile Hub</strong><small>Phones & Tech <span>✓</span></small></div><button>⌄</button></div><nav>{["Overview", "My profile", "Products", "Messages", "Insights"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><span>{item === "Overview" ? "▦" : item === "Products" ? "▣" : item === "Insights" ? "⌁" : item === "Messages" ? "♧" : "◉"}</span>{item}{item === "Messages" && <b>4</b>}</button>)}</nav><div className="seller-help"><strong>Need a hand?</strong><p>We are here to help you get set up.</p><button>Chat with FindJos →</button></div></aside><section className="seller-main"><div className="seller-main-header"><div><p className="eyebrow accent">SELLER DASHBOARD</p><h1>{tab === "Overview" ? <>Good morning, <em>there.</em></> : tab}</h1><p className="dashboard-subtitle">{notice}</p></div><button className="seller-view-button" onClick={() => setNotice("Your public profile is opening soon.")}>View public profile ↗</button></div>{tab === "Overview" ? <><div className="seller-stat-grid"><div><span>Profile views</span><strong>1,284</strong><small>↗ 18% this month</small></div><div><span>WhatsApp taps</span><strong>86</strong><small>↗ 24% this month</small></div><div><span>Search appearances</span><strong>342</strong><small>↗ 12% this month</small></div></div><div className="seller-content-grid"><section className="seller-work-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR PRODUCTS</p><h2>Keep your stock current</h2></div><button className="primary-dashboard-button" onClick={() => setShowProduct(true)}>+ Add product</button></div><div className="seller-product-list">{products.map((product) => <div className="seller-product" key={product.id}><span className={`product-art product-${product.id % 3}`}>▣</span><div><strong>{product.name}</strong><p>{product.detail} · {product.price}</p></div><button className={product.status === "In stock" ? "stock-status" : "stock-status out"} onClick={() => toggleStock(product.id)}>{product.status}</button><button className="product-more">•••</button></div>)}</div></section><section className="seller-work-panel profile-progress"><div className="panel-heading"><div><p className="eyebrow">PROFILE HEALTH</p><h2>Looking good</h2></div><span className="health-score">82%</span></div><div className="progress-track"><i /></div><p>Add a cover photo and opening hours to reach 100%.</p><button className="text-action" onClick={() => setTab("My profile")}>Complete profile →</button></section></div><section className="seller-tip"><span>✦</span><div><strong>Profiles with 3+ products get more clicks</strong><p>Keep your most popular devices updated so shoppers know what is available today.</p></div><button onClick={() => setShowProduct(true)}>Add a product →</button></section></> : <div className="seller-tab-placeholder"><span>◌</span><h2>{tab} is ready to configure</h2><p>This workspace is connected to the same seller navigation. The next step is wiring these controls to Supabase.</p><button className="primary-dashboard-button" onClick={() => setTab("Overview")}>Back to overview</button></div>}</section></div>{showProduct && <div className="modal-backdrop" onMouseDown={() => setShowProduct(false)}><form className="modal-card" onSubmit={addProduct} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow accent">INVENTORY</p><h2>Add a product</h2></div><button type="button" onClick={() => setShowProduct(false)}>×</button></div><label>Product name<input name="name" placeholder="e.g. iPhone 15 Pro" required /></label><label>Details<input name="detail" placeholder="Condition, colour or storage" /></label><label>Price<input name="price" placeholder="e.g. ₦850,000" /></label><div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowProduct(false)}>Cancel</button><button className="primary-dashboard-button">Save product</button></div></form></div>}</main>;
}
