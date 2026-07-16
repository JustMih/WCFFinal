import { createContext, useContext } from "react";

export const AgentSipPhoneContext = createContext(null);

export function useAgentSipPhone() {
  const ctx = useContext(AgentSipPhoneContext);
  if (!ctx) {
    throw new Error(
      "useAgentSipPhone must be used within AgentSipPhoneProvider"
    );
  }
  return ctx;
}

/** Returns null when outside the provider (e.g. supervisor/admin pages). */
export function useAgentSipPhoneOptional() {
  return useContext(AgentSipPhoneContext);
}
