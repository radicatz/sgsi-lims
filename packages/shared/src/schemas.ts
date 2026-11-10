// Request and response shapes shared by the API (validation) and the web app (forms). Phase 0: session.
import { z } from "zod";

export const SignInBody = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
export type SignInBody = z.infer<typeof SignInBody>;

export const ForgotBody = z.object({ email: z.string().trim().toLowerCase().email() });

export const SetPasswordBody = z.object({ password: z.string().min(1) });

/** Password rules from Configuration, Security (App screens, Set password). Returns the message to show, or null. */
export function passwordProblem(pw: string, rules: { min_password_length: number; require_letter_and_number: boolean; require_special_character: boolean; forbid_email_in_password: boolean }, email?: string): string | null {
  const parts: string[] = [`at least ${rules.min_password_length} characters`];
  if (rules.require_letter_and_number) parts.push("a letter and a number");
  if (rules.require_special_character) parts.push("a special character");
  const msg = "Use " + parts.join(", ").replace(/, ([^,]*)$/, " with $1") + ".";
  if (pw.length < rules.min_password_length) return msg;
  if (rules.require_letter_and_number && !(/[a-z]/i.test(pw) && /\d/.test(pw))) return msg;
  if (rules.require_special_character && !/[^a-z0-9]/i.test(pw)) return msg;
  if (rules.forbid_email_in_password && email && pw.toLowerCase().includes(email.split("@")[0]!.toLowerCase())) return "Don't use your email in the password.";
  return null;
}

export interface Me {
  id: string; email: string; fullName: string; title: string | null;
  roles: string[]; permissions: string[];
  prefs: { sidebar?: "expanded" | "collapsed"; startPage?: string; notifications?: Record<string, boolean> };
  unread: number;
  settings: { timezone: string; idleSignOutMinutes: number; warnBeforeSeconds: number };
}
