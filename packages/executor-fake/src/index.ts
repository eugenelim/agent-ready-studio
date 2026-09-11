// Defines the deterministic field mapping from a validated Input Packet to a
// Product Intent proposal. The same packet always produces the same content.
export type InputPacket = {
  objective: string;
  sourceNotes: string;
  targetUsers: string[];
  knownContext: string[];
  constraints: string[];
  nonGoals: string[];
  expectedOutputArtifactType: "product-intent";
};

export type ProductIntent = {
  title: string;
  outcome: string;
  opportunity: string;
  targetUsers: string[];
  assumptions: string[];
  guardrails: string[];
  nonGoals: string[];
  confidence: "low" | "medium" | "high";
  openQuestions: string[];
};

export function frameProductIntent(packet: InputPacket): ProductIntent {
  return {
    title: packet.objective,
    outcome: packet.objective,
    opportunity: packet.sourceNotes,
    targetUsers: [...packet.targetUsers],
    assumptions: [...packet.knownContext],
    guardrails: [...packet.constraints],
    nonGoals: [...packet.nonGoals],
    confidence: "medium",
    openQuestions: [],
  };
}
