// The password rules of Configuration > Security as a checklist that ticks while the person types (App plan 3.4 and section 6):
// used by Set password (reset and invite) and by Change password on the Profile.
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { Icon, cx } from "../../components";

export interface AuthRules { minPasswordLength: number; requireLetterAndNumber: boolean; requireSpecialCharacter: boolean; resetLinkMinutes: number; inviteDays: number }
export const useAuthRules = () => useQuery({ queryKey: ["auth-rules"], queryFn: () => api<AuthRules>("/auth/rules"), staleTime: 300_000 });
/** The rules in the shape `passwordProblem` (shared) checks. */
export const toRules = (r: AuthRules) => ({ min_password_length: r.minPasswordLength, require_letter_and_number: r.requireLetterAndNumber, require_special_character: r.requireSpecialCharacter, forbid_email_in_password: true });

export function PasswordRules({ pw, email }: { pw: string; email: string }) {
  const rules = useAuthRules();
  if (!rules.data) return null;
  const r = rules.data, items: Array<[string, boolean]> = [[`At least ${r.minPasswordLength} characters`, pw.length >= r.minPasswordLength]];
  if (r.requireLetterAndNumber) items.push(["A letter and a number", /[a-z]/i.test(pw) && /\d/.test(pw)]);
  if (r.requireSpecialCharacter) items.push(["A special character", /[^a-z0-9]/i.test(pw)]);
  const local = (email.split("@")[0] ?? "").toLowerCase();
  items.push(["Not your email", !!pw && (!local || !pw.toLowerCase().includes(local))]);
  return (
    <ul className="col g6 pw-rules" id="pw-rules" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map(([t, ok]) => (
        <li key={t} className={cx("row g8 t-sm", ok ? "c-ok" : "c-sec")} style={{ flexWrap: "nowrap" }} data-done={ok}>
          <Icon n={ok ? "check-circle" : "circle"} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
