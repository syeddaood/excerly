import { PACKAGE_NAME } from "@dawnlock/shared";
import { NextResponse } from "next/server";

/** Health smoke endpoint for the monorepo foundation. */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "@dawnlock/api",
    shared: PACKAGE_NAME,
  });
}
