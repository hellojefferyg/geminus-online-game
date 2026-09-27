import { useEffect, useRef } from 'react'

const EMOJIS = ['😀','😂','😍','🥰','😎','🤩','😏','😤','😡','💀','👻','👾','⚔️','🛡️','💎','🔥','⚡','❄️','🌟','💫','🏆','💰','🎯','🎮','👑','🐉','⚗️','🗡️','🏹','🪄','💥','🌀']

interface ChatConsoleProps {
  channel: string
  onChannelChange: (ch: string) => void
  chatSub: Record<string, string>
  onSubChange: (channel: string, sub: string) => void
  chatSubs: Record<string, [string, string][]>
  messages: Record<string, { sender: string; text: string; color: string }[]>
  groupNames: Record<string, string>
  chatInput: string
  onInputChange: (val: string) => void
  onSend: (e: React.FormEvent) => void
  onExpand: () => void
  inboxOpen: boolean
  onToggleInbox: () => void
  emojiOpen: boolean
  onToggleEmoji: () => void
  onEmojiSelect: (emoji: string) => void
  nameColor: string
  nameColorPicker: React.ReactNode
}

export function ChatConsole({ channel, onChannelChange, chatSub, onSubChange, chatSubs, messages, groupNames, chatInput, onInputChange, onSend, onExpand, inboxOpen, onToggleInbox, emojiOpen, onToggleEmoji, onEmojiSelect, nameColor, nameColorPicker }: ChatConsoleProps) {
  const feedRef = useRef<HTMLDivElement>(null)
  const activeSub = chatSub[channel] || chatSubs[channel]?.[0]?.[0] || ''
  const key = channel === 'groups' ? activeSub : channel
  const currentMessages = messages[key] || []

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [currentMessages, channel, activeSub])

  return (
    <div className="glass-panel flex flex-col" style={{ height: '400px' }}>
      <div className="flex items-center justify-between gap-1 p-2 border-b border-gray-800">
        <div className="flex items-center gap-1">
          {Object.keys(chatSubs).map(ch => (
            <button key={ch} type="button" onClick={() => onChannelChange(ch)} className={`hud-nav-pill ${channel === ch ? 'tab-active' : ''}`}>{ch.charAt(0).toUpperCase()+ch.slice(1)}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onToggleInbox} className={`chat-expand-btn ${inboxOpen ? 'inbox-btn' : ''}`}>💬</button>
          <button type="button" onClick={onExpand} className="chat-expand-btn">⛶</button>
        </div>
      </div>
      {!inboxOpen && chatSubs[channel] && (
        <div className="sub-bar flex items-center gap-1 p-2">
          {chatSubs[channel].map(([subKey, subLabel]) => (
            <button key={subKey} type="button" onClick={() => onSubChange(channel, subKey)} className={`sub-btn ${activeSub === subKey ? 'active' : ''}`}>
              {channel === 'groups' && groupNames[subKey] ? groupNames[subKey] : subLabel}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {inboxOpen ? (
          <div className="p-4 text-center text-gray-500 text-sm">No private messages</div>
        ) : channel === 'main' && activeSub === 'settings' ? (
          <div className="flex-1 overflow-y-auto p-2">{nameColorPicker}</div>
        ) : (
          <div ref={feedRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 text-xs font-mono">
            {currentMessages.map((msg, i) => (
              <div key={i}><span style={{ color: msg.color || nameColor }} className="font-bold mr-1">{msg.sender}:</span><span className="text-neutral-200">{msg.text}</span></div>
            ))}
          </div>
        )}
      </div>
      {emojiOpen && !inboxOpen && (
        <div className="info-cell p-2 grid grid-cols-8 gap-1 max-h-24 overflow-y-auto">
          {EMOJIS.map(emoji => <button key={emoji} type="button" onClick={() => onEmojiSelect(emoji)} className="text-base hover:bg-white/10 rounded p-1">{emoji}</button>)}
        </div>
      )}
      {!inboxOpen && !(channel === 'main' && activeSub === 'settings') && (
        <form onSubmit={onSend} className="flex items-center gap-1 p-2 border-t border-gray-800">
          <button type="button" onClick={onToggleEmoji} className="icon-btn text-sm">😀</button>
          <input type="text" className="editor-input flex-1 py-1 px-2 text-xs" placeholder={`Message ${channel}...`} value={chatInput} onChange={(e) => onInputChange(e.target.value)} />
          <button type="submit" className="battle-mode-btn px-3 py-1 text-xs">Send</button>
        </form>
      )}
    </div>
  )
}
