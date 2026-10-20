const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export function ReceiptIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M6 2h12v19l-3-2-3 2-3-2-3 2V2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}

export function ImageIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <path d="M4.5 17.5l5-5 3.5 3.5 3-3 4 4" />
    </svg>
  );
}

export function UploadIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M12 15V4" />
      <path d="M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function ShieldCheckIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function CalendarIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function ListIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}

export function TagIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M20 12.5V5a1 1 0 0 0-1-1h-7.5a1 1 0 0 0-.7.3l-8 8a1 1 0 0 0 0 1.4l7.5 7.5a1 1 0 0 0 1.4 0l8-8a1 1 0 0 0 .3-.7z" />
      <circle cx="15" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClipboardCheckIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <polyline points="9.5 13 11.5 15 15 10.5" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function WrenchIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z" />
    </svg>
  );
}

export function TentIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M3 20L12 4l9 16z" />
      <path d="M12 4l-5 16" />
      <path d="M12 4l5 16" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  );
}

export function CameraIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.8 4.4-6 7.5-6s6.1 2.2 7.5 6" />
    </svg>
  );
}

export function StoreIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <path d="M4 9l1-5h14l1 5" />
      <path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10h14V9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

export function StarIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <polygon points="12 3 14.9 9 21.5 9.9 16.8 14.5 17.9 21 12 17.8 6.1 21 7.2 14.5 2.5 9.9 9.1 9" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg {...ICON_PROPS} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
