import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BlockReason } from "../../domain-contracts/src/contracts.js";

export const canonicalPolicyPaths = [
  ["SYSTEM_CONSTITUTION.md", 1], ["ARCHITECTURE.md", 2], ["DEPARTMENTS.md", 3],
  ["EXECUTIVE_BOARD_LOADER.md", 4], ["runtime/CONSTITUTION_LOADER.md", 5],
  ["runtime/EXECUTIVE_BOARD_LOADER.md", 5], ["runtime/COGNITIVE_ENGINES_LOADER.md", 5],
  ["runtime/BOOT_SEQUENCE.md", 5], ["runtime/WORKFLOW_ENGINE.md", 5],
  ["runtime/QUALITY_GATE.md", 5], ["runtime/REPORT_GENERATOR.md", 5], ["runtime/SYSTEM_BOOT_PROMPT.md", 5],
  ...[2,3,4,5,6,7,8,9,10].map(n => [`CONSTITUTION_CH${String(n).padStart(2, "0")}_${({2:"GOVERNANCE",3:"EXECUTIVE_BOARD",4:"COGNITIVE_ENGINES",5:"DEPARTMENTS",6:"MEMORY_SYSTEM",7:"KNOWLEDGE_SYSTEM",8:"DECISION_SYSTEM",9:"EXECUTION_SYSTEM",10:"SAAS_RUNTIME"})[n]}.md`, 1])
];

const placeholder = content => /Drafting Pending|Status:\s*\n?Drafting\b/i.test(content);
const field = (content, name) => content.match(new RegExp(`${name}:\\s*([^\\n]+)`, "i"))?.[1]?.trim();

export class PolicyLoader {
  constructor(rootDir) { this.rootDir = rootDir; }
  async load() {
    const policies = [], blockers = [], conflicts = [];
    for (const [document_path, authority_rank] of canonicalPolicyPaths) {
      try {
        const content = await readFile(join(this.rootDir, document_path), "utf8");
        policies.push({ id: randomUUID(), document_path, document_hash: createHash("sha256").update(content).digest("hex"), declared_version: field(content, "Version"), declared_status: field(content, "Status"), authority_rank, immutable: true });
        if (placeholder(content) && document_path.startsWith("CONSTITUTION_CH")) blockers.push(`${BlockReason.MISSING_POLICY}:${document_path}`);
      } catch { blockers.push(`${BlockReason.MISSING_POLICY}:${document_path}`); }
    }
    const constitution = policies.find(p => p.document_path === "SYSTEM_CONSTITUTION.md");
    const prompt = policies.find(p => p.document_path === "runtime/SYSTEM_BOOT_PROMPT.md");
    if (constitution && prompt) {
      const rootPrompt = await this.#optional("SYSTEM_PROMPT.md");
      if (rootPrompt?.includes("considered the Constitution")) conflicts.push("SYSTEM_PROMPT_CONSTITUTIONAL_AUTHORITY_CONFLICT");
      const quality = await this.#optional("runtime/QUALITY_GATE.md");
      const constitutionContent = await this.#optional("SYSTEM_CONSTITUTION.md");
      if (quality?.includes("HIGH CONFIDENCE") && constitutionContent?.includes("Estimated")) conflicts.push("CONFIDENCE_TAXONOMY_CONFLICT");
    }
    return { id: randomUUID(), policies, blockers, conflicts, status: conflicts.length ? BlockReason.POLICY_CONFLICT : blockers.length ? BlockReason.MISSING_POLICY : "ACTIVE" };
  }
  async #optional(path) { try { return await readFile(join(this.rootDir, path), "utf8"); } catch { return undefined; } }
}

