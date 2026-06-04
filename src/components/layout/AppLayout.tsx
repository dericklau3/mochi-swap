import type { ReactNode } from "react";
import type { PageKey } from "../../pages/types";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { NetworkPill } from "../wallet/NetworkPill";
import { WalletButton } from "../wallet/WalletButton";

export function AppLayout({ page, onPageChange, children }: { page: PageKey; onPageChange: (page: PageKey) => void; children: ReactNode }) {
  return (
    <div className="app-shell">
      <Header page={page} onPageChange={onPageChange} />
      <div className="app-actions">
        <NetworkPill />
        <WalletButton />
      </div>
      <main className="page content-shell">{children}</main>
      <MobileNav page={page} onPageChange={onPageChange} />
    </div>
  );
}
