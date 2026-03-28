import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { Value } from "convex/values";
import { INPUT_LIMITS, sanitizeOptionalText } from "./helpers";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params: Record<string, Value | undefined>) {
        const email = String(params.email ?? "").trim().toLowerCase();
        const fallbackName = email.split("@")[0] ?? "member";
        const rawHandle = sanitizeOptionalText(
          String(params.displayName ?? params.handle ?? fallbackName),
          "Handle",
          INPUT_LIMITS.handle
        );

        return {
          email,
          name: rawHandle || fallbackName,
          role: "member",
        };
      },
    }),
  ],
});
