import type {
  KeyValidationResponse,
  KeyValidationRequest,
} from "@shared/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AccessContextValue = {
  isUnlocked: boolean;
  isCheckingSession: boolean;
  accessLabel: string | null;
  validateKey: (key: string) => Promise<KeyValidationResponse>;
  logout: () => void;
};

const STORAGE_KEY = "snipez-access-key";

const AccessContext = createContext<AccessContextValue | null>(null);

export function SnipezAccessProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [accessLabel, setAccessLabel] = useState<string | null>(null);

  const validateKey = useCallback(async (key: string) => {
    const payload: KeyValidationRequest = { key };
    const response = await fetch("/api/auth/validate-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as KeyValidationResponse;

    if (result.success) {
      localStorage.setItem(STORAGE_KEY, key.trim());
      setIsUnlocked(true);
      setAccessLabel(result.accessLabel ?? null);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setIsUnlocked(false);
      setAccessLabel(null);
    }

    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    setAccessLabel(null);
  }, []);

  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);

    if (!savedKey) {
      setIsCheckingSession(false);
      return;
    }

    validateKey(savedKey)
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setIsUnlocked(false);
        setAccessLabel(null);
      })
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, [validateKey]);

  const value = useMemo(
    () => ({
      isUnlocked,
      isCheckingSession,
      accessLabel,
      validateKey,
      logout,
    }),
    [accessLabel, isCheckingSession, isUnlocked, logout, validateKey],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useSnipezAccess() {
  const context = useContext(AccessContext);

  if (!context) {
    throw new Error("useSnipezAccess must be used within SnipezAccessProvider");
  }

  return context;
}
