import { GateStatus } from "../../domain-contracts/src/contracts.js";
export const qualityGateDefinitions = Object.freeze([
  "INPUT_INTEGRITY", "EVIDENCE_INTEGRITY", "REASONING_INTEGRITY", "STRATEGIC_CONSISTENCY",
  "FINANCIAL_CONSISTENCY", "DEPARTMENTAL_BOUNDARIES", "EXECUTION_FEASIBILITY", "RISK_VALIDATION",
  "KPI_VALIDATION", "CONFIDENCE_VALIDATION", "EXECUTIVE_GOVERNANCE", "CLIENT_READINESS"
]);
export function validateQualityGateRecord(gates) {
  if (!Array.isArray(gates) || gates.length !== 12) return { valid:false, finding:"ALL_12_DOCUMENTED_GATES_REQUIRED" };
  return { valid:gates.every((g,i)=>g.gate_number===i+1 && Object.values(GateStatus).includes(g.status) && Array.isArray(g.automated_checks) && Array.isArray(g.findings) && typeof g.human_review_required==="boolean"), finding:"" };
}

