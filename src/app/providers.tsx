import type { ReactNode } from "react";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../lib/wagmi";

const queryClient = new QueryClient();
const rainbowTheme = lightTheme({
  accentColor: "#8b5cf6",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
  fontStack: "system"
});

rainbowTheme.colors.connectButtonBackground = "rgba(255, 255, 255, 0.72)";
rainbowTheme.colors.connectButtonInnerBackground = "rgba(246, 239, 255, 0.76)";
rainbowTheme.colors.connectButtonText = "#25104f";
rainbowTheme.colors.connectButtonBackgroundError = "#fff1f2";
rainbowTheme.colors.connectButtonTextError = "#dc2626";
rainbowTheme.colors.generalBorder = "#e6d8f7";
rainbowTheme.colors.modalBackground = "#ffffff";
rainbowTheme.colors.modalBorder = "#e6d8f7";
rainbowTheme.colors.modalText = "#25104f";
rainbowTheme.colors.modalTextSecondary = "#7c6c9b";
rainbowTheme.colors.profileForeground = "#fbf7ff";
rainbowTheme.colors.actionButtonSecondaryBackground = "#f6efff";
rainbowTheme.shadows.connectButton = "0 0 0 1px #e6d8f7";
rainbowTheme.shadows.dialog = "0 24px 64px rgba(65, 24, 132, 0.14)";
rainbowTheme.radii.connectButton = "10px";
rainbowTheme.radii.actionButton = "10px";
rainbowTheme.radii.modal = "28px";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
