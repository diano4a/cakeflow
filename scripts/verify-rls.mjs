/**
 * RLS regression suite for CakeFlow.
 *
 * Signs in as the seeded owner/manager/baker through PostgREST so the real
 * policies run against real JWTs, and creates a throwaway second tenant to
 * prove cross-bakery isolation.
 *
 *   npm run seed:dev      # must run first
 *   npm run verify:rls
 *
 * Everything it creates is removed again, and the demo rows it touches are
 * restored, so it can be run repeatedly against the same database.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SEED_DEV_PASSWORD;
const EMAIL_DOMAIN = process.env.SEED_DEV_EMAIL_DOMAIN ?? "demo.cakeflow.test";
const ALLOW_REMOTE = process.env.SEED_ALLOW_REMOTE === "true";

const BAKERY_NAME = "Demo Bakery";
const RIVAL_BAKERY_NAME = "Rival Bakery (rls test)";
const RIVAL_LOCAL_PART = "rls-outsider";

// supabase-js builds a realtime client eagerly and needs a global WebSocket,
// which Node 20 does not provide. Only REST is used here.
class UnusedRealtimeTransport {
  constructor() {
    throw new Error("This script does not use realtime subscriptions.");
  }
}

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: UnusedRealtimeTransport },
};

let passed = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  pass  ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ""}`);
  }
}

function fail(message) {
  console.error(`verify-rls: ${message}`);
  process.exit(1);
}

function assertEnvironment() {
  if (!SUPABASE_URL) {
    fail("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required.");
  }
  if (!PUBLISHABLE_KEY) {
    fail("SUPABASE_PUBLISHABLE_KEY (or the NEXT_PUBLIC_ variant) is required.");
  }
  if (!SERVICE_ROLE_KEY) {
    fail("SUPABASE_SERVICE_ROLE_KEY is required to set up the second tenant.");
  }
  if (!PASSWORD) {
    fail("SEED_DEV_PASSWORD is required to sign in as the seeded users.");
  }

  const host = new URL(SUPABASE_URL).hostname;
  const isLocal = host === "127.0.0.1" || host === "localhost";
  if (!isLocal && !ALLOW_REMOTE) {
    fail(
      `Refusing to run against non-local host "${host}". This script writes ` +
        "data. Set SEED_ALLOW_REMOTE=true only for a development project.",
    );
  }
}

async function signIn(admin, localPart) {
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY, clientOptions);
  const email = `${localPart}@${EMAIL_DOMAIN}`;
  const { error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) {
    fail(
      `could not sign in as ${email}: ${error.message}. ` +
        "Run `npm run seed:dev` first with the same SEED_DEV_PASSWORD.",
    );
  }
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  return { client, id: data.users.find((user) => user.email === email).id };
}

async function findUserByEmail(admin, email) {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) {
    fail(`could not list users: ${error.message}`);
  }
  return data.users.find((user) => user.email === email) ?? null;
}

async function createRivalTenant(admin) {
  const email = `${RIVAL_LOCAL_PART}@${EMAIL_DOMAIN}`;

  let user = await findUserByEmail(admin, email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "RLS Test Outsider" },
    });
    if (error) {
      fail(`could not create the outsider user: ${error.message}`);
    }
    user = data.user;
  }

  const { data: existing } = await admin
    .from("bakeries")
    .select("id")
    .eq("name", RIVAL_BAKERY_NAME)
    .maybeSingle();

  let bakeryId = existing?.id;
  if (!bakeryId) {
    const { data, error } = await admin
      .from("bakeries")
      .insert({ name: RIVAL_BAKERY_NAME, owner_id: user.id })
      .select("id")
      .single();
    if (error) {
      fail(`could not create the rival bakery: ${error.message}`);
    }
    bakeryId = data.id;
  }

  await admin
    .from("bakery_members")
    .upsert(
      { bakery_id: bakeryId, user_id: user.id, role: "owner" },
      { onConflict: "bakery_id,user_id" },
    );

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      bakery_id: bakeryId,
      product_type: "cake",
      deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
      status: "accepted",
      price: 200,
    })
    .select("id")
    .single();
  if (orderError) {
    fail(`could not create the rival order: ${orderError.message}`);
  }

  return { bakeryId, orderId: order.id, userId: user.id };
}

async function removeRivalTenant(admin, rival) {
  await admin.from("bakeries").delete().eq("id", rival.bakeryId);
  await admin.auth.admin.deleteUser(rival.userId);
}

async function main() {
  assertEnvironment();

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, clientOptions);

  const owner = await signIn(admin, "owner");
  const manager = await signIn(admin, "manager");
  const baker = await signIn(admin, "baker");

  const { data: bakery, error: bakeryError } = await admin
    .from("bakeries")
    .select("id")
    .eq("name", BAKERY_NAME)
    .eq("owner_id", owner.id)
    .maybeSingle();
  if (bakeryError || !bakery) {
    fail(`demo bakery not found. Run \`npm run seed:dev\` first.`);
  }
  const bakeryId = bakery.id;

  const { data: assigned } = await admin
    .from("orders")
    .select("id, status, price, manager_notes")
    .eq("bakery_id", bakeryId)
    .eq("assignee_id", baker.id)
    .limit(1)
    .maybeSingle();
  if (!assigned) {
    fail("no order assigned to the demo baker. Re-run `npm run seed:dev`.");
  }

  const { data: unassigned } = await admin
    .from("orders")
    .select("id, status")
    .eq("bakery_id", bakeryId)
    .is("assignee_id", null)
    .limit(1)
    .maybeSingle();
  if (!unassigned) {
    fail("no unassigned order in the demo bakery. Re-run `npm run seed:dev`.");
  }

  const { data: checklistItem } = await admin
    .from("production_checklist_items")
    .select("id, is_done")
    .eq("bakery_id", bakeryId)
    .eq("is_done", false)
    .limit(1)
    .maybeSingle();
  if (!checklistItem) {
    fail("no open checklist item. Re-run `npm run seed:dev`.");
  }

  const rival = await createRivalTenant(admin);
  const anon = createClient(SUPABASE_URL, PUBLISHABLE_KEY, clientOptions);

  try {
    console.log("\nCross-bakery isolation");

    const rivalOrderRead = await baker.client
      .from("orders")
      .select("id")
      .eq("id", rival.orderId);
    check(
      "baker cannot read another bakery's order",
      (rivalOrderRead.data ?? []).length === 0,
    );

    const rivalBakeryRead = await owner.client
      .from("bakeries")
      .select("id")
      .eq("id", rival.bakeryId);
    check(
      "owner cannot read another bakery row",
      (rivalBakeryRead.data ?? []).length === 0,
    );

    const rivalMemberRead = await manager.client
      .from("bakery_members")
      .select("id")
      .eq("bakery_id", rival.bakeryId);
    check(
      "manager cannot read another bakery's members",
      (rivalMemberRead.data ?? []).length === 0,
    );

    const crossInsert = await owner.client
      .from("orders")
      .insert({
        bakery_id: rival.bakeryId,
        product_type: "cake",
        deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .select("id");
    check(
      "owner cannot insert an order into another bakery",
      crossInsert.error !== null,
      crossInsert.error?.code,
    );

    const crossUpdate = await manager.client
      .from("orders")
      .update({ price: 1 })
      .eq("id", rival.orderId)
      .select("id");
    check(
      "manager cannot update another bakery's order",
      (crossUpdate.data ?? []).length === 0,
    );

    const anonRead = await anon.from("orders").select("id");
    check(
      "anonymous client cannot read orders",
      anonRead.error !== null,
      anonRead.error?.code,
    );

    console.log("\nBaker cannot reach manager-only fields");

    const bakerPrice = await baker.client
      .from("orders")
      .update({ price: 1 })
      .eq("id", assigned.id)
      .select("id");
    check(
      "baker cannot change price on an assigned order",
      bakerPrice.error?.code === "42501",
      bakerPrice.error?.message,
    );

    const bakerNotes = await baker.client
      .from("orders")
      .update({ manager_notes: "hijacked" })
      .eq("id", assigned.id)
      .select("id");
    check(
      "baker cannot change manager_notes",
      bakerNotes.error?.code === "42501",
      bakerNotes.error?.message,
    );

    const bakerReassign = await baker.client
      .from("orders")
      .update({ assignee_id: rival.userId })
      .eq("id", assigned.id)
      .select("id");
    check(
      "baker cannot reassign an order",
      bakerReassign.error !== null || (bakerReassign.data ?? []).length === 0,
    );

    const bakerInsert = await baker.client
      .from("orders")
      .insert({
        bakery_id: bakeryId,
        product_type: "cake",
        deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .select("id");
    check(
      "baker cannot create orders",
      bakerInsert.error !== null,
      bakerInsert.error?.code,
    );

    const bakerDelete = await baker.client
      .from("orders")
      .delete()
      .eq("id", assigned.id)
      .select("id");
    check("baker cannot delete orders", (bakerDelete.data ?? []).length === 0);

    const bakerOtherOrder = await baker.client
      .from("orders")
      .update({ status: "ready" })
      .eq("id", unassigned.id)
      .select("id");
    check(
      "baker cannot update an order assigned to nobody",
      (bakerOtherOrder.data ?? []).length === 0,
    );

    const bakerSelfPromote = await baker.client
      .from("bakery_members")
      .update({ role: "owner" })
      .eq("bakery_id", bakeryId)
      .eq("user_id", baker.id)
      .select("id");
    check(
      "baker cannot promote themselves",
      (bakerSelfPromote.data ?? []).length === 0,
    );

    const managerSelfPromote = await manager.client
      .from("bakery_members")
      .update({ role: "owner" })
      .eq("bakery_id", bakeryId)
      .eq("user_id", manager.id)
      .select("id");
    check(
      "manager cannot promote themselves to owner",
      managerSelfPromote.error !== null ||
        (managerSelfPromote.data ?? []).length === 0,
      managerSelfPromote.error?.code,
    );

    console.log("\nBaker can do the permitted production work");

    const bakerStatus = await baker.client
      .from("orders")
      .update({ status: "ready" })
      .eq("id", assigned.id)
      .select("id, status");
    check(
      "baker can advance status on an assigned order",
      !bakerStatus.error && bakerStatus.data?.[0]?.status === "ready",
      bakerStatus.error?.message,
    );

    const bakerTick = await baker.client
      .from("production_checklist_items")
      .update({ is_done: true })
      .eq("id", checklistItem.id)
      .select("id, is_done");
    check(
      "baker can tick a checklist item",
      !bakerTick.error && bakerTick.data?.[0]?.is_done === true,
      bakerTick.error?.message,
    );

    const bakerOrders = await baker.client.from("orders").select("id");
    check(
      "baker can read their own bakery's orders",
      (bakerOrders.data ?? []).length > 0,
    );

    const bakerCatalog = await baker.client.from("catalog_items").select("id");
    check(
      "baker can read the catalog",
      (bakerCatalog.data ?? []).length > 0,
    );

    const bakerOptions = await baker.client.from("catalog_options").select("id, is_active");
    check(
      "baker can read catalog options",
      (bakerOptions.data ?? []).length > 0,
    );

    const bakerInsertOption = await baker.client
      .from("catalog_options")
      .insert({
        bakery_id: bakeryId,
        kind: "filling",
        name: "RLS baker should not add this",
      })
      .select("id");
    check(
      "baker cannot add a catalog option",
      bakerInsertOption.error !== null,
      bakerInsertOption.error?.code,
    );

    const productWithoutMode = await manager.client
      .from("catalog_options")
      .insert({
        bakery_id: bakeryId,
        kind: "product_type",
        name: "RLS product without mode",
      })
      .select("id");
    check(
      "product type requires a measurement mode",
      productWithoutMode.error !== null,
      productWithoutMode.error?.code,
    );

    const managerOption = await manager.client
      .from("catalog_options")
      .insert({
        bakery_id: bakeryId,
        kind: "filling",
        name: "RLS manager temp filling",
      })
      .select("id, is_active, name")
      .single();
    check(
      "manager can add a catalog option",
      !managerOption.error && managerOption.data?.is_active === true,
      managerOption.error?.message,
    );

    if (managerOption.data?.id) {
      const deactivated = await manager.client
        .from("catalog_options")
        .update({ is_active: false })
        .eq("id", managerOption.data.id)
        .select("id, is_active")
        .single();
      check(
        "manager can deactivate a catalog option",
        deactivated.data?.is_active === false,
        deactivated.error?.message,
      );

      const activeOnly = await baker.client
        .from("catalog_options")
        .select("id, name")
        .eq("is_active", true);
      check(
        "deactivated options are excluded from the active list",
        !(activeOnly.data ?? []).some((row) => row.id === managerOption.data.id),
      );

      const stillVisible = await baker.client
        .from("catalog_options")
        .select("id, name")
        .eq("id", managerOption.data.id);
      check(
        "deactivated options remain readable so existing orders are not broken",
        (stillVisible.data ?? []).length === 1,
      );

      await admin.from("catalog_options").delete().eq("id", managerOption.data.id);
    }

    const rivalOption = await admin
      .from("catalog_options")
      .insert({
        bakery_id: rival.bakeryId,
        kind: "product_type",
        name: "Rival cake",
        measurement_mode: "size_and_weight",
      })
      .select("id")
      .single();
    const bakerSeesRivalOption = await baker.client
      .from("catalog_options")
      .select("id")
      .eq("id", rivalOption.data?.id ?? "00000000-0000-0000-0000-000000000000");
    check(
      "baker cannot read another bakery's catalog options",
      (bakerSeesRivalOption.data ?? []).length === 0,
    );

    const rivalCatalogInsert = await owner.client.from("catalog_options").insert({
      bakery_id: rival.bakeryId,
      kind: "product_type",
      name: "Stolen type",
      measurement_mode: "quantity",
    });
    check(
      "owner cannot write another bakery's catalog",
      rivalCatalogInsert.error !== null,
      rivalCatalogInsert.error?.code,
    );

    const rivalCatalogUpdate = await owner.client
      .from("catalog_options")
      .update({ name: "Hijacked cake" })
      .eq("id", rivalOption.data?.id ?? "00000000-0000-0000-0000-000000000000")
      .select("id");
    check(
      "owner cannot update another bakery's catalog option",
      (rivalCatalogUpdate.data ?? []).length === 0,
    );

    const rivalFilling = await admin
      .from("catalog_options")
      .insert({
        bakery_id: rival.bakeryId,
        kind: "filling",
        name: "Rival filling",
      })
      .select("id")
      .single();
    const ownFilling = await admin
      .from("catalog_options")
      .select("id")
      .eq("bakery_id", bakeryId)
      .eq("kind", "filling")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const crossFilling = await manager.client.from("order_fillings").insert({
      bakery_id: bakeryId,
      order_id: assigned.id,
      catalog_option_id: rivalFilling.data?.id,
    });
    check(
      "manager cannot attach another bakery's filling to an order",
      crossFilling.error !== null,
      crossFilling.error?.code,
    );

    const bakerAddsFilling = await baker.client.from("order_fillings").insert({
      bakery_id: bakeryId,
      order_id: assigned.id,
      catalog_option_id: ownFilling.data?.id,
    });
    check(
      "baker cannot add an order filling",
      bakerAddsFilling.error !== null,
      bakerAddsFilling.error?.code,
    );

    const bakerFillings = await baker.client
      .from("order_fillings")
      .select("id")
      .eq("bakery_id", bakeryId);
    check(
      "baker can read this bakery's order fillings",
      !bakerFillings.error,
      bakerFillings.error?.message,
    );

    const bakerSeesRivalFillings = await baker.client
      .from("order_fillings")
      .select("id")
      .eq("bakery_id", rival.bakeryId);
    check(
      "baker cannot read another bakery's order fillings",
      (bakerSeesRivalFillings.data ?? []).length === 0,
    );

    const ownProductType = await admin
      .from("catalog_options")
      .select("id")
      .eq("bakery_id", bakeryId)
      .eq("kind", "product_type")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    const productAsFilling = await manager.client.from("order_fillings").insert({
      bakery_id: bakeryId,
      order_id: assigned.id,
      catalog_option_id: ownProductType.data?.id,
    });
    check(
      "manager cannot attach a non-filling catalog option to an order",
      productAsFilling.error !== null,
      productAsFilling.error?.code,
    );

    const cakeType = await admin
      .from("catalog_options")
      .select("id")
      .eq("bakery_id", bakeryId)
      .eq("kind", "product_type")
      .eq("name", "Cake")
      .maybeSingle();
    const pistachio = await admin
      .from("catalog_options")
      .select("id")
      .eq("bakery_id", bakeryId)
      .eq("kind", "filling")
      .eq("name", "Pistachio")
      .maybeSingle();
    const vanilla = await admin
      .from("catalog_options")
      .select("id")
      .eq("bakery_id", bakeryId)
      .eq("kind", "filling")
      .eq("name", "Vanilla")
      .maybeSingle();

    const cakeFillings = await baker.client
      .from("product_type_fillings")
      .select("filling_id")
      .eq("product_type_id", cakeType.data?.id ?? "00000000-0000-0000-0000-000000000000");
    check(
      "one product type can have multiple fillings",
      (cakeFillings.data ?? []).length >= 2,
    );

    const pistachioProducts = await baker.client
      .from("product_type_fillings")
      .select("product_type_id")
      .eq("filling_id", pistachio.data?.id ?? "00000000-0000-0000-0000-000000000000");
    check(
      "one filling can belong to multiple product types",
      (pistachioProducts.data ?? []).length >= 2,
    );

    const bakerAddsCompatibility = await baker.client.from("product_type_fillings").insert({
      bakery_id: bakeryId,
      product_type_id: cakeType.data?.id,
      filling_id: vanilla.data?.id,
    });
    check(
      "baker cannot add product-type filling compatibility",
      bakerAddsCompatibility.error !== null,
      bakerAddsCompatibility.error?.code,
    );

    const bakerReadsCompatibility = await baker.client
      .from("product_type_fillings")
      .select("id")
      .eq("bakery_id", bakeryId);
    check(
      "baker can read this bakery's filling compatibility",
      !bakerReadsCompatibility.error && (bakerReadsCompatibility.data ?? []).length > 0,
      bakerReadsCompatibility.error?.message,
    );

    const bakerSeesRivalCompatibility = await baker.client
      .from("product_type_fillings")
      .select("id")
      .eq("bakery_id", rival.bakeryId);
    check(
      "baker cannot read another bakery's filling compatibility",
      (bakerSeesRivalCompatibility.data ?? []).length === 0,
    );

    const crossCompatibility = await manager.client.from("product_type_fillings").insert({
      bakery_id: bakeryId,
      product_type_id: cakeType.data?.id,
      filling_id: rivalFilling.data?.id,
    });
    check(
      "manager cannot link another bakery's filling to a product type",
      crossCompatibility.error !== null,
      crossCompatibility.error?.code,
    );

    const crossProductType = await manager.client.from("product_type_fillings").insert({
      bakery_id: bakeryId,
      product_type_id: rivalOption.data?.id,
      filling_id: vanilla.data?.id,
    });
    check(
      "manager cannot use another bakery's product type in compatibility",
      crossProductType.error !== null,
      crossProductType.error?.code,
    );

    const assignedOrder = await admin
      .from("orders")
      .select("id, product_type")
      .eq("id", assigned.id)
      .single();
    const incompatibleFilling = await manager.client.from("order_fillings").insert({
      bakery_id: bakeryId,
      order_id: assigned.id,
      catalog_option_id: vanilla.data?.id,
    });
    check(
      "manager cannot attach a filling that is not compatible with the product type",
      incompatibleFilling.error !== null && assignedOrder.data?.product_type === "Cake",
      incompatibleFilling.error?.code,
    );

    const renameProduct = await manager.client
      .from("catalog_options")
      .insert({
        bakery_id: bakeryId,
        kind: "product_type",
        name: "RLS rename cake",
        measurement_mode: "size_and_weight",
      })
      .select("id")
      .single();
    const renameFilling = await manager.client
      .from("catalog_options")
      .insert({
        bakery_id: bakeryId,
        kind: "filling",
        name: "RLS rename filling",
      })
      .select("id")
      .single();
    if (renameProduct.data?.id && renameFilling.data?.id) {
      await manager.client.from("product_type_fillings").insert({
        bakery_id: bakeryId,
        product_type_id: renameProduct.data.id,
        filling_id: renameFilling.data.id,
      });
      await manager.client
        .from("catalog_options")
        .update({ name: "RLS renamed cake" })
        .eq("id", renameProduct.data.id);
      const renamedLinks = await manager.client
        .from("product_type_fillings")
        .select("id")
        .eq("product_type_id", renameProduct.data.id)
        .eq("filling_id", renameFilling.data.id);
      check(
        "rename of a product type does not drop filling compatibility",
        (renamedLinks.data ?? []).length === 1,
      );

      const renamedOrder = await manager.client
        .from("orders")
        .insert({
          bakery_id: bakeryId,
          product_type: "RLS renamed cake",
          deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .select("id")
        .single();
      const renamedAttach = renamedOrder.data?.id
        ? await manager.client.from("order_fillings").insert({
            bakery_id: bakeryId,
            order_id: renamedOrder.data.id,
            catalog_option_id: renameFilling.data.id,
          })
        : { error: { message: "missing order" } };
      check(
        "renamed product type still accepts its assigned fillings",
        renamedAttach.error == null,
        renamedAttach.error?.message,
      );
      if (renamedOrder.data?.id) {
        await admin.from("orders").delete().eq("id", renamedOrder.data.id);
      }
      await admin.from("catalog_options").delete().eq("id", renameFilling.data.id);
      await admin.from("catalog_options").delete().eq("id", renameProduct.data.id);
    }

    if (rivalFilling.data?.id) {
      await admin.from("catalog_options").delete().eq("id", rivalFilling.data.id);
    }
    if (rivalOption.data?.id) {
      await admin.from("catalog_options").delete().eq("id", rivalOption.data.id);
    }

    console.log("\nOrder reference storage");

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJTU5ErkJggg==",
      "base64",
    );
    const ownPath = `${bakeryId}/${assigned.id}/${crypto.randomUUID()}.png`;
    const rivalPath = `${rival.bakeryId}/${rival.orderId}/${crypto.randomUUID()}.png`;

    const managerUpload = await manager.client.storage
      .from("order-references")
      .upload(ownPath, png, { contentType: "image/png", upsert: false });
    check(
      "manager can upload a reference image",
      !managerUpload.error,
      managerUpload.error?.message,
    );

    if (!managerUpload.error) {
      const { error: rowError } = await manager.client.from("order_references").insert({
        bakery_id: bakeryId,
        order_id: assigned.id,
        kind: "image",
        storage_path: ownPath,
      });
      check(
        "manager can attach a reference row to an order",
        !rowError,
        rowError?.message,
      );
    }

    const bakerUpload = await baker.client.storage
      .from("order-references")
      .upload(`${bakeryId}/${assigned.id}/${crypto.randomUUID()}.png`, png, {
        contentType: "image/png",
        upsert: false,
      });
    check(
      "baker cannot upload a reference image",
      bakerUpload.error !== null,
      bakerUpload.error?.message,
    );

    const bakerRead = await baker.client.storage
      .from("order-references")
      .download(ownPath);
    check(
      "baker can read this bakery's reference image",
      bakerRead.error == null,
      bakerRead.error?.message,
    );

    const adminRivalUpload = await admin.storage
      .from("order-references")
      .upload(rivalPath, png, { contentType: "image/png", upsert: false });
    if (adminRivalUpload.error) {
      fail(`could not seed a rival reference object: ${adminRivalUpload.error.message}`);
    }

    const crossRead = await baker.client.storage
      .from("order-references")
      .download(rivalPath);
    check(
      "baker cannot read another bakery's reference image",
      crossRead.error !== null,
      crossRead.error?.message,
    );

    const crossUpload = await manager.client.storage
      .from("order-references")
      .upload(
        `${rival.bakeryId}/${rival.orderId}/${crypto.randomUUID()}.png`,
        png,
        { contentType: "image/png", upsert: false },
      );
    check(
      "manager cannot upload into another bakery's folder",
      crossUpload.error !== null,
      crossUpload.error?.message,
    );

    const bakerDeletesObject = await baker.client.storage
      .from("order-references")
      .remove([ownPath]);
    const bakerStillHasFile = await baker.client.storage
      .from("order-references")
      .download(ownPath);
    check(
      "baker cannot delete a reference image",
      bakerStillHasFile.error == null,
      bakerDeletesObject.error?.message ?? bakerStillHasFile.error?.message,
    );

    const bakerDeletesRow = await baker.client
      .from("order_references")
      .delete()
      .eq("storage_path", ownPath)
      .select("id");
    check(
      "baker cannot delete a reference row",
      (bakerDeletesRow.data ?? []).length === 0,
      bakerDeletesRow.error?.message,
    );

    await admin.storage.from("order-references").remove([ownPath, rivalPath]);
    await admin.from("order_references").delete().eq("storage_path", ownPath);

    const teammates = await baker.client.from("profiles").select("id");
    check(
      "baker sees only teammate profiles, not the outsider",
      !(teammates.data ?? []).some((row) => row.id === rival.userId),
    );

    console.log("\nManager keeps their own privileges");

    const managerPrice = await manager.client
      .from("orders")
      .update({ price: 131 })
      .eq("id", assigned.id)
      .select("id, price");
    check(
      "manager can change price",
      !managerPrice.error && Number(managerPrice.data?.[0]?.price) === 131,
      managerPrice.error?.message,
    );

    const managerAddsBaker = await manager.client
      .from("bakery_members")
      .insert({ bakery_id: bakeryId, user_id: rival.userId, role: "baker" })
      .select("id");
    check(
      "manager can add a baker",
      !managerAddsBaker.error,
      managerAddsBaker.error?.message,
    );
    if (managerAddsBaker.data?.[0]?.id) {
      await admin
        .from("bakery_members")
        .delete()
        .eq("id", managerAddsBaker.data[0].id);
    }

    console.log("\nDraft deletion is bakery-scoped and draft-only");

    const pngDraft = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJTU5ErkJggg==",
      "base64",
    );

    const { data: draftOrder, error: draftOrderError } = await admin
      .from("orders")
      .insert({
        bakery_id: bakeryId,
        product_type: "Bento",
        deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
        status: "draft",
      })
      .select("id")
      .single();
    if (draftOrderError || !draftOrder) {
      fail(`could not create a draft for deletion tests: ${draftOrderError?.message}`);
    }

    const draftPath = `${bakeryId}/${draftOrder.id}/${crypto.randomUUID()}.png`;
    const draftUpload = await manager.client.storage
      .from("order-references")
      .upload(draftPath, pngDraft, { contentType: "image/png", upsert: false });
    if (draftUpload.error) {
      fail(`could not upload a draft reference: ${draftUpload.error.message}`);
    }
    const { error: draftRefError } = await manager.client.from("order_references").insert({
      bakery_id: bakeryId,
      order_id: draftOrder.id,
      kind: "image",
      storage_path: draftPath,
    });
    if (draftRefError) {
      fail(`could not attach a draft reference: ${draftRefError.message}`);
    }

    const bakerDeletesDraft = await baker.client
      .from("orders")
      .delete()
      .eq("id", draftOrder.id)
      .select("id");
    check(
      "baker cannot delete a draft",
      (bakerDeletesDraft.data ?? []).length === 0,
      bakerDeletesDraft.error?.message,
    );

    const { data: submittedOrder, error: submittedOrderError } = await admin
      .from("orders")
      .insert({
        bakery_id: bakeryId,
        product_type: "Cake",
        deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
        status: "submitted",
      })
      .select("id")
      .single();
    if (submittedOrderError || !submittedOrder) {
      fail(`could not create a submitted order: ${submittedOrderError?.message}`);
    }

    const managerDeletesSubmitted = await manager.client
      .from("orders")
      .delete()
      .eq("id", submittedOrder.id)
      .select("id");
    check(
      "manager cannot hard-delete a submitted order",
      (managerDeletesSubmitted.data ?? []).length === 0,
      managerDeletesSubmitted.error?.message,
    );

    const { data: rivalDraft, error: rivalDraftError } = await admin
      .from("orders")
      .insert({
        bakery_id: rival.bakeryId,
        product_type: "Cake",
        deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
        status: "draft",
      })
      .select("id")
      .single();
    if (rivalDraftError || !rivalDraft) {
      fail(`could not create a rival draft: ${rivalDraftError?.message}`);
    }

    const managerDeletesRivalDraft = await manager.client
      .from("orders")
      .delete()
      .eq("id", rivalDraft.id)
      .select("id");
    check(
      "manager cannot delete another bakery's draft",
      (managerDeletesRivalDraft.data ?? []).length === 0,
      managerDeletesRivalDraft.error?.message,
    );

    const forgedDelete = await manager.client
      .from("orders")
      .delete()
      .eq("id", "00000000-0000-4000-8000-000000000000")
      .select("id");
    check(
      "forged order id deletes nothing",
      (forgedDelete.data ?? []).length === 0,
    );

    const { data: ownerDraft, error: ownerDraftError } = await admin
      .from("orders")
      .insert({
        bakery_id: bakeryId,
        product_type: "Cupcakes",
        deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
        status: "draft",
      })
      .select("id")
      .single();
    if (ownerDraftError || !ownerDraft) {
      fail(`could not create an owner draft: ${ownerDraftError?.message}`);
    }

    const ownerDeletesDraft = await owner.client
      .from("orders")
      .delete()
      .eq("id", ownerDraft.id)
      .select("id");
    check(
      "owner can delete a draft",
      !ownerDeletesDraft.error && ownerDeletesDraft.data?.[0]?.id === ownerDraft.id,
      ownerDeletesDraft.error?.message,
    );

    const storageRemove = await manager.client.storage
      .from("order-references")
      .remove([draftPath]);
    check(
      "manager can delete draft reference storage",
      !storageRemove.error,
      storageRemove.error?.message,
    );

    const managerDeletesDraft = await manager.client
      .from("orders")
      .delete()
      .eq("id", draftOrder.id)
      .select("id");
    check(
      "manager can delete a draft",
      !managerDeletesDraft.error &&
        managerDeletesDraft.data?.[0]?.id === draftOrder.id,
      managerDeletesDraft.error?.message,
    );

    const leftoverFile = await admin.storage.from("order-references").download(draftPath);
    check(
      "draft deletion leaves no reference storage object",
      leftoverFile.error != null,
      leftoverFile.error?.message,
    );

    const leftoverRow = await admin
      .from("order_references")
      .select("id")
      .eq("storage_path", draftPath);
    check(
      "draft deletion leaves no reference row",
      (leftoverRow.data ?? []).length === 0,
    );

    await admin.from("orders").delete().eq("id", submittedOrder.id);
    await admin.from("orders").delete().eq("id", rivalDraft.id);
    await admin.from("orders").delete().eq("id", draftOrder.id);
    await admin.storage.from("order-references").remove([draftPath]);
  } finally {
    // Restore the demo rows this script mutated, then drop the second tenant.
    await admin
      .from("orders")
      .update({
        status: assigned.status,
        price: assigned.price,
        manager_notes: assigned.manager_notes,
      })
      .eq("id", assigned.id);
    await admin
      .from("production_checklist_items")
      .update({ is_done: checklistItem.is_done })
      .eq("id", checklistItem.id);
    await removeRivalTenant(admin, rival);
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    for (const name of failures) {
      console.log(`  failed: ${name}`);
    }
    process.exit(1);
  }
}

await main();
