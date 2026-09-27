// src/components/AccordionItem.tsx
import { useState } from 'react'

interface AccordionItemProps {
  title: React.ReactNode
  children: React.ReactNode
}

export default function AccordionItem({ title, children }: AccordionItemProps) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`stat-accordion-item${open ? ' open' : ''}`}>
      <button className="stat-accordion-header" onClick={() => setOpen(!open)}>
        {title}
        <svg className="accordion-arrow" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className="stat-accordion-content">{children}</div>
    </div>
  )
}
