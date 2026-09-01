import { ThemeProvider } from "@vexcms/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type PropsWithChildren } from "react";

import { AuthServerProvider } from "./auth";
import ConvexClientProvider from "./convex";

export default function ServerProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system">
      <ConvexClientProvider>
        <AuthServerProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </AuthServerProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  );
}
