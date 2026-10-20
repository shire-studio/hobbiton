import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { Code, type CodeTab } from './Code';
import { type Step, stretch, Terminal } from './Terminal';
import { fonts, type Layout, useLayout, usePalette } from './theme';
import { Body, Chip, Eyebrow, Headline, Rise, useProgress, useSceneFade } from './ui';

export const kits = [
    { flag: 'vue', name: 'Vue', stack: 'Inertia, Vue 3 and shadcn-vue', door: '#3f7a4f' },
    { flag: 'react', name: 'React', stack: 'Inertia, React 19 and shadcn/ui', door: '#3b6ea5' },
    { flag: 'svelte', name: 'Svelte', stack: 'Inertia, Svelte 5 and shadcn-svelte', door: '#b5543a' },
    { flag: 'livewire', name: 'Livewire', stack: 'Livewire 4 and Flux', door: '#7356a0' },
    { flag: 'api', name: 'API', stack: 'Sanctum tokens and JSON resources', door: '#2f7f7a' },
    { flag: 'blade', name: 'Blade', stack: 'Blade views and Tailwind CSS', door: '#c08a2c' },
];

const kitOptions = kits.map((kit) => `${kit.name} (${kit.stack})`);

export const durations = { intro: 150, create: 360, kits: 180, imports: 330, api: 260, later: 120, update: 330, outro: 180 };

export type SceneName = keyof typeof durations;

// A caption beside (landscape) or above (portrait) the scene's main visual.
const Split = ({ duration, caption, children }: { duration: number; caption: ReactNode; children: ReactNode }) => {
    const layout = useLayout();
    const fade = useSceneFade(duration);
    const landscape = layout === 'landscape';

    return (
        <AbsoluteFill
            style={{
                ...fade,
                display: 'flex',
                flexDirection: landscape ? 'row' : 'column',
                alignItems: landscape ? 'center' : 'stretch',
                gap: landscape ? 60 : 50,
                padding: landscape ? '0 120px' : '150px 60px 0',
            }}
        >
            <div style={{ width: landscape ? 620 : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 26 }}>{caption}</div>
            <div style={{ flex: landscape ? 1 : undefined, minWidth: 0 }}>{children}</div>
        </AbsoluteFill>
    );
};

const Caption = ({ label, lead, accent, body }: { label: string; lead: string; accent: string; body: string }) => {
    const layout = useLayout();
    const landscape = layout === 'landscape';

    return (
        <>
            <Rise delay={2}><Eyebrow>{label}</Eyebrow></Rise>
            <Headline lead={lead} accent={accent} size={landscape ? 64 : 92} delay={4} />
            <Rise delay={14}><Body size={landscape ? 26 : 34}>{body}</Body></Rise>
        </>
    );
};

const PanelIn = ({ children }: { children: ReactNode }) => {
    const t = useProgress(8, 32);

    return <div style={{ opacity: t, transform: `translateY(${(1 - t) * 50}px) scale(${0.98 + t * 0.02})` }}>{children}</div>;
};

// The opening is the Hobbiton header come to life: the title is already in place at the first frame, so the
// thumbnail and a muted autoplay both read, and the rest settles in around it.
export const Intro = () => {
    const layout = useLayout();
    const fade = useSceneFade(durations.intro, 24, false);
    const landscape = layout === 'landscape';

    return (
        <AbsoluteFill style={{ ...fade, padding: landscape ? '0 140px' : '260px 80px 0', justifyContent: landscape ? 'center' : 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 34, marginTop: landscape ? -200 : 0 }}>
                <Eyebrow>Laravel 13 · PHP 8.5</Eyebrow>
                <Headline lead="Laravel" accent="Starter Kits" size={landscape ? 150 : 158} delay={-40} />
                <Rise delay={10}><Body size={landscape ? 34 : 42}>Vue, React, Svelte, Livewire, Blade or a plain JSON API, set up with one command.</Body></Rise>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, maxWidth: landscape ? 1100 : 920 }}>
                    {kits.map((kit, i) => (
                        <Rise key={kit.flag} delay={24 + i * 5}><Chip size={landscape ? 24 : 30}>{kit.flag}</Chip></Rise>
                    ))}
                </div>
            </div>
        </AbsoluteFill>
    );
};

// Portrait passes --pnpm, which skips the longest prompt just as the real CLI does, so the text can stay large.
const createSteps = (layout: Layout): Step[] => stretch(createScript(layout));

const createScript = (layout: Layout): Step[] => {
    const landscape = layout === 'landscape';
    const t = landscape ? 146 : 122;

    return [
        { type: 'command', at: 8, cwd: '~/Sites', text: landscape ? 'shire-kit new example-app' : 'shire-kit new example-app --pnpm', speed: 1.4 },
        {
            type: 'select',
            at: 34,
            label: 'Which starter kit would you like to use?',
            options: kitOptions,
            moves: [44, 49, 54, 59, 68, 73, 78].map((at, i) => ({ at, index: [1, 2, 3, 4, 3, 2, 1][i] })),
            submitAt: 90,
        },
        ...(landscape
            ? [
                { type: 'confirm', at: 98, label: 'Would you like to install the frontend dependencies and build the assets?', submitAt: 116 } as const,
                { type: 'confirm', at: 122, label: 'Would you like to initialise a git repository?', submitAt: 138 } as const,
            ]
            : [{ type: 'confirm', at: 98, label: 'Would you like to initialise a git repository?', submitAt: 114 } as const]),
        { type: 'spin', at: t, until: t + 12, label: 'Resolving the latest React starter kit release...' },
        { type: 'info', at: t + 12, lines: ['Using the React starter kit v1.0.1.'] },
        { type: 'spin', at: t + 14, until: t + 28, label: 'Creating [example-app] from the React starter kit...' },
        { type: 'info', at: t + 28, lines: ['Project created in [/Users/you/Sites/example-app].'] },
        { type: 'spin', at: t + 30, until: t + 52, label: 'Installing the frontend dependencies and building the assets...' },
        { type: 'info', at: t + 52, lines: ['Frontend assets built.'] },
        { type: 'spin', at: t + 54, until: t + 64, label: 'Initialising a git repository...' },
        { type: 'info', at: t + 64, lines: ['Git repository initialised.'] },
        { type: 'note', at: t + 70, lines: ['', 'Next steps:', '  cd example-app', '  composer dev'] },
        { type: 'outro', at: t + 76, lines: ['', 'Your project is ready.'] },
    ];
};

export const Create = () => {
    const layout = useLayout();

    return (
        <Split
            duration={durations.create}
            caption={<Caption label="shire-kit new" lead="Start a new app" accent="with one command" body="Pick a kit. It installs, builds the frontend and makes your first commit." />}
        >
            <PanelIn><Terminal steps={createSteps(layout)} title="~/Sites" visibleLines={22} /></PanelIn>
        </Split>
    );
};

export const Kits = () => {
    const layout = useLayout();
    const fade = useSceneFade(durations.kits);
    const landscape = layout === 'landscape';

    return (
        <AbsoluteFill style={{ ...fade, padding: landscape ? '110px 120px 0' : '150px 60px 0', gap: landscape ? 50 : 60 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                <Rise delay={2}><Eyebrow>--kit</Eyebrow></Rise>
                <Headline lead="Same backend," accent="your choice of frontend" size={landscape ? 80 : 84} delay={4} />
                <Rise delay={14}><Body size={landscape ? 26 : 34}>Every kit runs the same actions, models and tests underneath.</Body></Rise>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: landscape ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: landscape ? 26 : 28 }}>
                {kits.map((kit, i) => <KitCard key={kit.flag} kit={kit} delay={18 + i * 5} />)}
            </div>
        </AbsoluteFill>
    );
};

const KitCard = ({ kit, delay }: { kit: (typeof kits)[number]; delay: number }) => {
    const p = usePalette();
    const layout = useLayout();
    const t = useProgress(delay, 30);
    const landscape = layout === 'landscape';

    return (
        <div
            style={{
                opacity: t,
                transform: `translateY(${(1 - t) * 36}px) scale(${0.96 + t * 0.04})`,
                display: 'flex',
                flexDirection: landscape ? 'row' : 'column',
                alignItems: landscape ? 'center' : 'flex-start',
                gap: landscape ? 26 : 20,
                padding: '28px 30px',
                borderRadius: 26,
                background: p.chipBg,
                boxShadow: `inset 0 0 0 1.5px ${p.chipBorder}`,
                backdropFilter: 'blur(12px)',
            }}
        >
            <Door color={kit.door} size={landscape ? 84 : 80} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: landscape ? 40 : 46, letterSpacing: '-0.03em', color: p.text }}>{kit.name}</div>
                <div style={{ fontFamily: fonts.sans, fontSize: landscape ? 21 : 26, lineHeight: 1.3, color: p.muted }}>{kit.stack}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: landscape ? 17 : 22, color: p.accent }}>--kit={kit.flag}</div>
            </div>
        </div>
    );
};

// A round smial door, like the one in the hill.
const Door = ({ color, size }: { color: string; size: number }) => {
    const p = usePalette();

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
            <circle cx="50" cy="50" r="48" fill={p.frame} />
            <circle cx="50" cy="50" r="40" fill={color} />
            <g stroke="rgba(0, 0, 0, 0.16)" strokeWidth="2">
                <line x1="31" y1="16" x2="31" y2="84" /><line x1="50" y1="10" x2="50" y2="90" /><line x1="69" y1="16" x2="69" y2="84" />
            </g>
            <circle cx="50" cy="50" r="5" fill={p.knob} />
        </svg>
    );
};

// Trimmed from each kit's AppLogo and from the Vue kit's settings/Profile.vue, with long class lists shortened.
const importTabs: CodeTab[] = [
    {
        file: 'resources/js/components/AppLogo.tsx',
        from: 0,
        lines: [
            `import AppLogoIcon from '@/components/AppLogoIcon'`,
            ``,
            `export default function AppLogo() {`,
            `  const { name } = ⟦a|usePage⟧().props`,
            ``,
            `  return (`,
            `    <div className="flex items-center">`,
            `      <div className="flex size-8 items-center rounded-md">`,
            `        <AppLogoIcon className="size-5 fill-current" />`,
            `      </div>`,
            `      <span className="ml-1 truncate font-semibold">`,
            `        {name}`,
            `      </span>`,
            `    </div>`,
            `  )`,
            `}`,
        ],
        notes: [{ group: 'a', at: 26, text: 'React: usePage is there without an import' }],
    },
    {
        file: 'resources/js/components/AppLogo.svelte',
        from: 100,
        lines: [
            `<script lang="ts">`,
            `  import AppLogoIcon from '@/components/AppLogoIcon.svelte'`,
            ``,
            `  const name = $derived(⟦a|page⟧.props.name)`,
            `</script>`,
            ``,
            `<div class="flex items-center">`,
            `  <div class="flex size-8 items-center rounded-md">`,
            `    <AppLogoIcon class="size-5 fill-current" />`,
            `  </div>`,
            `  <span class="ml-1 truncate font-semibold">{name}</span>`,
            `</div>`,
        ],
        notes: [{ group: 'a', at: 122, text: 'Svelte: so is page' }],
    },
    {
        file: 'resources/js/pages/settings/Profile.vue',
        from: 200,
        lines: [
            `<script setup lang="ts">`,
            `import { update } from '@/routes/user-profile'`,
            ``,
            `const props = defineProps<{ status: string | null }>()`,
            ``,
            `const page = ⟦a|usePage⟧()`,
            `const user = ⟦a|computed⟧(() => page.props.auth.user!)`,
            `const linkSent = ⟦a|computed⟧(() =>`,
            `  props.status ===`,
            `    ('verification-link-sent' satisfies App.Enums.SessionStatus),`,
            `)`,
            `</script>`,
            ``,
            `<template>`,
            `  <⟦b|AppLayout⟧>`,
            `    <⟦b|Head⟧ title="Profile settings" />`,
            `    <⟦b|Form⟧ v-bind="⟦c|update.form()⟧" v-slot="{ errors }">`,
            `      <⟦b|UiInput⟧ name="name" :default-value="user.name" />`,
            `      <⟦b|InputError⟧ :message="errors.name" />`,
            `    </Form>`,
            `  </AppLayout>`,
            `</template>`,
        ],
        notes: [
            { group: 'a', at: 218, text: 'Vue: usePage and computed too' },
            { group: 'b', at: 258, text: 'In the Vue kit, components need no imports either' },
            { group: 'c', at: 296, text: 'Routes are typed from your PHP by Wayfinder' },
        ],
    },
];

export const Imports = () => (
    <Split
        duration={durations.imports}
        caption={<Caption label="Vue, React and Svelte" lead="Hooks and composables," accent="no import lines" body="usePage, your own composables and the framework APIs are imported for you. In Vue, components are too." />}
    >
        <PanelIn><Code tabs={importTabs} /></PanelIn>
    </Split>
);

// Real responses from the API kit, with the token shortened.
const apiSteps: Step[] = stretch([
    { type: 'command', at: 8, cwd: 'example-api', text: 'curl example-api.test/login -d email=frodo@example.com -d password=••••••', speed: 2.5 },
    {
        type: 'json',
        at: 44,
        lines: [
            '{',
            '  "token": "3|q8ZrWkT2nB7vXy4LmP0sD5fHjQ...",',
            '  "user": {',
            '    "id": "01a15a6b-e764-703f-a9f2-d635ae433ae2",',
            '    "name": "Frodo Baggins",',
            '    "email": "frodo@example.com",',
            '    "email_verified_at": null',
            '  }',
            '}',
        ],
    },
    { type: 'note', at: 62, lines: [''] },
    { type: 'command', at: 68, cwd: 'example-api', text: 'curl example-api.test/user -H "Authorization: Bearer 3|q8Zr..."', speed: 2.5 },
    {
        type: 'json',
        at: 100,
        lines: [
            '{',
            '  "data": {',
            '    "id": "01a15a6b-e764-703f-a9f2-d635ae433ae2",',
            '    "name": "Frodo Baggins",',
            '    "email": "frodo@example.com",',
            '    "email_verified_at": null',
            '  }',
            '}',
        ],
    },
]);

export const Api = () => {
    const layout = useLayout();

    return (
        <Split
            duration={durations.api}
            caption={<Caption label="API kit" lead="No frontend?" accent="Use the API kit" body="Sanctum tokens and JSON resources, built on the same actions as the other kits." />}
        >
            <PanelIn><Terminal steps={apiSteps} title="~/Sites/example-api" visibleLines={layout === 'landscape' ? 22 : 25} /></PanelIn>
        </Split>
    );
};

const updateSteps: Step[] = stretch([
    { type: 'command', at: 8, cwd: '~/Sites/example-app', text: 'shire-kit update', speed: 1.2 },
    { type: 'spin', at: 26, until: 38, label: 'Resolving the latest starter kit release...' },
    {
        type: 'select',
        at: 42,
        label: 'Which agent should apply the update?',
        options: ['Claude Code', 'Codex', 'Gemini CLI', 'OpenCode', 'Cursor', 'None, just give me the files'],
        moves: [],
        submitAt: 64,
    },
    { type: 'spin', at: 70, until: 84, label: 'Preparing the changes from starter kit v1.0.0 to v1.0.1...' },
    { type: 'info', at: 84, lines: ['Prepared 12 changed files from starter kit v1.0.0 to v1.0.1 in [.starter-kit-update].'] },
    { type: 'agent', at: 90, until: 140, agent: 'Claude Code', task: '.starter-kit-update/PROMPT.md' },
    { type: 'note', at: 144, lines: ['', 'Changed files:', '  composer.json', '  app/Http/Middleware/HandleInertiaRequests.php', '  resources/js/pages/Dashboard.tsx'] },
    { type: 'confirm', at: 150, label: 'Mark the project as updated to starter kit v1.0.1?', submitAt: 166 },
    { type: 'note', at: 170, lines: ['', 'Next steps:', '  Review the changes with git diff'] },
    { type: 'outro', at: 176, lines: ['', 'The project is updated to starter kit v1.0.1.'] },
]);

// Time passes: dusk falls, the kit ships a release, and your app has drifted from where it started.
export const Later = () => {
    const layout = useLayout();
    const fade = useSceneFade(durations.later);
    const landscape = layout === 'landscape';

    return (
        <AbsoluteFill style={{ ...fade, padding: landscape ? '0 140px' : '0 60px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: landscape ? -160 : -420 }}>
                <Rise delay={0}><Eyebrow>Six months later</Eyebrow></Rise>
                <Headline lead="A new release is out" accent="and your app has moved on" size={landscape ? 84 : 76} delay={2} />
                <Branches />
            </div>
        </AbsoluteFill>
    );
};

// Your app and the starter kit drift apart from the release the project began with.
const Branches = () => {
    const p = usePalette();
    const layout = useLayout();
    const draw = useProgress(14, 40);
    const width = layout === 'landscape' ? 1100 : 960;
    const label = { fontFamily: fonts.mono, fontSize: layout === 'landscape' ? 22 : 26 };
    const yours = `M40 110 C 220 110, 260 40, 420 40 L ${width - 40} 40`;
    const kit = `M40 110 C 220 110, 260 180, 420 180 L ${width - 40} 180`;

    return (
        <svg width={width} height={230} style={{ overflow: 'visible' }}>
            <path d={yours} fill="none" stroke={p.accent} strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
            <path d={kit} fill="none" stroke={p.eyebrow} strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
            <circle cx="40" cy="110" r="10" fill={p.text} />
            {[0.45, 0.6, 0.75, 0.9].map((at) => (
                <circle key={at} cx={420 + (width - 460) * ((at - 0.45) / 0.45)} cy="40" r="8" fill={p.accent} opacity={draw >= at ? 1 : 0} />
            ))}
            <circle cx={width - 40} cy="180" r="10" fill={p.eyebrow} opacity={draw >= 0.95 ? 1 : 0} />
            <text x="40" y="160" fill={p.muted} style={label}>v1.0.0</text>
            <text x={width - 40} y="16" textAnchor="end" fill={p.accent} style={label} opacity={draw}>your changes</text>
            <text x={width - 40} y="226" textAnchor="end" fill={p.muted} style={label} opacity={draw}>v1.0.1</text>
        </svg>
    );
};

export const Update = () => (
    <Split
        duration={durations.update}
        caption={<Caption label="shire-kit update" lead="Bring it in" accent="without starting over" body="Pick a coding agent. It merges the release into your code, then you review the diff." />}
    >
        <PanelIn><Terminal steps={updateSteps} title="~/Sites/example-app" visibleLines={22} /></PanelIn>
    </Split>
);

export const Outro = () => {
    const layout = useLayout();
    const p = usePalette();
    const fade = useSceneFade(durations.outro + 20);
    const landscape = layout === 'landscape';

    return (
        <AbsoluteFill style={{ ...fade, padding: landscape ? '0 140px' : '300px 80px 0', justifyContent: landscape ? 'center' : 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: landscape ? -180 : 0 }}>
                <Headline lead="Laravel" accent="Starter Kits" size={landscape ? 150 : 158} delay={10} />
                <Rise delay={30}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 18,
                            padding: landscape ? '22px 30px' : '26px 34px',
                            borderRadius: 20,
                            background: 'rgba(8, 13, 24, 0.85)',
                            boxShadow: 'inset 0 0 0 1.5px rgba(160, 200, 255, 0.16)',
                            fontFamily: fonts.mono,
                            fontSize: landscape ? 36 : 44,
                            color: '#dbe3ea',
                        }}
                    >
                        <span style={{ color: p.accent }}>❯</span>shire-kit new my-app
                    </div>
                </Rise>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, maxWidth: landscape ? 1100 : 920 }}>
                    {kits.map((kit, i) => (
                        <Rise key={kit.flag} delay={40 + i * 3}><Chip size={landscape ? 24 : 30}>{kit.flag}</Chip></Rise>
                    ))}
                </div>
            </div>
        </AbsoluteFill>
    );
};

export const scenes: Record<SceneName, () => ReactNode> = { intro: Intro, create: Create, kits: Kits, imports: Imports, api: Api, later: Later, update: Update, outro: Outro };
