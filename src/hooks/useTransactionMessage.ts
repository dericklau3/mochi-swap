import { useEffect, useRef } from "react";
import type { Hash } from "viem";
import { formatAddress } from "../lib/format";
import { useMessage } from "../components/ui/messageContext";

export function useTransactionMessage({
  hash,
  isSuccess,
  readableError,
  successTitle,
  failureTitle
}: {
  hash?: Hash;
  isSuccess: boolean;
  readableError?: string;
  successTitle: string;
  failureTitle: string;
}) {
  const { pushMessage } = useMessage();
  const lastSuccess = useRef<Hash>();
  const lastError = useRef<string>();

  useEffect(() => {
    if (!isSuccess || !hash || lastSuccess.current === hash) return;
    lastSuccess.current = hash;
    pushMessage({
      tone: "success",
      title: successTitle,
      description: formatAddress(hash, 10, 8)
    });
  }, [hash, isSuccess, pushMessage, successTitle]);

  useEffect(() => {
    if (!readableError) {
      lastError.current = undefined;
      return;
    }
    if (lastError.current === readableError) return;
    lastError.current = readableError;
    pushMessage({
      tone: "error",
      title: readableError.toLowerCase().includes("rejected") ? "Transaction rejected" : failureTitle,
      description: readableError
    });
  }, [failureTitle, pushMessage, readableError]);
}
