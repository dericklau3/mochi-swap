import logo from "../../assets/mochi-logo.png";
import type { PageKey } from "../../pages/types";
import { cn } from "../../lib/utils";
import { navItems } from "./navItems";

export function Header({ page, onPageChange }: { page: PageKey; onPageChange: (page: PageKey) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-mark" src={logo} alt="MochiSwap" />
        <span className="brand-name">MochiSwap</span>
      </div>
      <nav className="nav-tabs" aria-label="DEX navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={cn("nav-tab", page === item.id && "is-active")}
            onClick={() => onPageChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
