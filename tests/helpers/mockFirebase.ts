/**
 * Import this first in any test file that imports from src/util or src/firebase
 * so Firebase app does not initialize (no window in Node).
 */
import { vi } from "vitest";
vi.mock("../../src/firebase/firebase", () => ({
  app: {},
  analytics: {},
  auth: {},
  googleProvider: {},
  db: {},
}));
