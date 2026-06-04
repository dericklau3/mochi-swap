import type { PageKey } from "../../pages/types";
import { cn } from "../../lib/utils";
import { navItems } from "./navItems";

export function MobileNav({ page, onPageChange }: { page: PageKey; onPageChange: (page: PageKey) => void }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile DEX navigation">
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
  );
}
