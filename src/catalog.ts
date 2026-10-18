import type { NormalizedBuildSystemPromptOptions, Skill } from "@earendil-works/pi-coding-agent";

export type SkillEntry = Pick<Skill, "name" | "description" | "filePath">;
type SkillPrompt = Pick<NormalizedBuildSystemPromptOptions, "skills" | "sections">;

const DISCOVERY_HINT =
  "Before specialized work, discover the skill_catalog tool and list available skills; read only relevant skill files. Do not load the catalog for simple conversation.";

export class SkillCatalog {
  private skills: SkillEntry[] = [];

  refresh(options: SkillPrompt, discoveryAvailable: boolean): void {
    this.skills = options.skills
      .filter((skill) => !skill.disableModelInvocation)
      .map(({ name, description, filePath }) => ({ name, description, filePath }));

    if (!discoveryAvailable) {
      delete options.sections.skill_discovery;
      return;
    }

    options.skills = [];
    if (this.skills.length > 0) {
      options.sections.skill_discovery = DISCOVERY_HINT;
    } else {
      delete options.sections.skill_discovery;
    }
  }

  list(): SkillEntry[] {
    return this.skills.map((skill) => ({ ...skill }));
  }

  clear(): void {
    this.skills = [];
  }
}
