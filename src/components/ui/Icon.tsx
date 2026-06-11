export type IconName =
  | 'home'
  | 'vector'
  | 'flux'
  | 'circulation'
  | 'divergence'
  | 'curl'
  | 'electric'
  | 'magnetic'
  | 'water'
  | 'gas'
  | 'projection'
  | 'arrow-left'
  | 'panel'
  | 'reset'
  | 'zoom-in'
  | 'zoom-out'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'info'
  | 'play'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export default function Icon({ name, size = 18, className, strokeWidth = 1.8 }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }

  switch (name) {
    case 'home':
      return <svg {...common}><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>
    case 'vector':
      return <svg {...common}><path d="M4 18 18 4" /><path d="M11 4h7v7" /><circle cx="4" cy="18" r="1.5" /></svg>
    case 'flux':
      return <svg {...common}><path d="M3 7h18M3 12h18M3 17h18" /><path d="m17 4 4 3-4 3M17 9l4 3-4 3M17 14l4 3-4 3" /><path d="M11 3v18" /></svg>
    case 'circulation':
      return <svg {...common}><path d="M19.5 8.5A8 8 0 1 0 20 15" /><path d="M19.5 4.5v4h-4" /><path d="M8.5 12h7" /><path d="m12.5 9 3 3-3 3" /></svg>
    case 'divergence':
      return <svg {...common}><circle cx="12" cy="12" r="2" /><path d="M12 2v6M12 16v6M2 12h6M16 12h6" /><path d="m9.5 4.5 2.5-2.5 2.5 2.5M9.5 19.5 12 22l2.5-2.5M4.5 9.5 2 12l2.5 2.5M19.5 9.5 22 12l-2.5 2.5" /></svg>
    case 'curl':
      return <svg {...common}><path d="M19 7a8 8 0 1 0 1 8" /><path d="m19 3 .2 4.2L15 7" /><circle cx="12" cy="12" r="2.5" /></svg>
    case 'electric':
      return <svg {...common}><path d="m13 2-8 12h6l-1 8 9-13h-6z" /></svg>
    case 'magnetic':
      return <svg {...common}><path d="M6 3v9a6 6 0 0 0 12 0V3" /><path d="M6 7h4M14 7h4" /><path d="M6 3h4M14 3h4" /></svg>
    case 'water':
      return <svg {...common}><path d="M4 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" /><path d="M4 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" /><path d="M4 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" /></svg>
    case 'gas':
      return <svg {...common}><path d="M7 16a4 4 0 1 1 1.1-7.85A5.5 5.5 0 0 1 18.5 10.5 3.2 3.2 0 0 1 18 17H7" /><path d="M5 20h12" /></svg>
    case 'projection':
      return <svg {...common}><path d="m12 3 8 4.5-8 4.5-8-4.5z" /><path d="M4 12.5 12 17l8-4.5" /><path d="M4 17.5 12 22l8-4.5" /><path d="M12 12v10" /></svg>
    case 'arrow-left':
      return <svg {...common}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
    case 'panel':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></svg>
    case 'reset':
      return <svg {...common}><path d="M4 4v6h6" /><path d="M5.5 15.5A8 8 0 1 0 6 7" /></svg>
    case 'zoom-in':
      return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M10.5 7.5v6M7.5 10.5h6" /></svg>
    case 'zoom-out':
      return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M7.5 10.5h6" /></svg>
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
    case 'minus':
      return <svg {...common}><path d="M5 12h14" /></svg>
    case 'trash':
      return <svg {...common}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>
    case 'play':
      return <svg {...common} fill="currentColor" stroke="none"><path d="m8 5 11 7-11 7z" /></svg>
  }
}
