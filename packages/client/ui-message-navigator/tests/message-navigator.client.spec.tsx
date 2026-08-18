// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ConversationNavigatorSlotProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import { MessageNavigator, messageNavigatorPreview } from '../src/client/MessageNavigator.tsx'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function props(messages: readonly { key: string; text: string }[], activeViewId = 'chat'): ConversationNavigatorSlotProps {
  const entries = new Map(messages.map(({ key, text }) => [key, {
    key,
    kind: 'user',
    data: { content: [{ type: 'text', text }] },
  }]))
  const snapshot = {
    chat: {
      order: messages.map(message => message.key),
      nodes: { get: (key: string) => entries.get(key) },
    },
  }
  return {
    activeViewId,
    useSession: selector => selector(snapshot as never),
  } as ConversationNavigatorSlotProps
}

function setRect(element: HTMLElement, top: number, bottom = top + 40): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: top, top, bottom, left: 0, right: 600, width: 600, height: bottom - top,
    toJSON: () => ({}),
  })
}

describe('MessageNavigator', () => {
  it('limits a normalized preview to two 15-character lines', () => {
    const longMessage = '一'.repeat(25)
    expect(messageNavigatorPreview([{ type: 'text', text: longMessage }] as never))
      .toBe(`${'一'.repeat(24)}......`)
    expect(messageNavigatorPreview([{ type: 'text', text: '  short\nmessage  ' }] as never))
      .toBe('short message')
  })

  it('reveals a preview while retaining the visual anchors', () => {
    const { container } = render(
      <div data-conversation-scroll>
        <MessageNavigator {...props([
          { key: 'first', text: '一'.repeat(25) },
          { key: 'second', text: '第二条消息' },
        ])} />
      </div>,
    )

    const preview = `${'一'.repeat(24)}......`
    const first = screen.getByRole('button', { name: preview })
    const anchors = screen.getAllByRole('button')
    expect(anchors[0]?.dataset.previewEdge).toBe('start')
    expect(anchors[1]?.dataset.previewEdge).toBe('end')
    expect(container.querySelectorAll('[data-message-navigator-anchor]').length).toBe(2)
    fireEvent.pointerEnter(first)
    expect(screen.getByText(preview)).toBeTruthy()
    expect(container.querySelectorAll('[data-message-navigator-anchor]').length).toBe(2)
    fireEvent.pointerLeave(first)
    expect(container.querySelectorAll('[data-message-navigator-anchor]').length).toBe(2)
  })

  it('selects the user message nearest the reader and scrolls to clicked messages', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const { container } = render(
      <div data-conversation-scroll>
        <div data-chat-anchor-key="first" data-chat-flow-kind="user" />
        <div data-chat-anchor-key="second" data-chat-flow-kind="user" />
        <MessageNavigator {...props([
          { key: 'first', text: '第一条消息' },
          { key: 'second', text: '第二条消息' },
        ])} />
      </div>,
    )
    const scroller = container.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const rows = container.querySelectorAll<HTMLElement>('[data-chat-anchor-key]')
    const scrollTo = vi.fn()
    Object.defineProperty(scroller, 'scrollTop', { value: 100, writable: true })
    Object.defineProperty(scroller, 'scrollTo', { value: scrollTo })
    setRect(scroller, 0, 500)
    setRect(rows[0]!, -80)
    setRect(rows[1]!, 20)

    fireEvent.scroll(scroller)
    expect(screen.getByRole('button', { name: '第二条消息' }).getAttribute('aria-current')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: '第一条消息' }))
    expect(scrollTo).toHaveBeenCalledWith({ top: -4, behavior: 'smooth' })
  })

  it('stays absent outside the chat view', () => {
    render(<MessageNavigator {...props([{ key: 'first', text: '第一条消息' }], 'trajectory')} />)
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
