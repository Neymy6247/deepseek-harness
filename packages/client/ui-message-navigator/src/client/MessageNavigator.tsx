/** Scroll-synchronised navigator for user-authored chat messages. */
import { useEffect, useRef, useState } from 'react'
import type { ContentBlock } from '@deepseek-ai/dsh-llm/types'
import type { ConversationNavigatorSlotProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import css from './MessageNavigator.module.css'

const PREVIEW_CHARACTER_LIMIT = 24
const PREVIEW_OVERFLOW_SUFFIX = '......'
const ACTIVE_OFFSET_PX = 24

interface NavigatorItem {
  readonly key: string
  readonly preview: string
}

/**
 * Project text blocks into the compact label displayed during pointer hover.
 * @param content - Durable user message blocks in source order.
 * @returns A whitespace-normalized preview capped at two 15-character lines, including truncation dots.
 */
export function messageNavigatorPreview(content: readonly ContentBlock[]): string {
  const text = content
    .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  const characters = Array.from(text)
  if (characters.length <= PREVIEW_CHARACTER_LIMIT) return text
  return `${characters.slice(0, PREVIEW_CHARACTER_LIMIT).join('')}${PREVIEW_OVERFLOW_SUFFIX}`
}

function useUserMessageItems(props: ConversationNavigatorSlotProps): readonly NavigatorItem[] {
  const order = props.useSession(snapshot => snapshot.chat.order)
  const nodes = props.useSession(snapshot => snapshot.chat.nodes)
  return order.flatMap((key) => {
    const node = nodes.get(key)
    if (node?.kind !== 'user' && node?.kind !== 'steering') return []
    return [{
      key,
      preview: messageNavigatorPreview((node.data as { content: readonly ContentBlock[] }).content),
    }]
  })
}

function activeMessageKey(scroller: HTMLElement, fallback: string | null): string | null {
  const bounds = scroller.getBoundingClientRect()
  const rows = [...scroller.querySelectorAll<HTMLElement>('[data-chat-anchor-key]')]
    .filter(row => row.dataset.chatFlowKind === 'user' || row.dataset.chatFlowKind === 'steering')
  let active: string | null = null
  for (const row of rows) {
    const key = row.dataset.chatAnchorKey
    if (key === undefined || row.getBoundingClientRect().top > bounds.top + ACTIVE_OFFSET_PX) break
    active = key
  }
  return active ?? rows[0]?.dataset.chatAnchorKey ?? fallback
}

/** Right-side controls that follow the user message nearest the reader's viewport. */
export function MessageNavigator(props: ConversationNavigatorSlotProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const items = useUserMessageItems(props)
  const itemSignature = items.map(item => item.key).join('\u0000')

  useEffect(() => {
    const root = rootRef.current
    const scroller = root?.closest<HTMLElement>('[data-conversation-scroll]')
    if (scroller === null || scroller === undefined) return
    let frame: number | null = null
    const update = (): void => {
      frame = null
      setActiveKey(current => activeMessageKey(scroller, current))
    }
    const onScroll = (): void => {
      if (frame !== null) return
      frame = requestAnimationFrame(update)
    }
    update()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [itemSignature])

  if (props.activeViewId !== 'chat' || items.length === 0) return null
  return (
    <nav ref={rootRef} className={css.root} aria-label="已发送消息导航">
      {items.map((item, index) => {
        const expanded = item.key === hoveredKey
        const edge = items.length < 2 ? undefined : index === 0 ? 'start' : index === items.length - 1 ? 'end' : undefined
        return (
          <button
            key={item.key}
            type="button"
            className={css.item}
            data-active={item.key === activeKey || undefined}
            data-preview-edge={edge}
            aria-current={item.key === activeKey ? 'true' : undefined}
            aria-label={item.preview === '' ? '空消息' : item.preview}
            onFocus={() => { setHoveredKey(item.key) }}
            onBlur={() => { setHoveredKey(current => current === item.key ? null : current) }}
            onPointerEnter={() => { setHoveredKey(item.key) }}
            onPointerLeave={() => { setHoveredKey(current => current === item.key ? null : current) }}
            onClick={() => {
              const scroller = rootRef.current?.closest<HTMLElement>('[data-conversation-scroll]')
              const row = [...(scroller?.querySelectorAll<HTMLElement>('[data-chat-anchor-key]') ?? [])]
                .find(candidate => candidate.dataset.chatAnchorKey === item.key)
              if (scroller === undefined || scroller === null || row === undefined) return
              const offset = row.getBoundingClientRect().top - scroller.getBoundingClientRect().top
              scroller.scrollTo({ top: scroller.scrollTop + offset - ACTIVE_OFFSET_PX, behavior: 'smooth' })
              setActiveKey(item.key)
            }}
          >
            <span className={css.marker} data-message-navigator-anchor="" aria-hidden="true" />
            {expanded && <span className={css.preview}>{item.preview || '空消息'}</span>}
          </button>
        )
      })}
    </nav>
  )
}
