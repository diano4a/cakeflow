/**
 * Development seed for CakeFlow.
 *
 * Creates one demo bakery with an OWNER, a MANAGER and a BAKER, plus a small
 * catalog and a few representative orders, so the role-based RLS policies can
 * be exercised by signing in as each member.
 *
 * Runs against a local Supabase stack or a development project. Never against
 * production: every value comes from the environment and remote targets have
 * to be opted into explicitly.
 *
 *   npm run seed:dev
 *
 * Re-running is safe; existing rows are reused rather than duplicated.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_PASSWORD = process.env.SEED_DEV_PASSWORD;
const EMAIL_DOMAIN = process.env.SEED_DEV_EMAIL_DOMAIN ?? "demo.cakeflow.test";
const ALLOW_REMOTE = process.env.SEED_ALLOW_REMOTE === "true";

const BAKERY_NAME = "Demo Bakery";

const MEMBERS = [
  { role: "owner", localPart: "owner", fullName: "Demo Owner" },
  { role: "manager", localPart: "manager", fullName: "Demo Manager" },
  { role: "baker", localPart: "baker", fullName: "Demo Baker" },
];

function fail(message) {
  console.error(`seed-dev: ${message}`);
  process.exit(1);
}

function assertEnvironment() {
  if (!SUPABASE_URL) {
    fail("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required.");
  }
  if (!SERVICE_ROLE_KEY) {
    fail(
      "SUPABASE_SERVICE_ROLE_KEY is required. Read it from your local stack " +
        "(`supabase status`) or the dev project settings. Never commit it.",
    );
  }
  if (!SEED_PASSWORD) {
    fail(
      "SEED_DEV_PASSWORD is required so no password is baked into the repository.",
    );
  }

  const host = new URL(SUPABASE_URL).hostname;
  const isLocal = host === "127.0.0.1" || host === "localhost";
  if (!isLocal && !ALLOW_REMOTE) {
    fail(
      `Refusing to seed non-local host "${host}". Set SEED_ALLOW_REMOTE=true ` +
        "once you have confirmed this is a development project.",
    );
  }
}

/** Creates the user if absent, and returns its id either way. */
async function ensureUser(admin, { localPart, fullName }) {
  const email = `${localPart}@${EMAIL_DOMAIN}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (!error) {
    return { email, id: data.user.id };
  }

  // Already seeded on an earlier run: look the user up instead.
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    return { email, id: existing.id };
  }

  fail(`could not create or find user ${email}: ${error.message}`);
}

async function findUserByEmail(admin, email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      fail(`could not list users: ${error.message}`);
    }
    const match = data.users.find((user) => user.email === email);
    if (match) {
      return match;
    }
    if (data.users.length < 200) {
      return null;
    }
    page += 1;
  }
}

async function ensureProfile(admin, userId, fullName) {
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name: fullName }, { onConflict: "id" });
  if (error) {
    fail(`could not upsert profile ${userId}: ${error.message}`);
  }
}

async function ensureBakery(admin, ownerId) {
  const { data: existing, error: selectError } = await admin
    .from("bakeries")
    .select("id")
    .eq("name", BAKERY_NAME)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (selectError) {
    fail(`could not look up the demo bakery: ${selectError.message}`);
  }
  if (existing) {
    return existing.id;
  }

  const { data, error } = await admin
    .from("bakeries")
    .insert({ name: BAKERY_NAME, owner_id: ownerId })
    .select("id")
    .single();
  if (error) {
    fail(`could not create the demo bakery: ${error.message}`);
  }
  return data.id;
}

async function ensureMemberships(admin, bakeryId, members) {
  const rows = members.map(({ id, role }) => ({
    bakery_id: bakeryId,
    user_id: id,
    role,
  }));

  const { error } = await admin
    .from("bakery_members")
    .upsert(rows, { onConflict: "bakery_id,user_id" });
  if (error) {
    fail(`could not upsert memberships: ${error.message}`);
  }
}

async function ensureCatalog(admin, bakeryId) {
  const { data: existing, error: selectError } = await admin
    .from("catalog_items")
    .select("id, name")
    .eq("bakery_id", bakeryId);
  if (selectError) {
    fail(`could not read the catalog: ${selectError.message}`);
  }

  const wanted = [
    { name: "Classic sponge cake", product_type: "cake", base_price: 45 },
    { name: "Chocolate tart", product_type: "tart", base_price: 32.5 },
    { name: "Cupcake box of 12", product_type: "cupcakes", base_price: 28 },
  ];

  const missing = wanted.filter(
    (item) => !existing.some((row) => row.name === item.name),
  );
  if (missing.length > 0) {
    const { error } = await admin
      .from("catalog_items")
      .insert(missing.map((item) => ({ ...item, bakery_id: bakeryId })));
    if (error) {
      fail(`could not insert catalog items: ${error.message}`);
    }
  }

  const { data, error } = await admin
    .from("catalog_items")
    .select("id, name")
    .eq("bakery_id", bakeryId);
  if (error) {
    fail(`could not re-read the catalog: ${error.message}`);
  }
  return data;
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function ensureOrders(admin, bakeryId, catalog, byRole) {
  const { count, error: countError } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("bakery_id", bakeryId);
  if (countError) {
    fail(`could not count orders: ${countError.message}`);
  }
  if (count && count > 0) {
    console.log(`seed-dev: ${count} order(s) already present, skipping orders.`);
    return;
  }

  const catalogIdByName = new Map(catalog.map((item) => [item.name, item.id]));

  const orders = [
    {
      bakery_id: bakeryId,
      catalog_item_id: catalogIdByName.get("Classic sponge cake"),
      customer_name: "Nino Beridze",
      customer_contact: "+995 555 10 20 30",
      product_type: "cake",
      weight_kg: 2.5,
      shape: "round",
      filling: "vanilla cream and strawberries",
      decoration_notes: "Pastel buttercream, fresh berries on top",
      inscription: "Happy Birthday, Ana!",
      deadline_at: daysFromNow(3),
      price: 120,
      prepayment: 40,
      manager_notes: "Customer will collect at 10:00.",
      assignee_id: byRole.baker.id,
      created_by: byRole.manager.id,
      status: "accepted",
    },
    {
      bakery_id: bakeryId,
      catalog_item_id: catalogIdByName.get("Chocolate tart"),
      customer_name: "Giorgi Kapanadze",
      customer_contact: "giorgi@example.test",
      product_type: "tart",
      weight_kg: 1.2,
      shape: "round",
      filling: "dark chocolate ganache",
      decoration_notes: "Matte finish, gold leaf accent",
      deadline_at: daysFromNow(1),
      price: 75,
      prepayment: 75,
      manager_notes: "Paid in full.",
      assignee_id: byRole.baker.id,
      created_by: byRole.owner.id,
      status: "in_production",
    },
    {
      bakery_id: bakeryId,
      customer_name: "Mariam Tsiklauri",
      product_type: "cupcakes",
      size_note: "24 pieces",
      filling: "lemon curd",
      decoration_notes: "Two-tone frosting, no nuts",
      deadline_at: daysFromNow(7),
      price: 90,
      prepayment: 0,
      manager_notes: "Awaiting confirmation of the colour scheme.",
      created_by: byRole.manager.id,
      status: "draft",
    },
  ];

  const { data, error } = await admin
    .from("orders")
    .insert(orders)
    .select("id, status");
  if (error) {
    fail(`could not insert orders: ${error.message}`);
  }

  const idByStatus = new Map(data.map((row) => [row.status, row.id]));
  const inProductionOrderId = idByStatus.get("in_production");
  const acceptedOrderId = idByStatus.get("accepted");
  const checklist = [
    { title: "Bake tart base", position: 1, is_done: true },
    { title: "Prepare ganache", position: 2, is_done: true },
    { title: "Assemble and chill", position: 3, is_done: false },
    { title: "Final decoration", position: 4, is_done: false },
  ].map((item) => ({
    ...item,
    order_id: inProductionOrderId,
    bakery_id: bakeryId,
  }));

  const { error: checklistError } = await admin
    .from("production_checklist_items")
    .insert(checklist);
  if (checklistError) {
    fail(`could not insert checklist items: ${checklistError.message}`);
  }

  const { error: referenceError } = await admin
    .from("order_references")
    .insert({
      order_id: acceptedOrderId,
      bakery_id: bakeryId,
      kind: "link",
      url: "https://example.test/inspiration/pastel-berry-cake",
    });
  if (referenceError) {
    fail(`could not insert order reference: ${referenceError.message}`);
  }
}

async function main() {
  assertEnvironment();

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const members = [];
  for (const member of MEMBERS) {
    const user = await ensureUser(admin, member);
    await ensureProfile(admin, user.id, member.fullName);
    members.push({ ...member, ...user });
  }

  const byRole = Object.fromEntries(
    members.map((member) => [member.role, member]),
  );

  const bakeryId = await ensureBakery(admin, byRole.owner.id);
  await ensureMemberships(admin, bakeryId, members);
  const catalog = await ensureCatalog(admin, bakeryId);
  await ensureOrders(admin, bakeryId, catalog, byRole);

  console.log(`seed-dev: bakery "${BAKERY_NAME}" ready (${bakeryId}).`);
  for (const member of members) {
    console.log(`seed-dev:   ${member.role.padEnd(7)} ${member.email}`);
  }
  console.log("seed-dev: sign in with the password from SEED_DEV_PASSWORD.");
}

await main();
