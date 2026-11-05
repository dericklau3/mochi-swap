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
  // Avoid very high slippage that could allow severely unfavorable execution.
  if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 20) return "";
  return String(numericValue);
}

export function SwapSettings({ slippage, setSlippage, deadline, setDeadline, onClose }: { slippage: string; setSlippage: (value: string) => void; deadline: string; setDeadline: (value: string) => void; onClose: () => void }) {
  const [draftSlippage, setDraftSlippage] = useState(slippage);
  const [draftDeadline, setDraftDeadline] = useState(deadline);
  const [activePreset, setActivePreset] = useState(() => SLIPPAGE_PRESETS.find((preset) => Number(preset) === Number(slippage)));

  const normalizedSlippage = normalizePercent(draftSlippage);
  const normalizedDeadline = draftDeadline.trim();
  const minutes = Number(normalizedDeadline);
  const canSave = normalizedSlippage !== "" && /^\d+$/.test(normalizedDeadline)
    && Number.isSafeInteger(minutes) && minutes >= 1 && minutes <= 60;

  function saveSettings() {
    if (!canSave) return;
    setSlippage(activePreset ?? normalizedSlippage);
    setDeadline(String(minutes));
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
                onClick={() => {
                  setActivePreset(preset);
                  setDraftSlippage(preset);
                }}
              >
                {preset}%
              </button>
            ))}
            <label className={cn("slippage-custom", !activePreset && draftSlippage !== "" && "is-active")}>
              <input
                value={activePreset ? "" : draftSlippage}
                inputMode="decimal"
                placeholder="Custom"
                onChange={(event) => {
                  setActivePreset(undefined);
                  setDraftSlippage(toSafeAmount(event.target.value));
                }}
              />
              <span>%</span>
            </label>
          </div>
        </div>
        <label className="state-grid card-subtitle">
          Transaction deadline
          <Input value={draftDeadline} inputMode="numeric" onChange={(event) => setDraftDeadline(event.target.value)} />
        </label>
        <p className="card-subtitle">Slippage: 0–20%. Deadline: 1–60 minutes.</p>
        <div className="modal-actions"><Button variant="primary" className="btn-wide" disabled={!canSave} onClick={saveSettings}>Save settings</Button></div>
      </div>
    </Modal>
  );
}
