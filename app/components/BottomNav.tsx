type View = "discover" | "saved" | "seller" | "profile";

type Props = { active: View; onChange: (view: View) => void; savedCount: number };

// Keeps primary mobile actions thumb-reachable while desktop uses the side rail.
export function BottomNav({ active, onChange, savedCount }: Props) {
  const links: { view: View; label: string; icon: string }[] = [
    { view: "discover", label: "Explore", icon: "⌕" },
    { view: "saved", label: "Saved", icon: "♡" },
    { view: "seller", label: "For business", icon: "▣" },
    { view: "profile", label: "Profile", icon: "◉" },
  ];
  return <nav className="bottom-nav" aria-label="Mobile navigation">{links.map((link) => <button key={link.view} className={active === link.view ? "bottom-link active" : "bottom-link"} onClick={() => onChange(link.view)}><span className="bottom-icon">{link.icon}{link.view === "saved" && savedCount > 0 && <b>{savedCount}</b>}</span><span>{link.label}</span></button>)}</nav>;
}
