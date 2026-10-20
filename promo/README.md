# Promo Video

A Remotion video that shows off the starter kit CLI for social media. Its background is the layered oil landscape from the Shire Studio website hero (`app/components/PaintedLandscape.vue` in shire-studio/website). The paintings live in `public/hero`, and the planes drift with a slow camera move where the site follows the pointer. Day turns to night as it plays.

It has no studio branding on purpose. Only the `shire-kit` command appears.

## Story

The video follows one app from its first day to six months later, and the painting follows it from afternoon to moonlight.

1. **Intro.** The title over the Hobbiton scene, in place from the first frame, with the six kits.
2. **Create.** `shire-kit new` picks a kit, builds the frontend and starts a git repository.
3. **Kits.** Six frontends on the same backend.
4. **Imports.** `AppLogo` in React and Svelte and `Profile.vue` in Vue, with what each kit auto imports highlighted.
5. **API.** Logging in to the API kit with `curl` and fetching the user.
6. **Later.** Six months on, a release is out and the app has drifted from it. Dusk falls.
7. **Update.** `shire-kit update` hands the release to a coding agent, which merges it into the changed app.
8. **Outro.** The title and `shire-kit new my-app` under the moon, with the owl and bats out.

## Cuts

| Cut | Length | Scenes |
| --- | --- | --- |
| Full | 59 seconds | All eight |
| Short | 27 seconds | Intro, Create, Kits and Outro, for feeds that favour 15 to 30 seconds |

Each cut renders at 1920 by 1080 and 1080 by 1920. The opening frame already shows the title, so the thumbnail and a muted autoplay both make sense without sound.

The terminal copy comes from the CLI's `NewCommand` and `UpdateCommand`, the code from the `inertia-*` smials and the JSON from a real API kit, so update them here when those change. The portrait create scene passes `--pnpm`, which skips the longest prompt so the text can stay large. Scene lengths live in `durations` in `src/scenes.tsx`.

## Commands

> Requires Node 22+ and pnpm.

```bash
pnpm install

# Preview and scrub through both compositions
pnpm studio

# Render both cuts in both formats into out/
pnpm render
```

Use `pnpm render:landscape`, `render:portrait`, `render:landscape-short` or `render:portrait-short` to render just one. The first render downloads a headless Chrome, so it is slower than the rest.
