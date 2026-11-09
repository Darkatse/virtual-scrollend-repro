# virtual-scrollend-repro

A one-page reproduction of a TanStack Virtual bug: with
`useScrollendEvent: true`, `scrollToIndex` can stop before it reaches its
target.

Try it: https://virtual-scrollend-repro.darkatse.workers.dev

## Steps

1. Open the page and click **Run**.
2. Click **run with false**, then click **Run** again.

## What you should see

Row 60 (yellow) should end up on the dashed line in the middle of the list.

| `useScrollendEvent` | Result |
| --- | --- |
| `true` | Row 60 stops 100px below the line: `scrollTop` is 2875 instead of 2975, and the scroll is over. |
| `false` | Row 60 is on the line: `scrollTop` is 2975. |

It happens every time, in Chromium and in WebKit.

## What Run does

It calls `scrollToIndex(60, { align: 'center' })`, which scrolls to 2825.
In the next frame two rows grow:

- Row 55 is above the visible area. It grows from 50px to 100px, and the
  virtualizer moves the scroll position down 50px (to 2875) so the visible
  rows stay put.
- Row 58 is visible, above row 60. It grows from 50px to 150px. Nothing
  moves for it, so row 60 is now another 100px further down, and centring it
  needs 2975.

The virtualizer would scroll to 2975 on the next frame. With
`useScrollendEvent`, though, the `scrollend` the browser fires for the 50px
move arrives first, and the virtualizer takes it for the user scrolling
away. It cancels the scroll and leaves the list at 2875.

With `useScrollendEvent: false` that report comes later, after the
virtualizer has already scrolled to 2975.

## Versions

`@tanstack/react-virtual` 3.14.26, which uses `@tanstack/virtual-core`
3.19.11. The version is pinned, so the page keeps showing the bug after a fix
is released. The bug goes back to virtual-core 3.18.0.

## Run it yourself

```sh
pnpm install
pnpm dev
```

All the code is in `src/main.tsx`. `pnpm run deploy` publishes the page to
Cloudflare Workers with the Cloudflare CLI (`cf deploy`).
