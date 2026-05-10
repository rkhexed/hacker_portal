import { useEffect, useRef } from 'react';

const BOUNTIES = [
  {
    id: 1,
    title: 'Bounty 1',
    description: 'Complete your first check-in at any event.',
    points: 50,
    completed: false,
  },
  {
    id: 2,
    title: 'Bounty 2',
    description: 'Interact with 3 other participants.',
    points: 75,
    completed: false,
  },
  {
    id: 3,
    title: 'Bounty 3',
    description: 'Attend the opening ceremony.',
    points: 100,
    completed: false,
  },
];

export default function BountiesDrawer({ open, onClose }) {
  const drawerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Trap body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-[250ms] ease-in-out"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 bottom-0 w-full flex flex-col z-50 transition-transform duration-300"
        style={{
          maxWidth: 420,
          backgroundColor: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="text-xl font-bold m-0" style={{ color: 'var(--foreground)' }}>
              Bounties
            </h2>
            <p className="text-[13px] mt-0.5 m-0 opacity-55" style={{ color: 'var(--foreground)' }}>
              Complete challenges to earn bonus points.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg text-lg leading-none cursor-pointer border-none shrink-0"
            style={{
              background: 'var(--button)',
              width: 32,
              height: 32,
              color: 'var(--foreground)',
            }}
            aria-label="Close bounties"
          >
            ×
          </button>
        </div>

        {/* Bounty list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {BOUNTIES.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: b.completed
                  ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                  : 'transparent',
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center rounded-[10px] text-lg shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: b.completed ? 'var(--primary)' : 'var(--button)',
                }}
              >
                {b.completed ? '✓' : '🎯'}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="m-0 text-sm font-semibold"
                  style={{
                    color: 'var(--foreground)',
                    textDecoration: b.completed ? 'line-through' : 'none',
                    opacity: b.completed ? 0.5 : 1,
                  }}
                >
                  {b.title}
                </p>
                <p className="m-0 mt-0.5 text-xs opacity-55" style={{ color: 'var(--foreground)' }}>
                  {b.description}
                </p>
              </div>

              {/* Points badge */}
              <div
                className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-bold whitespace-nowrap"
                style={{
                  backgroundColor: b.completed
                    ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
                    : 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                +{b.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}