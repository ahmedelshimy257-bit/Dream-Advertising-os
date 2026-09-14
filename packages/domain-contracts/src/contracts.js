/**
 * Runtime status values deliberately preserve policy uncertainty instead of
 * inferring business rules that are not in the Intelligence Core.
 */
export const BlockReason = Object.freeze({
  MISSING_POLICY: "BLOCKED_BY_MISSING_POLICY",
  POLICY_CONFLICT: "BLOCKED_BY_POLICY_CONFLICT",
  MISSING_EVIDENCE: "BLOCKED_BY_MISSING_EVIDENCE",
  REQUIRES_POLICY_DECISION: "REQUIRES_POLICY_DECISION"
});

export const WorkflowState = Object.freeze({
  INTAKE: "INTAKE", CLASSIFICATION: "CLASSIFICATION", CONTEXT_LOADING: "CONTEXT_LOADING",
  ENGINE_ACTIVATION: "ENGINE_ACTIVATION", ANALYSIS: "ANALYSIS", SYNTHESIS: "SYNTHESIS",
  DECISION: "DECISION", QUALITY_GATE: "QUALITY_GATE", EXECUTIVE_APPROVAL: "EXECUTIVE_APPROVAL",
  REPORT: "REPORT", DELIVERY: "DELIVERY", MEMORY_UPDATE: "MEMORY_UPDATE", COMPLETE: "COMPLETE",
  REWORK: "REWORK", BLOCKED: "BLOCKED"
});

export const GateStatus = Object.freeze({ PASS: "PASS", PASS_WITH_CONDITIONS: "PASS_WITH_CONDITIONS", REWORK_REQUIRED: "REWORK_REQUIRED", BLOCKED: "BLOCKED" });
export const ApprovalRequirement = Object.freeze({ NOT_REQUIRED: "NOT_REQUIRED", EXECUTIVE_BOARD_REQUIRED: "EXECUTIVE_BOARD_REQUIRED", CHAIRMAN_REQUIRED: "CHAIRMAN_REQUIRED", UNDEFINED: "UNDEFINED" });

/** @typedef {{taxonomy:"CONSTITUTION_V1"|"QUALITY_GATE_V1", value:string}} ConfidenceAdapter */
/** @typedef {{id:string, organization_id:string, client_id:string, project_id:string, objective:{statement:string}, business:object, market?:object, audience?:object, constraints?:object, available_evidence_ids:string[], policy_bundle_id:string}} Intake */
/** @typedef {{id:string, organization_id:string, strategy_run_id:string, source:string, claim:string, evidence_type:string, verification_status:string, confidence:ConfidenceAdapter[], source_reference?:string, source_url?:string, source_date?:string, relevance?:string, notes?:string}} Evidence */
/** @typedef {{id:string, organization_id:string, strategy_run_id:string, evidence_ids:string[], pattern:string, business_insight:string, strategic_tension:string, assumptions:string[], confidence:ConfidenceAdapter[], status:string}} Insight */
/** @typedef {{id:string, organization_id:string, strategy_run_id:string, problem:string, evidence_ids:string[], insight_ids:string[], tension:string, decision:string, rationale:string, risk_ids:string[], assumptions:string[], approval_requirement:string, status:string}} StrategicChoice */
/** @typedef {{id:string, organization_id:string, strategy_run_id:string, gates:Array, final_status:string, policy_bundle_id:string}} QualityGateResult */
/** @typedef {{id:string, organization_id:string, strategy_run_id:string, requirement:string, status:"PENDING"|"APPROVED"|"REJECTED"|"NOT_REQUIRED", approver_id?:string, conditions?:string[]}} Approval */
/** @typedef {{id:string, organization_id:string, strategy_run_id:string, audience:string, evidence_ids:string[], insight_ids:string[], strategic_choice_ids:string[], decision_ids:string[], roadmap_references:string[], kpi_references:string[], quality_gate_result_id:string, approval_ids:string[], policy_bundle_id:string, status:string}} Report */
/** @typedef {{id:string, organization_id:string, client_id:string, project_id:string, strategy_run_id:string, value:string, status:"PLACEHOLDER"}} MemoryRecord */
/** @typedef {{id:string, document_path:string, document_hash:string, declared_version?:string, declared_status?:string, authority_rank:number, immutable:true}} PolicyVersion */
/** @typedef {{id:string, policies:PolicyVersion[], status:string, blockers:string[], conflicts:string[]}} PolicyBundle */
/** @typedef {{id:string, organization_id:string, project_id:string, intake_id:string, policy_bundle_id:string, state:string, audit_events:Array}} StrategyRun */

