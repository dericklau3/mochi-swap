import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletButton() {
  return <ConnectButton accountStatus="full" chainStatus="none" showBalance={false} />;
}
