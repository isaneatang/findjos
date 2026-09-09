import type { Business } from "../data";

type Props = { business: Business; saved: boolean; onSave: (id: string) => void };

// Renders one listing and exposes only safe contact actions in the public demo.
export function BusinessCard({ business, saved, onSave }: Props) {
  return <article className="business-card"><div className={`business-art ${business.accent}`}><span className="art-label">{business.category.split(" ")[0]}</span><button className="save-button" onClick={() => onSave(business.id)} aria-label={saved ? `Remove ${business.name} from saved` : `Save ${business.name}`}>{saved ? "♥" : "♡"}</button>{business.featured && <span className="featured-label">FEATURED</span>}<span className="art-symbol">{business.category === "Food & Dining" ? "◒" : business.category === "Phones & Tech" ? "▣" : business.category === "Health & Fitness" ? "✳" : "◈"}</span></div><div className="business-info"><div className="business-title"><div><h3>{business.name}{business.verified && <span className="verified" title="Verified listing">✓</span>}</h3><p>{business.category}</p></div><span className="rating">★ {business.rating}</span></div><p className="business-description">{business.description}</p><div className="business-meta"><span>⌖ {business.area}</span><span>◷ {business.hours}</span></div><div className="card-actions"><button className="light-action">View details <span>→</span></button><a className="whatsapp-action" href="https://wa.me/2348000000000" target="_blank" rel="noreferrer">WhatsApp</a></div></div></article>;
}
