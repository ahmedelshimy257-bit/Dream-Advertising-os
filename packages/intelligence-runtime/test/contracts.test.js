import test from "node:test";
import assert from "node:assert/strict";
import { RuntimeStore, transitions } from "../../workflow-runtime/src/runtime.js";
import { validateQualityGateRecord } from "../../quality-gate/src/quality-gate.js";
import { ModelGateway } from "../src/model-gateway.js";
import { ApprovalRequirement, GateStatus, WorkflowState } from "../../domain-contracts/src/contracts.js";

function ready() { return { id:"bundle", status:"ACTIVE", blockers:[], conflicts:[] }; }
function run(store=new RuntimeStore()) { return [store, store.createRun({organization_id:"org",project_id:"project",objective:{statement:"objective"}},ready())]; }

test("intake requires tenant, project and objective", () => assert.throws(()=>new RuntimeStore().createRun({organization_id:"org",objective:{}},ready()),/INVALID_INTAKE/));
test("workflow transition contract rejects undocumented transitions", () => { const [s,r]=run(); assert.throws(()=>s.transition(r.id,"org",WorkflowState.REPORT),/INVALID_TRANSITION/); });
test("workflow persists audit events", () => { const [s,r]=run(); s.transition(r.id,"org",WorkflowState.CLASSIFICATION); assert.equal(r.audit_events.length,2); });
test("strategic choice requires all documented references", () => { const [s,r]=run(); assert.equal(s.addStrategicChoice({organization_id:"org",strategy_run_id:r.id,evidence_ids:[],insight_ids:[],tension:"",decision:"",rationale:""}).blocked,"BLOCKED_BY_MISSING_EVIDENCE"); });
test("quality gate rejects any non-documentary gate number", () => { const invalid=Array.from({length:12},(_,i)=>({gate_number:i===11?13:i+1,status:GateStatus.PASS,automated_checks:[],findings:[],human_review_required:false})); assert.equal(validateQualityGateRecord(invalid).valid,false); });
test("quality gate accepts exactly twelve documented records", () => { const gates=Array.from({length:12},(_,i)=>({gate_number:i+1,status:GateStatus.PASS,automated_checks:[],findings:[],human_review_required:false})); assert.equal(validateQualityGateRecord(gates).valid,true); });
test("not-required approval is never auto-approved", () => { const [s,r]=run(); assert.equal(s.requestApproval({organization_id:"org",strategy_run_id:r.id,requirement:ApprovalRequirement.NOT_REQUIRED}).status,"NOT_REQUIRED"); });
test("model gateway remains policy-blocked", async () => assert.equal((await new ModelGateway().execute()).status,"BLOCKED_BY_MISSING_POLICY"));
test("workflow exposes documented terminal complete state", () => assert.deepEqual(transitions.COMPLETE,[]));

