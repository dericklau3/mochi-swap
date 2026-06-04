import { useMemo } from "react";
import type { Token } from "../../types/token";
import { Modal } from "../ui/Modal";
import { TokenList } from "./TokenList";
import { CustomTokenForm } from "./CustomTokenForm";
import { useMulticallTokenBalances } from "../../hooks/useMulticallTokenBalances";

export function TokenSelector({ tokens, open, onClose, onChoose, onAddCustom, onRemoveCustom }: { tokens: Token[]; open: boolean; onClose: () => void; onChoose: (token: Token) => void; onAddCustom: (token: Token) => void; onRemoveCustom: (token: Token) => void }) {
  const balances = useMulticallTokenBalances(tokens);
  const balanceMap = useMemo(() => balances.data ?? {}, [balances.data]);
  if (!open) return null;
  return (
    <Modal title="Select a token" onClose={onClose} large>
      <CustomTokenForm existing={tokens} onAdd={onAddCustom} />
      {balances.isError ? <p className="notice warn" style={{ marginTop: 12 }}>multicall failed. Balances may be incomplete.</p> : null}
      <TokenList tokens={tokens} balances={balanceMap} onChoose={onChoose} onRemove={onRemoveCustom} />
    </Modal>
  );
}
