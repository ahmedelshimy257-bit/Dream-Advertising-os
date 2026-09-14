import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PolicyLoader, canonicalPolicyPaths } from "../../policy-loader/src/policy-loader.js";
import { RuntimeStore, transitions } from "../../workflow-runtime/src/runtime.js";
import { ApprovalRequirement, GateStatus } from "../../domain-contracts/src/contracts.js";

async function policyFixture({ conflict = false, confidenceConflict = false } = {}) {
  const root=await mkdtemp(join(tmpdir(),"dream-policy-"));
  for (const [path] of canonicalPolicyPaths) { await mkdir(join(root,path,".."),{recursive:true}); await writeFile(join(root,path), "Version: 1.0\nStatus: Active\n" + (confidenceConflict && path==="SYSTEM_CONSTITUTION.md" ? "Estimated" : confidenceConflict && path==="runtime/QUALITY_GATE.md" ? "HIGH CONFIDENCE" : "")); }
  if(conflict) await writeFile(join(root,"SYSTEM_PROMPT.md"),"This document is considered the Constitution");
  return root;
}

test("policy loading, hashing and reproducibility", async () => {
  const bundle = await new PolicyLoader(await policyFixture()).load();
  assert.equal(bundle.status, "ACTIVE");
  assert.equal(bundle.policies.length, canonicalPolicyPaths.length);
  assert.equal(bundle.conflicts.length, 0);
  assert.match(bundle.policies[0].document_hash, /^[a-f0-9]{64}$/);
});

test("policy conflict detection", async () => assert.equal((await new PolicyLoader(await policyFixture({conflict:true})).load()).status,"BLOCKED_BY_POLICY_CONFLICT"));
test("confidence taxonomy conflict detection", async () => assert.ok((await new PolicyLoader(await policyFixture({confidenceConflict:true})).load()).conflicts.includes("CONFIDENCE_TAXONOMY_CONFLICT")));
test("missing policy detection", async () => assert.equal((await new PolicyLoader(await mkdtemp(join(tmpdir(),"dream-empty-"))).load()).status,"BLOCKED_BY_MISSING_POLICY"));

test("runtime enforces tenant, evidence, choice and transition contracts", () => {
  const store=new RuntimeStore(); const bundle={id:"bundle",status:"ACTIVE",blockers:[],conflicts:[]};
  const run=store.createRun({id:"i",organization_id:"org-a",project_id:"project",objective:{statement:"Grow"}},bundle);
  assert.throws(()=>store.transition(run.id,"org-b","CLASSIFICATION"),/TENANT_ACCESS_DENIED/);
  assert.equal(store.addInsight({organization_id:"org-a",strategy_run_id:run.id,evidence_ids:[]}).blocked,"BLOCKED_BY_MISSING_EVIDENCE");
  const evidence=store.addEvidence({organization_id:"org-a",strategy_run_id:run.id,source:"client",claim:"Revenue declined",evidence_type:"CLIENT",verification_status:"UNDEFINED",confidence:[]});
  const insight=store.addInsight({organization_id:"org-a",strategy_run_id:run.id,evidence_ids:[evidence.id],pattern:"decline",business_insight:"decline",strategic_tension:"growth",assumptions:[],confidence:[]});
  const choice=store.addStrategicChoice({organization_id:"org-a",strategy_run_id:run.id,evidence_ids:[evidence.id],insight_ids:[insight.id],tension:"growth",decision:"investigate",rationale:"evidence",risk_ids:[],assumptions:[],approval_requirement:ApprovalRequirement.UNDEFINED});
  assert.equal(choice.status,"PROPOSED"); assert.ok(transitions.INTAKE.includes("CLASSIFICATION"));
  store.transition(run.id,"org-a","CLASSIFICATION");
  const gates=Array.from({length:12},(_,i)=>({gate_number:i+1,status:GateStatus.PASS,automated_checks:[],findings:[],human_review_required:true}));
  assert.equal(store.recordGate({organization_id:"org-a",strategy_run_id:run.id,gates,final_status:GateStatus.PASS,policy_bundle_id:"bundle"}).gates.length,12);
  assert.equal(store.requestApproval({organization_id:"org-a",strategy_run_id:run.id,requirement:ApprovalRequirement.UNDEFINED}).status,"PENDING");
  assert.throws(()=>store.createReport({organization_id:"org-a",strategy_run_id:run.id,quality_gate_result_id:"gate",policy_bundle_id:"bundle",client_content:"system prompt"}),/REPORT_EXPOSES_INTERNAL_CONTENT/);
  assert.equal(store.createReport({organization_id:"org-a",strategy_run_id:run.id,quality_gate_result_id:"gate",policy_bundle_id:"bundle",client_content:"safe"}).status,"DRAFT");
});

