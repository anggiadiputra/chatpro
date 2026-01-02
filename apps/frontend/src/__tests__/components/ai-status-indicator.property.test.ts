/**
 * Property-Based Tests for AI Status Indicator Correctness
 * 
 * **Property 6: AI Status Indicator Correctness**
 * **Validates: Requirements 5.2, 5.3**
 * 
 * For any conversation:
 * - If assigned to AI Agent: indicator shows "AI Active" with AI Agent name
 * - If assigned to human: indicator shows "AI Inactive"
 * - If unassigned with AI enabled: indicator shows "AI Active" with default agent name
 */

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import type { AssignmentResult, AssigneeType } from "@/app/[locale]/(dashboard)/oneinbox/types/unified-inbox"

// Import the getAIStatus function from the component
// We'll test the logic directly since it's exported
import { getAIStatus, type AIStatusIndicatorProps } from "@/app/[locale]/(dashboard)/oneinbox/components/ai-status-indicator"

// Arbitrary for generating AI Agent names
const aiAgentNameArbitrary = fc.string({ minLength: 1, maxLength: 50 })

// Arbitrary for generating user IDs
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 20 })

// Arbitrary for generating AssignmentResult
const assignmentResultArbitrary = (
  assigneeType: AssigneeType,
  hasAIAgent: boolean
): fc.Arbitrary<AssignmentResult> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    conversationId: fc.string({ minLength: 1, maxLength: 20 }),
    conversationType: fc.constantFrom<"WHATSAPP" | "INSTAGRAM">("WHATSAPP", "INSTAGRAM"),
    assigneeType: fc.constant(assigneeType),
    assigneeId: assigneeType === "HUMAN" ? userIdArbitrary : fc.constant(null),
    assigneeName: assigneeType === "HUMAN" ? fc.string({ minLength: 1, maxLength: 50 }) : fc.constant(null),
    assigneeImage: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    aiAgentId: assigneeType === "AI_AGENT" && hasAIAgent ? fc.string({ minLength: 1, maxLength: 20 }) : fc.constant(null),
    aiAgentName: assigneeType === "AI_AGENT" && hasAIAgent ? aiAgentNameArbitrary : fc.constant(null),
    assignedById: userIdArbitrary,
    assignedAt: fc.date(),
  })
}

describe("AI Status Indicator Correctness - Property Tests", () => {
  /**
   * Feature: ai-agent-assignment, Property 6: AI Status Indicator Correctness
   * Validates: Requirements 5.2
   * 
   * For any conversation assigned to an AI Agent, the indicator should show "AI Active"
   * with the specific AI Agent name.
   */
  it("Property 6: AI Agent assignment shows 'AI Active' with agent name", () => {
    fc.assert(
      fc.property(
        // Generate AI Agent name
        aiAgentNameArbitrary,
        // Generate default AI Agent name
        fc.option(aiAgentNameArbitrary, { nil: null }),
        // Generate aiEnabled flag
        fc.boolean(),
        (aiAgentName, defaultAIAgentName, aiEnabled) => {
          const props: AIStatusIndicatorProps = {
            assignment: null,
            aiEnabled,
            defaultAIAgentName,
            assigneeType: "AI_AGENT",
            aiAgentName,
            hasHumanAssignee: false,
          }

          const status = getAIStatus(props)

          // Property: When assigned to AI Agent, status should be active
          expect(status.isActive).toBe(true)
          // Property: Agent name should match the assigned AI Agent
          expect(status.agentName).toBe(aiAgentName)
          // Property: Reason should be "assigned_to_ai"
          expect(status.reason).toBe("assigned_to_ai")

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-agent-assignment, Property 6: AI Status Indicator Correctness
   * Validates: Requirements 5.3
   * 
   * For any conversation assigned to a human, the indicator should show "AI Inactive".
   */
  it("Property 6: Human assignment shows 'AI Inactive'", () => {
    fc.assert(
      fc.property(
        // Generate default AI Agent name
        fc.option(aiAgentNameArbitrary, { nil: null }),
        // Generate aiEnabled flag
        fc.boolean(),
        (defaultAIAgentName, aiEnabled) => {
          const props: AIStatusIndicatorProps = {
            assignment: null,
            aiEnabled,
            defaultAIAgentName,
            assigneeType: "HUMAN",
            aiAgentName: null,
            hasHumanAssignee: true,
          }

          const status = getAIStatus(props)

          // Property: When assigned to human, status should be inactive
          expect(status.isActive).toBe(false)
          // Property: Agent name should be null
          expect(status.agentName).toBeNull()
          // Property: Reason should be "assigned_to_human"
          expect(status.reason).toBe("assigned_to_human")

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-agent-assignment, Property 6: AI Status Indicator Correctness
   * Validates: Requirements 5.2, 5.3
   * 
   * For any unassigned conversation with AI enabled, the indicator should show "AI Active"
   * with the default agent name.
   */
  it("Property 6: Unassigned with AI enabled shows 'AI Active' with default agent", () => {
    fc.assert(
      fc.property(
        // Generate default AI Agent name
        fc.option(aiAgentNameArbitrary, { nil: null }),
        (defaultAIAgentName) => {
          const props: AIStatusIndicatorProps = {
            assignment: null,
            aiEnabled: true, // AI is enabled
            defaultAIAgentName,
            assigneeType: undefined, // No assignment type
            aiAgentName: null,
            hasHumanAssignee: false, // No human assignee
          }

          const status = getAIStatus(props)

          // Property: When unassigned with AI enabled, status should be active
          expect(status.isActive).toBe(true)
          // Property: Agent name should be the default agent name
          expect(status.agentName).toBe(defaultAIAgentName)
          // Property: Reason should be "unassigned_ai_enabled"
          expect(status.reason).toBe("unassigned_ai_enabled")

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-agent-assignment, Property 6: AI Status Indicator Correctness
   * Validates: Requirements 5.3
   * 
   * For any unassigned conversation with AI disabled, the indicator should show "AI Inactive".
   */
  it("Property 6: Unassigned with AI disabled shows 'AI Inactive'", () => {
    fc.assert(
      fc.property(
        // Generate default AI Agent name (should be ignored when AI disabled)
        fc.option(aiAgentNameArbitrary, { nil: null }),
        (defaultAIAgentName) => {
          const props: AIStatusIndicatorProps = {
            assignment: null,
            aiEnabled: false, // AI is disabled
            defaultAIAgentName,
            assigneeType: undefined, // No assignment type
            aiAgentName: null,
            hasHumanAssignee: false, // No human assignee
          }

          const status = getAIStatus(props)

          // Property: When AI is disabled, status should be inactive
          expect(status.isActive).toBe(false)
          // Property: Agent name should be null
          expect(status.agentName).toBeNull()
          // Property: Reason should be "ai_disabled"
          expect(status.reason).toBe("ai_disabled")

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-agent-assignment, Property 6: AI Status Indicator Correctness
   * Validates: Requirements 5.2, 5.3
   * 
   * Property: AI Agent assignment takes precedence over aiEnabled flag.
   * Even if aiEnabled is false, if assigned to AI Agent, status should be active.
   */
  it("Property 6: AI Agent assignment takes precedence over aiEnabled flag", () => {
    fc.assert(
      fc.property(
        // Generate AI Agent name
        aiAgentNameArbitrary,
        // Generate default AI Agent name
        fc.option(aiAgentNameArbitrary, { nil: null }),
        (aiAgentName, defaultAIAgentName) => {
          const props: AIStatusIndicatorProps = {
            assignment: null,
            aiEnabled: false, // AI is globally disabled
            defaultAIAgentName,
            assigneeType: "AI_AGENT",
            aiAgentName,
            hasHumanAssignee: false,
          }

          const status = getAIStatus(props)

          // Property: AI Agent assignment should make status active regardless of aiEnabled
          expect(status.isActive).toBe(true)
          expect(status.agentName).toBe(aiAgentName)
          expect(status.reason).toBe("assigned_to_ai")

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-agent-assignment, Property 6: AI Status Indicator Correctness
   * Validates: Requirements 5.2, 5.3
   * 
   * Property: Human assignment takes precedence over aiEnabled flag.
   * Even if aiEnabled is true, if assigned to human, status should be inactive.
   */
  it("Property 6: Human assignment takes precedence over aiEnabled flag", () => {
    fc.assert(
      fc.property(
        // Generate default AI Agent name
        fc.option(aiAgentNameArbitrary, { nil: null }),
        (defaultAIAgentName) => {
          const props: AIStatusIndicatorProps = {
            assignment: null,
            aiEnabled: true, // AI is globally enabled
            defaultAIAgentName,
            assigneeType: "HUMAN",
            aiAgentName: null,
            hasHumanAssignee: true,
          }

          const status = getAIStatus(props)

          // Property: Human assignment should make status inactive regardless of aiEnabled
          expect(status.isActive).toBe(false)
          expect(status.agentName).toBeNull()
          expect(status.reason).toBe("assigned_to_human")

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-agent-assignment, Property 6: AI Status Indicator Correctness
   * Validates: Requirements 5.2, 5.3
   * 
   * Property: Status reasons are mutually exclusive and exhaustive.
   * Every possible state maps to exactly one reason.
   */
  it("Property 6: Status reasons are mutually exclusive", () => {
    fc.assert(
      fc.property(
        // Generate all possible combinations of props
        fc.record({
          aiEnabled: fc.boolean(),
          defaultAIAgentName: fc.option(aiAgentNameArbitrary, { nil: null }),
          assigneeType: fc.option(fc.constantFrom<AssigneeType>("HUMAN", "AI_AGENT"), { nil: undefined }),
          aiAgentName: fc.option(aiAgentNameArbitrary, { nil: null }),
          hasHumanAssignee: fc.boolean(),
        }),
        (generatedProps) => {
          const props: AIStatusIndicatorProps = {
            assignment: null,
            aiEnabled: generatedProps.aiEnabled,
            defaultAIAgentName: generatedProps.defaultAIAgentName,
            assigneeType: generatedProps.assigneeType,
            aiAgentName: generatedProps.aiAgentName,
            hasHumanAssignee: generatedProps.hasHumanAssignee,
          }

          const status = getAIStatus(props)

          // Property: Reason must be one of the valid reasons
          const validReasons = ["assigned_to_ai", "assigned_to_human", "unassigned_ai_enabled", "ai_disabled"]
          expect(validReasons).toContain(status.reason)

          // Property: isActive and reason must be consistent
          if (status.reason === "assigned_to_ai" || status.reason === "unassigned_ai_enabled") {
            expect(status.isActive).toBe(true)
          } else {
            expect(status.isActive).toBe(false)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
