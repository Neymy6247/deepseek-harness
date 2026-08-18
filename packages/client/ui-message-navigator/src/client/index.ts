/** Registers the session message navigator into the conversation-owned slot. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { MessageNavigator } from './MessageNavigator.tsx'

/** Services required by the message navigator plugin. */
export const inject = ['slots']

/**
 * Register the navigator after its conversation owner declares the slot.
 * @param ctx - Client root context.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject('conversation.session.navigator', () => ctx.slots.register({
    name: 'conversation.session.navigator',
  }, MessageNavigator))
}
