import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError, Value } from "convex/values";
import { AUTH_DISPLAY_NAME_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from "../lib/auth-constraints";
import { INPUT_LIMITS, sanitizeOptionalText } from "./helpers";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      validatePasswordRequirements(password) {
        if (!password || password.length < AUTH_PASSWORD_MIN_LENGTH) {
          throw new ConvexError(`Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters`);
        }
      },
      profile(params: Record<string, Value | undefined>) {
        const email = String(params.email ?? "").trim().toLowerCase();
        const fallbackName =
          (email.split("@")[0] ?? "member").slice(0, AUTH_DISPLAY_NAME_MAX_LENGTH) || "member";
        const displayName =
          typeof params.displayName === "string"
            ? params.displayName
            : typeof params.handle === "string"
              ? params.handle
              : "";
        const rawHandle = sanitizeOptionalText(
          displayName.slice(0, AUTH_DISPLAY_NAME_MAX_LENGTH),
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
