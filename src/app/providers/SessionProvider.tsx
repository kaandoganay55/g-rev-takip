"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

// Session yönetimi için provider bileşeni
export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
} 