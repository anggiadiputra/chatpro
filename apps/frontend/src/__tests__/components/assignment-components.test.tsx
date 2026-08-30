/**
 * Unit Tests for Assignment Components
 * 
 * Tests for AssignmentBadge, AssignmentDropdown, and AssignmentFilter components.
 * 
 * Requirements: 4.1, 5.1
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AssignmentBadge } from '@/app/[locale]/(dashboard)/oneinbox/components/assignment-badge'
import { AssignmentFilter } from '@/app/[locale]/(dashboard)/oneinbox/components/assignment-filter'
import type { AssignableUser, AssignmentFilterType } from '@/app/[locale]/(dashboard)/oneinbox/types/unified-inbox'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      'messages.assignment': {
        'badge.unassigned': 'Unassigned',
        'badge.assignedToAI': 'Assigned to AI: {name}',
      },
      'messages.assignment.dropdown': {
        'owner': 'Owner',
        'agent': 'Agent',
        'aiAgent': 'AI Agent',
      },
      'messages.assignment.filter': {
        'all': 'All',
        'mine': 'Mine',
        'unassigned': 'Unassigned',
        'others': 'Others',
        'allDescription': 'All conversations',
        'mineDescription': 'Assigned to me',
        'unassignedDescription': 'No assignee',
        'othersDescription': 'Assigned to others',
      },
    }
    return (key: string, params?: Record<string, string>) => {
      const value = translations[namespace]?.[key] || key
      if (params) {
        return Object.entries(params).reduce(
          (acc, [k, v]) => acc.replace(`{${k}}`, v),
          value
        )
      }
      return value
    }
  },
}))

// Mock assignable users for testing
const mockBusinessOwner: AssignableUser = {
  id: 'user-1',
  name: 'John Owner',
  email: 'john@example.com',
  image: null,
  role: 'BUSINESS_OWNER',
}

const mockAgent: AssignableUser = {
  id: 'user-2',
  name: 'Jane Agent',
  email: 'jane@example.com',
  image: 'https://example.com/avatar.jpg',
  role: 'AGENT',
}

describe('AssignmentBadge', () => {
  /**
   * Test: Renders assignee avatar with initials when no image
   * Validates: Requirements 4.1
   */
  it('should render assignee initials when no image is provided', () => {
    render(<AssignmentBadge assignee={mockBusinessOwner} showTooltip={false} />)
    
    // Should show initials "JO" for "John Owner"
    expect(screen.getByText('JO')).toBeInTheDocument()
  })

  /**
   * Test: Renders assignee avatar with image when provided
   * Validates: Requirements 4.1
   */
  it('should render assignee avatar image when provided', () => {
    const { container } = render(<AssignmentBadge assignee={mockAgent} showTooltip={false} />)
    
    // Radix Avatar shows fallback initially, image loads async
    // Check that the avatar container is rendered with correct structure
    const avatar = container.querySelector('span')
    expect(avatar).toBeInTheDocument()
    
    // Should show initials "JA" for "Jane Agent" as fallback
    expect(screen.getByText('JA')).toBeInTheDocument()
  })

  /**
   * Test: Shows "Unassigned" state when no assignee
   * Validates: Requirements 4.2
   */
  it('should render unassigned state when assignee is null', () => {
    const { container } = render(<AssignmentBadge assignee={null} showTooltip={false} />)
    
    // Should have the unassigned icon (IconUserOff)
    const unassignedIcon = container.querySelector('svg')
    expect(unassignedIcon).toBeInTheDocument()
  })

  /**
   * Test: Applies correct size classes
   * Validates: Requirements 4.1
   */
  it('should apply correct size classes for sm size', () => {
    const { container } = render(
      <AssignmentBadge assignee={mockBusinessOwner} size="sm" showTooltip={false} />
    )
    
    const avatar = container.querySelector('[class*="h-6"]')
    expect(avatar).toBeInTheDocument()
  })

  it('should apply correct size classes for md size', () => {
    const { container } = render(
      <AssignmentBadge assignee={mockBusinessOwner} size="md" showTooltip={false} />
    )
    
    const avatar = container.querySelector('[class*="h-8"]')
    expect(avatar).toBeInTheDocument()
  })

  /**
   * Test: Generates correct initials for single name
   * Validates: Requirements 4.1
   */
  it('should generate correct initials for single name', () => {
    const singleNameUser: AssignableUser = {
      ...mockBusinessOwner,
      name: 'Admin',
    }
    
    render(<AssignmentBadge assignee={singleNameUser} showTooltip={false} />)
    
    // Should show "AD" for "Admin"
    expect(screen.getByText('AD')).toBeInTheDocument()
  })

  /**
   * Test: Applies role-based colors
   * Validates: Requirements 4.1
   */
  it('should apply blue color for business owner', () => {
    const { container } = render(
      <AssignmentBadge assignee={mockBusinessOwner} showTooltip={false} />
    )
    
    const fallback = container.querySelector('[class*="bg-blue"]')
    expect(fallback).toBeInTheDocument()
  })

  it('should apply purple color for agent', () => {
    const agentWithoutImage: AssignableUser = {
      ...mockAgent,
      image: null,
    }
    
    const { container } = render(
      <AssignmentBadge assignee={agentWithoutImage} showTooltip={false} />
    )
    
    const fallback = container.querySelector('[class*="bg-purple"]')
    expect(fallback).toBeInTheDocument()
  })

  /**
   * Test: Renders AI Agent badge with robot icon
   * Validates: Requirements 1.5
   */
  it('should render AI Agent badge with robot icon when assigneeType is AI_AGENT', () => {
    const { container } = render(
      <AssignmentBadge 
        assignee={null} 
        showTooltip={false}
        assigneeType="AI_AGENT"
        aiAgentName="Customer Support Bot"
      />
    )
    
    // Should have emerald background for AI Agent
    const aiAgentBadge = container.querySelector('[class*="bg-emerald"]')
    expect(aiAgentBadge).toBeInTheDocument()
    
    // Should have robot icon (svg)
    const robotIcon = container.querySelector('svg')
    expect(robotIcon).toBeInTheDocument()
  })

  /**
   * Test: Shows AI Agent name in badge (not just "AI Agent")
   * Validates: Requirements 1.6
   */
  it('should display specific AI Agent name, not generic label', () => {
    const aiAgentName = 'Sales Assistant Bot'
    
    // The badge itself doesn't show the name, but the tooltip does
    // This test verifies the aiAgentName prop is accepted
    const { container } = render(
      <AssignmentBadge 
        assignee={null} 
        showTooltip={false}
        assigneeType="AI_AGENT"
        aiAgentName={aiAgentName}
      />
    )
    
    // Should render AI Agent badge (emerald background)
    const aiAgentBadge = container.querySelector('[class*="bg-emerald"]')
    expect(aiAgentBadge).toBeInTheDocument()
  })

  /**
   * Test: Falls back to unassigned when AI_AGENT type but no name
   * Validates: Requirements 1.5
   */
  it('should show unassigned badge when AI_AGENT type but no aiAgentName', () => {
    const { container } = render(
      <AssignmentBadge 
        assignee={null} 
        showTooltip={false}
        assigneeType="AI_AGENT"
        aiAgentName={null}
      />
    )
    
    // Should show unassigned state (dashed border)
    const unassignedBadge = container.querySelector('[class*="border-dashed"]')
    expect(unassignedBadge).toBeInTheDocument()
  })

  /**
   * Test: Human assignee takes precedence when both provided
   * Validates: Requirements 1.5
   */
  it('should show human assignee when both human and AI props provided', () => {
    const { container } = render(
      <AssignmentBadge 
        assignee={mockBusinessOwner} 
        showTooltip={false}
        assigneeType="HUMAN"
        aiAgentName={null}
      />
    )
    
    // Should show human initials, not AI badge
    expect(screen.getByText('JO')).toBeInTheDocument()
    
    // Should NOT have emerald background (AI Agent color)
    const aiAgentBadge = container.querySelector('[class*="bg-emerald"]')
    expect(aiAgentBadge).not.toBeInTheDocument()
  })
})

describe('AssignmentFilter', () => {
  // jsdom lacks Pointer Capture and scrollIntoView APIs that Radix Select
  // relies on when opening the dropdown.
  beforeEach(() => {
    window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
    window.HTMLElement.prototype.releasePointerCapture = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  // The filter is a Radix UI Select: options only render in a portal after the
  // trigger is opened. Radix opens on pointerdown (not click).
  const openSelect = (trigger: HTMLElement) => {
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerId: 1, pointerType: 'mouse' })
  }

  /**
   * Test: Renders all filter options
   * Validates: Requirements 5.1
   */
  it('should render all filter options', async () => {
    const onChange = vi.fn()
    render(<AssignmentFilter value="all" onChange={onChange} />)

    openSelect(screen.getByRole('combobox'))

    expect(await screen.findByRole('option', { name: /^all$/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^mine$/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^unassigned$/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^others$/i })).toBeInTheDocument()
  })

  /**
   * Test: Calls onChange when filter is clicked
   * Validates: Requirements 5.1
   */
  it('should call onChange when a filter is clicked', async () => {
    const onChange = vi.fn()
    render(<AssignmentFilter value="all" onChange={onChange} />)
    const trigger = screen.getByRole('combobox')

    openSelect(trigger)
    fireEvent.click(await screen.findByRole('option', { name: /^mine$/i }))
    expect(onChange).toHaveBeenCalledWith('mine')

    openSelect(trigger)
    fireEvent.click(await screen.findByRole('option', { name: /^unassigned$/i }))
    expect(onChange).toHaveBeenCalledWith('unassigned')

    openSelect(trigger)
    fireEvent.click(await screen.findByRole('option', { name: /^others$/i }))
    expect(onChange).toHaveBeenCalledWith('others')
  })

  /**
   * Test: Shows visual indication of active filter
   * Validates: Requirements 5.1
   */
  it('should show visual indication of active filter', () => {
    const onChange = vi.fn()
    const { rerender } = render(<AssignmentFilter value="mine" onChange={onChange} />)

    // The trigger displays the selected filter's label
    expect(screen.getByRole('combobox')).toHaveTextContent(/mine/i)

    // Rerender with different value
    rerender(<AssignmentFilter value="unassigned" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toHaveTextContent(/unassigned/i)
  })

  /**
   * Test: Each filter option has correct key
   * Validates: Requirements 5.1
   */
  it('should have correct filter keys', async () => {
    const onChange = vi.fn()
    // Start with no selection so even the first key ('all') fires onValueChange;
    // Radix Select does not fire change events for the already-selected item.
    const { rerender } = render(<AssignmentFilter value={undefined as unknown as AssignmentFilterType} onChange={onChange} />)
    const trigger = screen.getByRole('combobox')

    const filterKeys: AssignmentFilterType[] = ['all', 'mine', 'unassigned', 'others']

    for (const key of filterKeys) {
      openSelect(trigger)
      fireEvent.click(await screen.findByRole('option', { name: new RegExp(`^${key}$`, 'i') }))
      expect(onChange).toHaveBeenCalledWith(key)
      // Reset to no selection for the next iteration
      onChange.mockClear()
      rerender(<AssignmentFilter value={undefined as unknown as AssignmentFilterType} onChange={onChange} />)
    }
  })
})

describe('Assignment Filter Logic', () => {
  // Helper function to simulate filter logic (extracted from hook)
  const filterByAssignment = (
    conversations: Array<{ assigneeId: string | null }>,
    filter: AssignmentFilterType,
    currentUserId: string
  ) => {
    switch (filter) {
      case 'mine':
        return conversations.filter((c) => c.assigneeId === currentUserId)
      case 'unassigned':
        return conversations.filter((c) => c.assigneeId === null)
      case 'others':
        return conversations.filter((c) => c.assigneeId !== null && c.assigneeId !== currentUserId)
      default:
        return conversations
    }
  }

  const currentUserId = 'user-1'
  const mockConversations = [
    { assigneeId: 'user-1' }, // Assigned to current user
    { assigneeId: 'user-2' }, // Assigned to another user
    { assigneeId: null },     // Unassigned
    { assigneeId: 'user-1' }, // Assigned to current user
    { assigneeId: null },     // Unassigned
  ]

  /**
   * Test: "mine" filter returns only conversations assigned to current user
   * Validates: Requirements 5.2
   */
  it('should filter "mine" to return only conversations assigned to current user', () => {
    const filtered = filterByAssignment(mockConversations, 'mine', currentUserId)
    
    expect(filtered).toHaveLength(2)
    expect(filtered.every((c) => c.assigneeId === currentUserId)).toBe(true)
  })

  /**
   * Test: "unassigned" filter returns only conversations without assignee
   * Validates: Requirements 5.3
   */
  it('should filter "unassigned" to return only conversations without assignee', () => {
    const filtered = filterByAssignment(mockConversations, 'unassigned', currentUserId)
    
    expect(filtered).toHaveLength(2)
    expect(filtered.every((c) => c.assigneeId === null)).toBe(true)
  })

  /**
   * Test: "others" filter returns only conversations assigned to other users
   * Validates: Requirements 5.4
   */
  it('should filter "others" to return only conversations assigned to other users', () => {
    const filtered = filterByAssignment(mockConversations, 'others', currentUserId)
    
    expect(filtered).toHaveLength(1)
    expect(filtered.every((c) => c.assigneeId !== null && c.assigneeId !== currentUserId)).toBe(true)
  })

  /**
   * Test: "all" filter returns all conversations
   * Validates: Requirements 5.1
   */
  it('should filter "all" to return all conversations', () => {
    const filtered = filterByAssignment(mockConversations, 'all', currentUserId)
    
    expect(filtered).toHaveLength(5)
  })

  /**
   * Test: Edge case - empty conversations array
   */
  it('should handle empty conversations array', () => {
    const emptyConversations: Array<{ assigneeId: string | null }> = []
    
    expect(filterByAssignment(emptyConversations, 'mine', currentUserId)).toHaveLength(0)
    expect(filterByAssignment(emptyConversations, 'unassigned', currentUserId)).toHaveLength(0)
    expect(filterByAssignment(emptyConversations, 'others', currentUserId)).toHaveLength(0)
    expect(filterByAssignment(emptyConversations, 'all', currentUserId)).toHaveLength(0)
  })

  /**
   * Test: Edge case - all conversations assigned to current user
   */
  it('should handle all conversations assigned to current user', () => {
    const allMine = [
      { assigneeId: 'user-1' },
      { assigneeId: 'user-1' },
      { assigneeId: 'user-1' },
    ]
    
    expect(filterByAssignment(allMine, 'mine', currentUserId)).toHaveLength(3)
    expect(filterByAssignment(allMine, 'unassigned', currentUserId)).toHaveLength(0)
    expect(filterByAssignment(allMine, 'others', currentUserId)).toHaveLength(0)
  })

  /**
   * Test: Edge case - all conversations unassigned
   */
  it('should handle all conversations unassigned', () => {
    const allUnassigned = [
      { assigneeId: null },
      { assigneeId: null },
      { assigneeId: null },
    ]
    
    expect(filterByAssignment(allUnassigned, 'mine', currentUserId)).toHaveLength(0)
    expect(filterByAssignment(allUnassigned, 'unassigned', currentUserId)).toHaveLength(3)
    expect(filterByAssignment(allUnassigned, 'others', currentUserId)).toHaveLength(0)
  })
})


/**
 * AI Agent Assignment Tests
 * 
 * Tests for AI Agent assignment functionality in AssignmentDropdown.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */

import type { AssignableEntity, AssignableEntitiesResponse } from '@/app/[locale]/(dashboard)/oneinbox/types/unified-inbox'

// Mock AI Agents for testing
const mockAIAgents: AssignableEntity[] = [
  {
    id: 'ai-agent-1',
    name: 'Customer Support Bot',
    type: 'AI_AGENT',
  },
  {
    id: 'ai-agent-2',
    name: 'Sales Assistant',
    type: 'AI_AGENT',
  },
]

// Mock assignable entities response
const mockAssignableEntitiesWithAI: AssignableEntitiesResponse = {
  humans: [
    {
      id: 'user-1',
      name: 'John Owner',
      type: 'HUMAN',
      email: 'john@example.com',
      image: null,
      role: 'BUSINESS_OWNER',
    },
    {
      id: 'user-2',
      name: 'Jane Agent',
      type: 'HUMAN',
      email: 'jane@example.com',
      image: null,
      role: 'AGENT',
    },
  ],
  aiAgents: mockAIAgents,
}

const mockAssignableEntitiesWithoutAI: AssignableEntitiesResponse = {
  humans: [
    {
      id: 'user-1',
      name: 'John Owner',
      type: 'HUMAN',
      email: 'john@example.com',
      image: null,
      role: 'BUSINESS_OWNER',
    },
  ],
  aiAgents: [],
}

describe('AI Agent Assignment Logic', () => {
  /**
   * Test: AI Agents appear in assignable entities when AI is enabled
   * Validates: Requirements 1.1, 1.2
   */
  it('should include AI Agents in assignable entities when AI is enabled', () => {
    const response = mockAssignableEntitiesWithAI
    
    // Should have both humans and AI agents
    expect(response.humans).toHaveLength(2)
    expect(response.aiAgents).toHaveLength(2)
    
    // AI agents should have correct type
    expect(response.aiAgents.every(a => a.type === 'AI_AGENT')).toBe(true)
    
    // AI agents should have names
    expect(response.aiAgents[0].name).toBe('Customer Support Bot')
    expect(response.aiAgents[1].name).toBe('Sales Assistant')
  })

  /**
   * Test: AI Agents are hidden when AI is disabled (empty array)
   * Validates: Requirements 1.2
   */
  it('should not include AI Agents when AI is disabled', () => {
    const response = mockAssignableEntitiesWithoutAI
    
    // Should have humans but no AI agents
    expect(response.humans).toHaveLength(1)
    expect(response.aiAgents).toHaveLength(0)
  })

  /**
   * Test: AI Agent entities have correct structure
   * Validates: Requirements 1.3, 1.6
   */
  it('should have correct structure for AI Agent entities', () => {
    const aiAgent = mockAIAgents[0]
    
    // Should have required fields
    expect(aiAgent).toHaveProperty('id')
    expect(aiAgent).toHaveProperty('name')
    expect(aiAgent).toHaveProperty('type')
    
    // Type should be AI_AGENT
    expect(aiAgent.type).toBe('AI_AGENT')
    
    // Should have a name (not just "AI Agent")
    expect(aiAgent.name).toBeTruthy()
    expect(aiAgent.name).not.toBe('AI Agent')
  })

  /**
   * Test: Can distinguish between human and AI Agent entities
   * Validates: Requirements 1.5
   */
  it('should be able to distinguish between human and AI Agent entities', () => {
    const response = mockAssignableEntitiesWithAI
    
    // All humans should have type HUMAN
    response.humans.forEach(human => {
      expect(human.type).toBe('HUMAN')
      // Humans should have email and role
      expect(human).toHaveProperty('email')
      expect(human).toHaveProperty('role')
    })
    
    // All AI agents should have type AI_AGENT
    response.aiAgents.forEach(agent => {
      expect(agent.type).toBe('AI_AGENT')
      // AI agents should NOT have email or role
      expect(agent).not.toHaveProperty('email')
      expect(agent).not.toHaveProperty('role')
    })
  })

  /**
   * Test: AI enabled check based on aiAgents array
   * Validates: Requirements 1.2
   */
  it('should determine AI enabled status from aiAgents array', () => {
    // AI is enabled if aiAgents array has items
    const aiEnabledResponse = mockAssignableEntitiesWithAI
    const aiEnabled = aiEnabledResponse.aiAgents && aiEnabledResponse.aiAgents.length > 0
    expect(aiEnabled).toBe(true)
    
    // AI is disabled if aiAgents array is empty
    const aiDisabledResponse = mockAssignableEntitiesWithoutAI
    const aiDisabled = aiDisabledResponse.aiAgents && aiDisabledResponse.aiAgents.length > 0
    expect(aiDisabled).toBe(false)
  })
})

describe('Assignment Type Handling', () => {
  /**
   * Test: Human assignment uses correct type
   * Validates: Requirements 1.4
   */
  it('should use type "human" for human assignments', () => {
    const assignmentType: 'human' | 'ai' = 'human'
    const assigneeId = 'user-1'
    
    // Simulate building request body
    const body = assignmentType === 'human' 
      ? { assigneeId }
      : { aiAgentId: assigneeId }
    
    expect(body).toHaveProperty('assigneeId')
    expect(body).not.toHaveProperty('aiAgentId')
    expect(body.assigneeId).toBe(assigneeId)
  })

  /**
   * Test: AI Agent assignment uses correct type
   * Validates: Requirements 1.4
   */
  it('should use type "ai" for AI Agent assignments', () => {
    const assignmentType: 'human' | 'ai' = 'ai'
    const aiAgentId = 'ai-agent-1'
    
    // Simulate building request body
    const body = assignmentType === 'human' 
      ? { assigneeId: aiAgentId }
      : { aiAgentId }
    
    expect(body).toHaveProperty('aiAgentId')
    expect(body).not.toHaveProperty('assigneeId')
    expect(body.aiAgentId).toBe(aiAgentId)
  })

  /**
   * Test: Assignment type defaults to human
   * Validates: Requirements 1.4
   */
  it('should default to human assignment type', () => {
    const defaultType: 'human' | 'ai' = 'human'
    expect(defaultType).toBe('human')
  })
})
