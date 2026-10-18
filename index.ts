import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { SkillCatalog } from "./src/catalog.ts";

const TOOL_NAME = "skill_catalog";
const CATALOG_SCHEMA = Type.Object({
  skills: Type.Array(Type.Object({
    name: Type.String(),
    description: Type.String(),
    filePath: Type.String(),
  })),
});

export default function skillDiscovery(pi: ExtensionAPI): void {
  const catalog = new SkillCatalog();

  pi.registerTool({
    name: TOOL_NAME,
    label: "Skill catalog",
    description: "List available skills with names, descriptions, and file paths. Discover specialized guidance on demand; this does not load skill bodies.",
    exposure: "deferred",
    namespace: { name: "skills", description: "Discover task-specific instructions." },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    parameters: Type.Object({}),
    outputSchema: CATALOG_SCHEMA,
    async execute() {
      const result = { skills: catalog.list() };
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
        details: { count: result.skills.length },
      };
    },
  });

  pi.on("before_agent_start", (event) => {
    const active = pi.getActiveTools();
    const hasRoute = active.some((name) =>
      name === "codemode" || name === "tool_search" || name === TOOL_NAME,
    );
    const registered = pi.getAllTools().some((tool) =>
      tool.name === TOOL_NAME && tool.exposure !== "hidden",
    );
    catalog.refresh(event.systemPromptOptions, hasRoute && registered);
  });

  pi.on("session_start", () => catalog.clear());
  pi.on("session_shutdown", () => catalog.clear());
}
