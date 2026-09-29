// src/game/components/ChatConsole.tsx
import { useEffect, useRef, useState } from 'react'

/** Staff names: locked colour + tag, bold. Players: plain white. Staff messages: bold platinum. */
export const ROLE_STYLE: Record<string, { color: string; tag: string }> = {
  dev:   { color: '#FF2D2D', tag: 'Dev' },
  admin: { color: '#B84DFF', tag: 'Admin' },
  arch:  { color: '#2E8BFF', tag: 'Arch' },
  mod:   { color: '#2BFF5F', tag: 'Mod' },
}
const PLATINUM = '#D4DAE3'

function ChatName({ m, onMention }: { m: any; onMention?: (name: string) => void }) {
  if (m.system) return <span style={{ color: '#3EE0FF', fontWeight: 800 }}>{m.sender}:</span>
  const st = ROLE_STYLE[m.role]
  const style: React.CSSProperties = st ? { color: st.color, fontWeight: 800 } : { color: '#fff', fontWeight: 400 }
  return (
    <span role="button" title="Tap to mention" onClick={() => onMention?.(m.sender)} style={{ ...style, cursor: 'pointer' }}>
      {m.sender}{st ? `(${st.tag})` : ''}:
    </span>
  )
}

function timeOf(at?: string): string {
  if (!at) return ''
  const d = new Date(at)
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const CHAT_SUBS: Record<string, [string, string][]> = {
  main:   [['feed', 'Main Chat']],
  sales:  [['chat', 'Sales Chat'], ['auction', 'Auction']],
  clan:   [['chat', 'Clan Chat'], ['wars', 'Wars'], ['contrib', 'Contributions']],
  groups: [['g1', ''], ['g2', ''], ['g3', ''], ['g4', '']],
}

interface ChatConsoleProps {
  chatChannel: string
  chatSub: Record<string, string>
  chatMessages: Record<string, any[]>
  chatInput: string
  emojiOpen: boolean
  inboxOpen: boolean
  chatOverlay: boolean
  groupNames: Record<string, string>
  playerName: string
  onSwitchChannel: (ch: string) => void
  onSetChatSub: (updater: (prev: Record<string, string>) => Record<string, string>) => void
  onChatInput: (val: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onToggleEmoji: () => void
  onToggleInbox: () => void
  onSetChatOverlay: (val: boolean) => void
  onAddEmoji: (em: string) => void
  unread: Record<string, number>
  canModerate: boolean
  onDeleteMessage: (id: number) => void
  onMention: (name: string) => void
}

export default function ChatConsole({
  chatChannel, chatSub, chatMessages, chatInput,
  emojiOpen, inboxOpen, chatOverlay, groupNames, playerName,
  onSwitchChannel, onSetChatSub, onChatInput, onSendMessage,
  onToggleEmoji, onToggleInbox, onSetChatOverlay, onAddEmoji,
  unread, canModerate, onDeleteMessage, onMention,
}: ChatConsoleProps) {
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Newest messages sit at the top, right under the text bar. Stay pinned there while you're
  // at the top; if you've scrolled down to read older ones, offer a jump button instead.
  const activeKey = chatChannel === 'groups' ? chatSub[chatChannel] : chatChannel
  const activeCount = (chatMessages[activeKey] || []).length
  const [showJump, setShowJump] = useState(false)
  const atTop = useRef(true)
  const scrollToNewest = () => { const el = chatScrollRef.current; if (el) el.scrollTop = 0; setShowJump(false) }
  useEffect(() => { if (atTop.current) scrollToNewest(); else setShowJump(true) }, [activeCount])
  useEffect(() => { atTop.current = true; scrollToNewest() }, [activeKey, chatOverlay])

  const renderChatContent = () => {
    const sub = chatSub[chatChannel]
    const key = chatChannel === 'groups' ? sub : chatChannel
    const msgs = [...(chatMessages[key] || [])].reverse()
    const mentionRe = playerName ? new RegExp(`@${escapeRe(playerName)}\\b`, 'i') : null
    return msgs.length === 0
      ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '120px', color: '#64748b', fontSize: '13px' }}>No messages yet. Say hi!</div>
      : <>{msgs.map((m: any, i: number) => {
          const mentioned = !m.system && mentionRe?.test(m.text || '')
          return (
            <div key={m.id ?? `i${i}`} className="chat-line" style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px',
              fontSize: '14px', lineHeight: 1.45, wordBreak: 'break-word',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: mentioned ? 'rgba(255,214,10,0.10)' : undefined,
              borderLeft: mentioned ? '2px solid #FFD60A' : '2px solid transparent',
            }}>
              <span style={{ flexShrink: 0, color: '#5b6573', fontSize: '10px', fontFamily: 'monospace', paddingTop: '4px', minWidth: '46px' }}>{timeOf(m.at)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <ChatName m={m} onMention={onMention} />{' '}
                <span style={{ color: m.role ? PLATINUM : '#fff', fontWeight: m.role ? 700 : 400 }}>{m.text}</span>
              </span>
              {canModerate && m.id != null && (
                <button onClick={() => onDeleteMessage(m.id)} title="Delete message"
                  style={{ flexShrink: 0, background: 'none', border: 'none', color: '#5b6573', fontSize: '15px', lineHeight: 1, cursor: 'pointer', padding: '2px 2px 0' }}>×</button>
              )}
            </div>
          )
        })}</>
  }

  // The black "screen" inside the glass shell
  const screen: React.CSSProperties = {
    background: '#000', border: '1px solid rgba(62,224,255,0.28)', borderRadius: '12px',
    boxShadow: 'inset 0 0 18px rgba(0,0,0,0.9), 0 0 10px rgba(62,224,255,0.08)',
  }
  const subs = CHAT_SUBS[chatChannel] || []

  // Called as a function (not <ChatBody/>): a component defined in here would be re-created on
  // every keystroke, remounting the input and closing the phone keyboard.
  const chatBody = (inOverlay = false) => (
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* 💬 [Main][Sales][Clan][Group] */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <button className={`chat-expand-btn inbox-btn${inboxOpen ? ' active' : ''}`} onClick={onToggleInbox} title="Private messages">💬</button>
        {['main', 'sales', 'clan', 'groups'].map(ch => (
          <button key={ch} className={`footer-tab-button${chatChannel === ch && !inboxOpen ? ' active' : ''}`} style={{ flex: 1, minWidth: 0, position: 'relative', padding: '8px 2px' }} onClick={() => onSwitchChannel(ch)}>
            {ch === 'groups' ? 'Group' : ch.charAt(0).toUpperCase() + ch.slice(1)}
            {chatChannel !== ch && (unread[ch] || 0) > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-4px', minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: '9999px', background: '#FF375F', color: '#fff', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,55,95,0.7)' }}>{unread[ch]}</span>
            )}
          </button>
        ))}
        {inOverlay
          ? <button className="chat-expand-btn" onClick={() => onSetChatOverlay(false)} title="Close">✕</button>
          : <button className="chat-expand-btn" onClick={() => onSetChatOverlay(true)} title="Full screen">
              <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
            </button>
        }
      </div>

      {/* Text bar, right under the tabs */}
      {!inboxOpen && (
        <form onSubmit={onSendMessage} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <button type="button" className="icon-btn" onClick={onToggleEmoji}>😀</button>
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <input type="text" className="editor-input" value={chatInput} maxLength={300} enterKeyHint="send" onChange={e => onChatInput(e.target.value)}
              placeholder={chatChannel === 'main' || chatChannel === 'sales' ? `Message ${chatChannel === 'main' ? 'Main' : 'Sales'}…` : 'Type To Chat…'}
              style={{ width: '100%', padding: '10px', paddingRight: chatInput.length > 240 ? '44px' : undefined, fontSize: '16px', background: '#000', color: '#fff', borderRadius: '10px' }} />
            {chatInput.length > 240 && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'monospace', color: chatInput.length >= 300 ? '#FF375F' : '#94a3b8' }}>{300 - chatInput.length}</span>}
          </div>
          <button type="submit" className="footer-tab-button" style={{ padding: '10px 16px', fontWeight: 700 }}>Send</button>
        </form>
      )}

      {/* Sub-channels, only where there's a choice (Sales, Clan, Group) */}
      {!inboxOpen && subs.length > 1 && (
        <div className="sub-bar" style={{ flexShrink: 0, marginBottom: '8px' }}>
          {subs.map(([id, label]) => {
            const name = chatChannel === 'groups' ? groupNames[id] || id : label
            return (
              <button key={id} className={`sub-btn${chatSub[chatChannel] === id ? ' active' : ''}`}
                onClick={() => onSetChatSub(prev => ({ ...prev, [chatChannel]: id }))}>
                <span>{name}</span>
              </button>
            )
          })}
        </div>
      )}

      {inboxOpen ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: inOverlay ? 0 : '380px' }}>
          {[['💬 Private Messages', 'No private messages yet'], ['🤖 Discord Messages', 'Link a Discord account to message players from in-game']].map(([title, empty]) => (
            <div key={title} style={{ ...screen, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#fff', borderBottom: '1px solid rgba(62,224,255,0.2)' }}>{title}</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>{empty}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...screen, position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showJump && (
            <button onClick={scrollToNewest} style={{ position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 2, padding: '5px 14px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', background: 'rgba(62,224,255,0.92)', color: '#021018', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.7)' }}>
              ↑ New messages
            </button>
          )}
          <div ref={chatScrollRef}
            onScroll={e => { atTop.current = e.currentTarget.scrollTop < 40; if (atTop.current) setShowJump(false) }}
            style={{ ...(inOverlay ? { flex: 1, minHeight: 0 } : { height: '52vh', minHeight: '300px', maxHeight: '480px' }), overflowY: 'auto', padding: '4px 2px', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
            {renderChatContent()}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Inline chat */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ width: '100%', padding: '10px', display: 'flex', flexDirection: 'column' }}>
          {chatBody()}
        </div>
      </div>

      {/* Emoji Panel */}
      {emojiOpen && (
        <div style={{ position: 'fixed', bottom: '80px', left: '16px', right: '16px', zIndex: 300, background: '#061018', border: '1px solid rgba(62,224,255,0.4)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.75)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', background: '#061018' }}>
            <button className="chat-expand-btn" style={{ width: 28, height: 28 }} onClick={onToggleEmoji}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', padding: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {['😀','😂','😍','🥰','😎','🤩','😏','😤','😡','💀','👻','👾','⚔️','🛡️','💎','🔥','⚡','❄️','🌟','💫','🏆','💰','🎯','🎮','👑','🐉','⚗️','🗡️','🏹','🪄','💥','🌀'].map(em => (
              <button key={em} onClick={() => onAddEmoji(em)}
                style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>{em}</button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Overlay */}
      {chatOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom))' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '512px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', padding: '12px' }}>
            {chatBody(true)}
          </div>
        </div>
      )}
    </>
  )
}
