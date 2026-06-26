export const CRM_STAGES = ['reach', 'lead', 'conversation', 'order', 'repeat'] as const

export const CRM_STAGE_OPTIONS = [
  { label: 'Reach', value: 'reach' },
  { label: 'Lead', value: 'lead' },
  { label: 'Conversation', value: 'conversation' },
  { label: 'Order', value: 'order' },
  { label: 'Repeat', value: 'repeat' },
]

export const CRM_ACTIVITY_OPTIONS = [
  { label: 'Note', value: 'note' },
  { label: 'Call', value: 'call' },
  { label: 'Message', value: 'message' },
  { label: 'Follow up', value: 'follow_up' },
]

type BadgeColor = 'neutral' | 'info' | 'warning' | 'primary' | 'success'

export function crmStageColor(stage: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    reach: 'neutral',
    lead: 'info',
    conversation: 'warning',
    order: 'primary',
    repeat: 'success',
  }
  return map[stage] ?? 'neutral'
}
