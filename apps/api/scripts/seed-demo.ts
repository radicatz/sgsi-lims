// Demo accounts for development and staging only (spec 13.8): the personas of the prototype and the Admin frames.
// Usage: set DEMO_PASSWORD in .env, then `pnpm seed:demo`. Safe to run again: existing accounts are updated, not duplicated.
import { admin } from "../src/supabase";
import { sql, system } from "../src/db";

const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 10) { console.error("Set DEMO_PASSWORD (10+ characters with a letter and a number) in .env first."); process.exit(1); }

const PEOPLE: Array<[string, string, string, string[], "active" | "invited" | "inactive" | "locked"]> = [
  ["Wahyu Pratama", "wahyu@sgsi.co.id", "System Administrator", ["superadmin"], "active"],
  ["Maya Lestari, A.Md.", "maya@sgsi.co.id", "Laboratory Administrator", ["lab_admin"], "active"],
  ["Hendra Wijaya, S.T.", "hendra@sgsi.co.id", "Laboratory Supervisor", ["supervisor"], "active"],
  ["Ir. Bambang Sutrisno, M.T.", "bambang@sgsi.co.id", "Head of Laboratory", ["manager"], "active"],
  ["Rina Kartika, S.E.", "rina@sgsi.co.id", "Customer Service Officer", ["cso"], "active"],
  ["Dedi Kurniawan", "dedi@sgsi.co.id", "Sample Preparation Technician", ["prep"], "active"],
  ["Fitri Handayani, S.Si.", "fitri@sgsi.co.id", "Laboratory Analyst", ["analyst"], "active"],
  ["Yusuf Hidayat", "yusuf@sgsi.co.id", "Sample Preparation Technician", ["prep", "analyst"], "active"],
  ["Bagus Prasetyo, A.Md.", "bagus@sgsi.co.id", "Laboratory Analyst", ["analyst"], "active"],
  ["Joko Santoso", "joko@sgsi.co.id", "Sample Preparation Technician", ["prep"], "active"],
];

const meta = { requestId: "seed-demo", screen: "Seed" };
const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
for (const [name, email, title, roles, status] of PEOPLE) {
  let id = list?.users.find((u) => u.email === email)?.id;
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
    if (error) { console.error(email, error.message); continue; }
    id = data.user.id;
  } else {
    await admin.auth.admin.updateUserById(id, { password });
  }
  await system(meta, async (tx) => {
    await tx`insert into profiles (id, email, full_name, title, status) values (${id!}, ${email}, ${name}, ${title}, ${status})
             on conflict (id) do update set full_name = excluded.full_name, title = excluded.title, status = excluded.status, failed_attempts = 0, locked_until = null`;
    await tx`delete from user_roles where user_id = ${id!}`;
    await tx`insert into user_roles (user_id, role_id) select ${id!}, id from roles where code = any(${roles})`;
  });
  console.log(`${email.padEnd(22)} ${roles.join(", ")}`);
}
await sql.end();
console.log("Demo accounts ready. Sign in with any of these emails and DEMO_PASSWORD.");
