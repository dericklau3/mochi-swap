import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export type LiquidityMode = "V2" | "V3" | "V4";

export function CreatePositionModal({ onClose, onChoose }: { onClose: () => void; onChoose: (mode: LiquidityMode) => void }) {
  const versions = [
    ["V2", "V2 liquidity", "Classic constant product pair with a 0.3% provider fee."],
    ["V3", "V3 concentrated liquidity", "Choose a fee tier and price range before adding liquidity."],
    ["V4", "V4 concentrated liquidity", "Choose a fee tier and price range before adding liquidity."]
  ] as const;

  return (
    <Modal title="Create position" onClose={onClose}>
      <div className="version-list">
        {versions.map(([version, title, copy]) => (
          <Button
            key={version}
            className="version-card"
            onClick={() => {
              onChoose(version);
            }}
          >
            <div>
              <strong>{title}</strong>
              <p className="card-subtitle">{copy}</p>
            </div>
            <span className="state-value">{version}</span>
          </Button>
        ))}
      </div>
    </Modal>
  );
}
