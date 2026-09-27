import { useState } from 'react'

interface AccordionItemProps {
  title: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`stat-accordion-item ${open ? 'open' : ''}`}>
      <button type="button" className="stat-accordion-header" onClick={() => setOpen(prev => !prev)}>
        <span>{title}</span>
        <span className="accordion-arrow">▼</span>
      </button>
      {open && <div className="stat-accordion-content">{children}</div>}
    </div>
  )
}
