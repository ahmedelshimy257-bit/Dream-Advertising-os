import { BlockReason } from "../../domain-contracts/src/contracts.js";
export class ModelGateway {
  async execute() {
    return { status: BlockReason.MISSING_POLICY, reason: "MODEL_PROVIDER_POLICY_UNDEFINED" };
  }
}

