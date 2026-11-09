import React from 'react'
import ReactDOM from 'react-dom/client'
import { flushSync } from 'react-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { dependencies } from '../package.json'

const COUNT = 100
const ESTIMATE = 50
const VIEWPORT = 400
const TARGET = 60
// Row 55 is above the viewport when the command lands, so the virtualizer
// corrects the scroll position for it. Row 58 is in view, above the target,
// so it does not. Row 60 moves further than the correction.
const GROWN: Record<number, number> = { 55: 100, 58: 150 }

const scrollend = new URLSearchParams(location.search).get('scrollend') !== '0'

type Result = { scrollTop: number; expected: number }

function App() {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const [sizes, setSizes] = React.useState(() =>
    Array<number>(COUNT).fill(ESTIMATE),
  )
  const [ran, setRan] = React.useState(false)
  const [result, setResult] = React.useState<Result | null>(null)

  const virtualizer = useVirtualizer({
    count: COUNT,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATE,
    overscan: 2,
    useScrollendEvent: scrollend,
  })

  const run = () => {
    const el = parentRef.current!
    setRan(true)
    // In the frame after the command's scroll event, both rows grow in one
    // commit, so one ResizeObserver batch measures them.
    el.addEventListener(
      'scroll',
      () =>
        requestAnimationFrame(() =>
          flushSync(() =>
            setSizes((s) => s.map((size, i) => GROWN[i] ?? size)),
          ),
        ),
      { once: true },
    )
    virtualizer.scrollToIndex(TARGET, { align: 'center' })
    setTimeout(() => {
      setResult({
        scrollTop: el.scrollTop,
        expected: virtualizer.getOffsetForIndex(TARGET, 'center')![0],
      })
    }, 1000)
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, padding: 16 }}>
      <h1 style={{ fontSize: 20 }}>scrollToIndex with useScrollendEvent</h1>
      <p>
        <code>@tanstack/react-virtual</code>{' '}
        {dependencies['@tanstack/react-virtual']},{' '}
        <code>useScrollendEvent: {String(scrollend)}</code> (
        <a href={scrollend ? '?scrollend=0' : '?scrollend=1'}>
          run with {String(!scrollend)}
        </a>
        )
      </p>
      <p>
        Run calls <code>scrollToIndex({TARGET}, {'{'} align: 'center' {'}'})</code>.
        In the frame after its scroll event, row 55 (above the viewport) grows
        to 100px and row 58 (in view, above row {TARGET}) grows to 150px. The
        virtualizer corrects the scroll position for row 55 only, so row{' '}
        {TARGET} moves further than the correction. Row {TARGET} should end up
        centred on the line.
      </p>
      <p>
        <button onClick={run} disabled={ran}>
          Run
        </button>{' '}
        <a href={location.search || '?'}>Reset</a>
      </p>
      <p data-testid="result" style={{ minHeight: '1.5em' }}>
        {result === null
          ? ran
            ? 'Waiting 1s for the command to settle…'
            : ''
          : result.scrollTop === result.expected
            ? `scrollTop ${result.scrollTop}: row ${TARGET} is centred.`
            : `scrollTop ${result.scrollTop}, but row ${TARGET} centred is ${result.expected}: ` +
              `stopped ${result.expected - result.scrollTop}px short.`}
      </p>
      <div style={{ position: 'relative', border: '1px solid #888' }}>
        <div
          ref={parentRef}
          data-testid="scroll-container"
          style={{ height: VIEWPORT, overflow: 'auto' }}
        >
          <div
            style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((item) => (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <div
                  style={{
                    height: sizes[item.index],
                    boxSizing: 'border-box',
                    borderBottom: '1px solid #ddd',
                    padding: '0 8px',
                    background:
                      item.index === TARGET
                        ? '#ffd54f'
                        : item.index in GROWN
                          ? '#e3f2fd'
                          : undefined,
                  }}
                >
                  Row {item.index}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: VIEWPORT / 2,
            borderTop: '2px dashed #e53935',
            pointerEvents: 'none',
          }}
        />
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
