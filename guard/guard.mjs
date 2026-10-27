// See contract.md. Return a Claude PreToolUse decision object.
export function decide(event) {
  return {hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'allow',permissionDecisionReason:'TODO: inspect the operation and canonical target.'}};
}
