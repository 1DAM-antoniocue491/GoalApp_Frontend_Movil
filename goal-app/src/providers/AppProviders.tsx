import React from "react";
import { PropsWithChildren } from "react";
import { AuthProvider } from "./AuthProvider";
import { QueryClientProvider } from "./QueryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
