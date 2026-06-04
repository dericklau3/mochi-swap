import { useState } from "react";

import { toSafeAmount } from "../../lib/format";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

const SLIPPAGE_PRESETS = ["0.1", "0.5", "1.0"] as const;

function normalizePercent(value: string) {
  const safeValue = toSafeAmount(value);
  if (safeValue === "" || safeValue === ".") return "";
  const numericValue = Number(safeValue);
  if (!Number.isFinite(numericValue) || numericValue < 0) return "";
  return String(numericValue);
}

export function SwapSettings({ slippage, setSlippage, deadline, setDeadline, onClose }: { slippage: string; setSlippage: (value: string) => void; deadline: string; setDeadline: (value: string) => void; onClose: () => void }) {
  const [draftSlippage, setDraftSlippage] = useState(slippage);
  const [draftDeadline, setDraftDeadline] = useState(deadline);

  const activePreset = SLIPPAGE_PRESETS.find((preset) => Number(preset) === Number(draftSlippage));
  const normalizedSlippage = normalizePercent(draftSlippage);
  const canSave = normalizedSlippage !== "";

  function saveSettings() {
    if (!canSave) return;
    setSlippage(activePreset ?? normalizedSlippage);
    setDeadline(draftDeadline.trim() || "20");
    onClose();
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="state-grid">
        <div>
          <p className="card-subtitle" style={{ marginBottom: 12 }}>Slippage tolerance</p>
          <div className="slippage-options" role="group" aria-label="Slippage tolerance">
            {SLIPPAGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={cn("slippage-preset", activePreset === preset && "is-active")}
                onClick={() => setDraftSlippage(preset)}
              >
                {preset}%
              </button>
            ))}
            <label className={cn("slippage-custom", !activePreset && draftSlippage !== "" && "is-active")}>
              <input
                value={activePreset ? "" : draftSlippage}
                inputMode="decimal"
                placeholder="Custom"
                onChange={(event) => setDraftSlippage(toSafeAmount(event.target.value))}
              />
              <span>%</span>
            </label>
          </div>
        </div>
        <label className="state-grid card-subtitle">
          Transaction deadline
          <Input value={draftDeadline} inputMode="numeric" onChange={(event) => setDraftDeadline(event.target.value)} />
        </label>
        <div className="modal-actions"><Button variant="primary" className="btn-wide" disabled={!canSave} onClick={saveSettings}>Save settings</Button></div>
      </div>
    </Modal>
  );
}
