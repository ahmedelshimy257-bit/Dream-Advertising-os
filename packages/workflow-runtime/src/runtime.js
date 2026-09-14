import { randomUUID } from "node:crypto";
import { BlockReason, WorkflowState, GateStatus, ApprovalRequirement } from "../../domain-contracts/src/contracts.js";

const transitions = {
  INTAKE:["CLASSIFICATION","REWORK","BLOCKED"], CLASSIFICATION:["CONTEXT_LOADING","REWORK","BLOCKED"],
  CONTEXT_LOADING:["ENGINE_ACTIVATION","REWORK","BLOCKED"], ENGINE_ACTIVATION:["ANALYSIS","REWORK","BLOCKED"],
  ANALYSIS:["SYNTHESIS","REWORK","BLOCKED"], SYNTHESIS:["DECISION","EXECUTIVE_APPROVAL","REWORK","BLOCKED"],
  DECISION:["QUALITY_GATE","REWORK","BLOCKED"], QUALITY_GATE:["EXECUTIVE_APPROVAL","REPORT","REWORK","BLOCKED"],
  EXECUTIVE_APPROVAL:["REPORT","REWORK","BLOCKED"], REPORT:["DELIVERY","REWORK","BLOCKED"],
  DELIVERY:["MEMORY_UPDATE","REWORK","BLOCKED"], MEMORY_UPDATE:["COMPLETE","BLOCKED"], REWORK:["INTAKE","CLASSIFICATION","ANALYSIS","SYNTHESIS","DECISION","QUALITY_GATE","EXECUTIVE_APPROVAL","REPORT","DELIVERY","BLOCKED"], COMPLETE:[], BLOCKED:[]
};

export class RuntimeStore {
  constructor() { this.runs = new Map(); this.evidence = new Map(); this.insights = new Map(); this.choices = new Map(); this.gates = new Map(); this.approvals = new Map(); this.reports = new Map(); }
  createRun(intake, policyBundle) {
    if (policyBundle.status !== "ACTIVE") return { blocked: policyBundle.status, blockers: [...policyBundle.blockers, ...policyBundle.conflicts] };
    if (!intake?.organization_id || !intake?.project_id || !intake?.objective?.statement) throw new Error("INVALID_INTAKE");
    const run = { id: randomUUID(), organization_id:intake.organization_id, project_id:intake.project_id, intake_id:intake.id || randomUUID(), policy_bundle_id:policyBundle.id, state:WorkflowState.INTAKE, audit_events:[] };
    this.runs.set(run.id, run); this.#audit(run, "RUN_CREATED"); return run;
  }
  transition(runId, organizationId, to) { const run=this.#owned(this.runs,runId,organizationId); if (!transitions[run.state].includes(to)) throw new Error(`INVALID_TRANSITION:${run.state}:${to}`); run.state=to; this.#audit(run,`STATE:${to}`); return run; }
  addEvidence(input) { if (!input.organization_id || !input.strategy_run_id || !input.source || !input.claim) throw new Error("INVALID_EVIDENCE"); const record={...input,id:randomUUID()}; this.#owned(this.runs,record.strategy_run_id,record.organization_id); this.evidence.set(record.id,record); return record; }
  addInsight(input) { const run=this.#owned(this.runs,input.strategy_run_id,input.organization_id); if (!input.evidence_ids?.length || !input.evidence_ids.every(id=>this.#owned(this.evidence,id,input.organization_id).strategy_run_id===run.id)) return { blocked:BlockReason.MISSING_EVIDENCE }; const record={...input,id:randomUUID(),status:"VALIDATED"}; this.insights.set(record.id,record); return record; }
  addStrategicChoice(input) { const required=Boolean(input.evidence_ids?.length && input.insight_ids?.length && input.tension && input.decision && input.rationale); if (!required) return { blocked:BlockReason.MISSING_EVIDENCE }; for(const id of [...input.evidence_ids,...input.insight_ids]) this.#owned(this.evidence.has(id)?this.evidence:this.insights,id,input.organization_id); const record={...input,id:randomUUID(),status:"PROPOSED",approval_requirement:input.approval_requirement||ApprovalRequirement.UNDEFINED}; this.choices.set(record.id,record); return record; }
  recordGate(input) { this.#owned(this.runs,input.strategy_run_id,input.organization_id); if (!input.gates?.length || input.gates.some(g=>g.gate_number<1||g.gate_number>12||!Object.values(GateStatus).includes(g.status))) throw new Error("INVALID_QUALITY_GATE"); const record={...input,id:randomUUID()}; this.gates.set(record.id,record); return record; }
  requestApproval(input) { this.#owned(this.runs,input.strategy_run_id,input.organization_id); const record={...input,id:randomUUID(),status:input.requirement===ApprovalRequirement.NOT_REQUIRED?"NOT_REQUIRED":"PENDING"}; this.approvals.set(record.id,record); return record; }
  createReport(input) { this.#owned(this.runs,input.strategy_run_id,input.organization_id); if (!input.quality_gate_result_id || !input.policy_bundle_id) throw new Error("INVALID_REPORT"); if (/system prompt|hidden reasoning|internal governance|private system instructions/i.test(input.client_content || "")) throw new Error("REPORT_EXPOSES_INTERNAL_CONTENT"); const record={...input,id:randomUUID(),status:"DRAFT"}; this.reports.set(record.id,record); return record; }
  #owned(map,id,org) { const record=map.get(id); if(!record || record.organization_id!==org) throw new Error("TENANT_ACCESS_DENIED"); return record; }
  #audit(run,event) { run.audit_events.push({id:randomUUID(),event,at:new Date().toISOString()}); }
}
export { transitions };

