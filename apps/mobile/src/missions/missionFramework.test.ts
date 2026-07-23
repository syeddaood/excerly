import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MissionConfig } from "@dawnlock/shared";
import {
  BaseMission,
  ComponentBackedMission,
  createMission,
  getMissionType,
  listMissionTypes,
  registerMissionType,
  resolveMissionComponent,
  type Mission,
  type MissionContext,
  type MissionTypeDescriptor,
} from "./missionFramework";

function makeContext(): MissionContext & {
  completeCalls: number;
  failCalls: number;
} {
  const ctx = {
    completeCalls: 0,
    failCalls: 0,
    onComplete: () => {
      ctx.completeCalls += 1;
    },
    onFail: () => {
      ctx.failCalls += 1;
    },
  };
  return ctx;
}

class TestMission extends BaseMission {
  readonly maxAttempts = 3;
  didStart = false;

  protected onStart(): void {
    this.didStart = true;
  }
}

describe("Mission interface + BaseMission", () => {
  it("implements start() and onResult(success)", () => {
    const ctx = makeContext();
    const mission: Mission = new TestMission(ctx);

    assert.equal(typeof mission.start, "function");
    assert.equal(typeof mission.onResult, "function");

    mission.start();
    assert.equal((mission as TestMission).didStart, true);

    mission.onResult(true);
    assert.equal(ctx.completeCalls, 1);
  });

  it("onResult(false) tracks attempts and calls onFail at maxAttempts", () => {
    const ctx = makeContext();
    const mission = new TestMission(ctx);

    mission.start();
    mission.onResult(false);
    mission.onResult(false);
    assert.equal(ctx.failCalls, 0);
    mission.onResult(false);
    assert.equal(ctx.failCalls, 1);
    assert.equal(ctx.completeCalls, 0);
  });

  it("start() is idempotent", () => {
    const ctx = makeContext();
    const mission = new TestMission(ctx);
    mission.start();
    mission.start();
    assert.equal((mission as TestMission).didStart, true);
  });
});

describe("ComponentBackedMission", () => {
  it("routes onResult(true) to onComplete", () => {
    const ctx = makeContext();
    const mission = new ComponentBackedMission(ctx, { maxAttempts: 2 });
    mission.start();
    mission.onResult(true);
    assert.equal(ctx.completeCalls, 1);
  });
});

describe("mission registry framework", () => {
  const kind = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const FakeComponent = () => null;

  it("registerMissionType + createMission + resolveMissionComponent", () => {
    const descriptor: MissionTypeDescriptor = {
      kind,
      label: "Test mission",
      create: (_config, context) => new ComponentBackedMission(context),
      Component: FakeComponent,
    };

    registerMissionType(descriptor);

    assert.equal(getMissionType(kind), descriptor);
    assert.ok(listMissionTypes().some((t) => t.kind === kind));
    assert.equal(resolveMissionComponent(kind), FakeComponent);

    const ctx = makeContext();
    // MissionConfig is currently only math; cast for registry isolation test.
    const mission = createMission({ kind } as unknown as MissionConfig, ctx);
    assert.ok(mission);
    mission!.start();
    mission!.onResult(true);
    assert.equal(ctx.completeCalls, 1);
  });

  it("createMission returns null for unknown kinds", () => {
    const ctx = makeContext();
    const mission = createMission(
      { kind: "does_not_exist_xyz" } as unknown as MissionConfig,
      ctx
    );
    assert.equal(mission, null);
  });

  it("rejects duplicate registration", () => {
    assert.throws(
      () =>
        registerMissionType({
          kind,
          label: "dup",
          create: (_c, ctx) => new ComponentBackedMission(ctx),
          Component: FakeComponent,
        }),
      /already registered/
    );
  });
});
