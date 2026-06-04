import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

export function Modal({ title, children, onClose, large }: { title: string; children: ReactNode; onClose: () => void; large?: boolean }) {
  return (
    <div className="modal-backdrop">
      <div className={cn("modal-card", large && "modal-large")}>
        <div className="modal-head">
          <h2 className="card-title">{title}</h2>
          <Button aria-label="Close" onClick={onClose} className="icon-btn">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
