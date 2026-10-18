import assert from "node:assert/strict";
import { test } from "node:test";
import type { Skill } from "@earendil-works/pi-coding-agent";
import { SkillCatalog } from "../src/catalog.ts";

function skill(name: string, manual = false): Skill {
  const baseDir = `/skills/${name}`;
  return {
    name, description: `Guidance for ${name}`, baseDir,
    filePath: `${baseDir}/SKILL.md`,
    sourceInfo: { path: baseDir, source: "test", scope: "user", origin: "top-level" },
    disableModelInvocation: manual,
  };
}

function prompt(skills: Skill[]) {
  return { skills, sections: { custom: "Keep these user instructions." } };
}

test("defers metadata without filtering by an assumed role", () => {
  const catalog = new SkillCatalog();
  const options = prompt(["qa", "development", "research", "jobs"].map((name) => skill(name)));
  const original = [...options.skills];
  catalog.refresh(options, true);
  assert.deepEqual(options.skills, []);
  assert.deepEqual(catalog.list().map((entry) => entry.name), original.map((entry) => entry.name));
  assert.equal(options.sections.custom, "Keep these user instructions.");
  assert.equal(original.length, 4);
});

test("manual-only skills remain excluded from automatic discovery", () => {
  const catalog = new SkillCatalog();
  catalog.refresh(prompt([skill("public"), skill("manual", true)]), true);
  assert.deepEqual(catalog.list().map((entry) => entry.name), ["public"]);
});

test("keeps the normal catalog when no discovery route is available", () => {
  const catalog = new SkillCatalog();
  const options = prompt([skill("qa")]);
  const original = options.skills;
  catalog.refresh(options, false);
  assert.equal(options.skills, original);
  assert(!("skill_discovery" in options.sections));
});

test("refresh replaces stale workspace metadata and clears the empty hint", () => {
  const catalog = new SkillCatalog();
  const options = prompt([skill("old-project")]);
  catalog.refresh(options, true);
  catalog.refresh(prompt([skill("new-project")]), true);
  assert.deepEqual(catalog.list().map((entry) => entry.name), ["new-project"]);
  catalog.refresh(options, true);
  assert.deepEqual(catalog.list(), []);
  assert(!("skill_discovery" in options.sections));
});

test("callers cannot mutate stored metadata and session reset clears it", () => {
  const catalog = new SkillCatalog();
  catalog.refresh(prompt([skill("qa")]), true);
  const listed = catalog.list();
  listed[0].name = "tampered";
  assert.equal(catalog.list()[0].name, "qa");
  catalog.clear();
  assert.deepEqual(catalog.list(), []);
});
