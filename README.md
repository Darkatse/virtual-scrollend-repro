# virtual-scrollend-repro

With `useScrollendEvent: true`, `scrollToIndex` stops short when its target
moves further than a size correction while the command settles.

Live: https://virtual-scrollend-repro.darkatse.workers.dev
(`?scrollend=0` runs the same steps with `useScrollendEvent: false`, which
lands.)

It uses the published `@tanstack/react-virtual` 3.14.26
(`@tanstack/virtual-core` 3.19.11). Run calls
`scrollToIndex(60, { align: 'center' })`. In the frame after its scroll
event, row 55 (above the viewport) grows to 100px and row 58 (in view, above
row 60) grows to 150px. The virtualizer corrects the scroll position for row
55 only, so row 60 moves further than the correction.

Expected: `scrollTop` 2975, row 60 centred. Actual in Chromium and WebKit:
2875, and the command has ended.

All the code is in `src/main.tsx`.

```sh
pnpm install
pnpm dev
```

Deployed to Cloudflare Workers with `cf deploy`.
