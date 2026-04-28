import React from "react";
import { PropsWithChildren } from "react";
import { AuthProvider } from "@/src/providers/AuthProvider";
import QueryProvider from '@/src/providers/QueryProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}
