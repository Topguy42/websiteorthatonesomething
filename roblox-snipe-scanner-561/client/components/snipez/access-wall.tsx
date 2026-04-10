import { KeyAccessScreen } from "./key-access-screen";
import { useSnipezAccess } from "./access-provider";

export function AccessWall({ children }: { children: React.ReactNode }) {
  const { isUnlocked, isCheckingSession } = useSnipezAccess();

  if (!isUnlocked) {
    return <KeyAccessScreen isCheckingSession={isCheckingSession} />;
  }

  return <>{children}</>;
}
