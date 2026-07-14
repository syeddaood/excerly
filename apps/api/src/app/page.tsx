import { PACKAGE_NAME } from "@dawnlock/shared";

/** Tiny smoke placeholder — no feature UI (issue #17). */
export default function HomePage() {
  return (
    <main>
      <h1>DawnLock API</h1>
      <p>Smoke placeholder. Shared package: {PACKAGE_NAME}</p>
    </main>
  );
}
