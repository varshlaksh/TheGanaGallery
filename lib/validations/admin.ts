import { z } from 'zod'

// Valid forward-only status transitions for admin
export const orderStatusUpdateSchema = z.object({
  status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
})

// Which transitions are actually allowed from a given status
export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['processing', 'cancelled'],
  paid:       ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],   // terminal state
  cancelled:  [],   // terminal state
}