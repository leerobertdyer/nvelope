/**
 * Migration: Copy each user's data from users/{userId} into the new multi-budget model.
 *
 * For each document in users/, this script:
 * 1. Creates budgets/{budgetId} with ownerId, memberIds = [userId], name = "My Budget"
 * 2. Creates budgets/{budgetId}/data/main with the same fields as the user doc
 * 3. Creates users/{userId}/budgets/{budgetId} with { name, budgetId } so the app can list budgets
 *
 * It does NOT delete or modify the existing users/ documents. You can remove them manually
 * in Firebase Console after confirming the new setup works.
 *
 * Prerequisites:
 * - Firebase Admin SDK service account key for your nvelope Firebase project.
 * - Set GOOGLE_APPLICATION_CREDENTIALS to the path to the key JSON, or run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=./path-to-key.json node scripts/migrate-to-budgets.mjs
 *
 * Install dependency first: npm install firebase-admin (add as devDependency if needed)
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin. Prefer env var; fallback to nvelope project key in repo (gitignored).
const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  join(__dirname, "..", "nvelope-firebase-admin-key.json");
let key;
try {
  key = JSON.parse(readFileSync(keyPath, "utf8"));
} catch (e) {
  console.error(
    "Failed to load service account key. Set GOOGLE_APPLICATION_CREDENTIALS or add nvelope-firebase-admin-key.json to the nvelope repo root (gitignored)."
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(key) });
}

const db = admin.firestore();
const BUDGET_DATA_DOC_ID = "main";
const DEFAULT_BUDGET_NAME = "My Budget";

function toFirestoreValue(v) {
  if (v === undefined) return null;
  if (v && typeof v.toDate === "function") return v; // Timestamp
  if (Array.isArray(v)) return v.map(toFirestoreValue);
  if (v !== null && typeof v === "object") {
    const out = {};
    for (const key of Object.keys(v)) out[key] = toFirestoreValue(v[key]);
    return out;
  }
  return v;
}

async function migrate() {
  const usersSnap = await db.collection("users").get();
  console.log(`Found ${usersSnap.size} user(s) to migrate.`);

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const data = userDoc.data();

    // Skip if this user already has a budget (idempotent: re-run safe)
    const existingBudgets = await db.collection("users").doc(userId).collection("budgets").get();
    if (existingBudgets.size > 0) {
      console.log(`User ${userId} already has budgets, skipping.`);
      continue;
    }

    const budgetId = db.collection("budgets").doc().id;
    const budgetRef = db.collection("budgets").doc(budgetId);
    const dataRef = budgetRef.collection("data").doc(BUDGET_DATA_DOC_ID);
    const userBudgetRef = db.collection("users").doc(userId).collection("budgets").doc(budgetId);

    const budgetMeta = {
      name: DEFAULT_BUDGET_NAME,
      ownerId: userId,
      memberIds: [userId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const budgetData = {
      envelopes: data.envelopes ?? [],
      payments: data.payments ?? [],
      income: data.income ?? 0,
      payDate: data.payDate ?? null,
      payPeriodInterval: data.payPeriodInterval ?? "MONTHLY",
      totalSpendingBudget: data.totalSpendingBudget ?? 0,
      oneTimeCash: data.oneTimeCash ?? null,
      resetBudgetTimestamp: data.resetBudgetTimestamp ?? null,
      snowball: data.snowball ?? 0,
      snowballTargetPaymentId: data.snowballTargetPaymentId ?? null,
      isNewUser: data.isNewUser ?? false,
      backups: data.backups ?? null,
    };

    const userBudgetDoc = {
      name: DEFAULT_BUDGET_NAME,
      budgetId,
    };

    await db.runTransaction(async (tx) => {
      tx.set(budgetRef, budgetMeta);
      tx.set(dataRef, toFirestoreValue(budgetData));
      tx.set(userBudgetRef, userBudgetDoc);
    });

    console.log(`Migrated user ${userId} -> budget ${budgetId}.`);
  }

  console.log("Migration complete. Old users/ documents were left unchanged.");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
