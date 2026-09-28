// src/game/components/ChatConsole.tsx
import { useRef } from 'react'
import NameColorPicker from './NameColorPicker'

/** Names too dark to read on the chat background are lightened (e.g. a black name colour). */
function readableColor(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return '#3EE0FF'
  const n = parseInt(m[1], 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (lum >= 0.35) return hex
  // Blend toward white until readable
  const t = Math.min(1, (0.55 - lum) / (1 - lum))
  r = Math.round(r + (255 - r) * t); g = Math.round(g + (255 - g) * t); b = Math.round(b + (255 - b) * t)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

const CHAT_SUBS: Record<string, [string, string][]> = {
  main:   [['feed', 'Main Chat'], ['settings', 'Name Color']],
  sales:  [['chat', 'Sales Chat'], ['auction', 'Auction']],
  clan:   [['chat', 'Clan Chat'], ['wars', 'Wars'], ['contrib', 'Contributions']],
  groups: [['g1', ''], ['g2', ''], ['g3', ''], ['g4', '']],
}

interface ChatConsoleProps {
  chatChannel: string
  chatSub: Record<string, string>
  chatMessages: Record<string, any[]>
  chatInput: string
  chatNameColor: string
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
  onColorChange: (color: string) => void
  onAddEmoji: (em: string) => void
}

export default function ChatConsole({
  chatChannel, chatSub, chatMessages, chatInput, chatNameColor,
  emojiOpen, inboxOpen, chatOverlay, groupNames, playerName,
  onSwitchChannel, onSetChatSub, onChatInput, onSendMessage,
  onToggleEmoji, onToggleInbox, onSetChatOverlay, onColorChange, onAddEmoji,
}: ChatConsoleProps) {
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const renderChatContent = () => {
    const sub = chatSub[chatChannel]
    if (chatChannel === 'main' && sub === 'settings') return <NameColorPicker nameColor={chatNameColor} onColorChange={onColorChange} />
    const key = chatChannel === 'groups' ? sub : chatChannel
    const msgs = chatMessages[key] || []
    return msgs.length === 0
      ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontSize: '12px' }}></div>
      : <>{msgs.map((m: any, i: number) => (
          <div key={i} style={{ margin: '4px 0', fontSize: '12px' }}>
            <span style={{ color: readableColor(m.color || chatNameColor), fontWeight: 800 }}>{m.sender}:</span>{' '}
            <span style={{ color: '#fff' }}>{m.text}</span>
          </div>
        ))}</>
  }

  const ChatBody = ({ inOverlay = false }: { inOverlay?: boolean }) => (
    <>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <button className={`chat-expand-btn inbox-btn${inboxOpen ? ' active' : ''}`} onClick={onToggleInbox}>💬</button>
          {['main', 'sales', 'clan', 'groups'].map(ch => (
            <button key={ch} className={`footer-tab-button${chatChannel === ch ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => onSwitchChannel(ch)}>
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </button>
          ))}
        </div>
        {inOverlay
          ? <button className="chat-expand-btn" onClick={() => onSetChatOverlay(false)}>✕</button>
          : <button className="chat-expand-btn" style={{ marginLeft: '4px' }} onClick={() => onSetChatOverlay(true)}>
              <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
            </button>
        }
      </div>

      {!inboxOpen && (
        <div className="sub-bar" style={{ flexShrink: 0, marginBottom: '8px' }}>
          {(CHAT_SUBS[chatChannel] || []).map(([id, label]) => {
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(62,224,255,0.3)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid rgba(62,224,255,0.25)' }}>💬 Private Messages:</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>No private messages</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(62,224,255,0.3)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid rgba(62,224,255,0.25)' }}>🤖 Discord Messages:</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>Link a Discord account to message players from in-game</div>
          </div>
        </div>
      ) : (
        <div ref={chatScrollRef} style={{ fontSize: '12px', flex: 1, overflowY: 'auto', minHeight: '140px', padding: '4px' }}>
          {renderChatContent()}
        </div>
      )}

      {!inboxOpen && (
        <form onSubmit={onSendMessage} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button type="button" className="icon-btn" onClick={onToggleEmoji}>😀</button>
          <input type="text" className="editor-input" value={chatInput} onChange={e => onChatInput(e.target.value)} placeholder="Type To Chat…" style={{ flex: 1, padding: inOverlay ? '10px' : '8px', fontSize: '12px' }} />
          <button type="submit" className="footer-tab-button" style={{ padding: inOverlay ? '10px 20px' : '8px 16px', fontWeight: 600 }}>Send</button>
        </form>
      )}
    </>
  )

  return (
    <>
      {/* Inline chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '240px' }}>
        <div className="glass-panel" style={{ width: '100%', padding: '10px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <ChatBody />
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '512px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', padding: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ChatBody inOverlay />
          </div>
        </div>
      )}
    </>
  )
}
