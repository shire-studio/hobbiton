import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { Painting } from './Painting';
import { durations, type SceneName, scenes } from './scenes';
import { type Layout, LayoutContext, paletteAt, PaletteContext } from './theme';


// The full cut walks through everything. The short cut keeps the title, the CLI and the kits for feeds that favour 15 to 30 seconds.
export const cuts = {
    full: ['intro', 'create', 'kits', 'imports', 'api', 'later', 'update', 'outro'],
    short: ['intro', 'create', 'kits', 'outro'],
} satisfies Record<string, SceneName[]>;

export type Cut = keyof typeof cuts;

// Each scene starts this many frames before the last one ends, so they cross-fade.
const OVERLAP = 20;

const startsOf = (cut: Cut): number[] =>
    cuts[cut].reduce<number[]>((all, _scene, i) => [...all, i === 0 ? 0 : all[i - 1] + durations[cuts[cut][i - 1]] - OVERLAP], []);

export const durationOf = (cut: Cut): number => startsOf(cut).at(-1)! + durations.outro;

export const Promo = ({ layout, cut }: { layout: Layout; cut: Cut }) => {
    const frame = useCurrentFrame();
    const starts = startsOf(cut);
    const outroStart = starts.at(-1)!;

    // Day holds until time passes: the sun sets through the later card and the update, and night arrives with the outro.
    // The short cut has no later card, so its dusk falls over the scene before the outro.
    const order: SceneName[] = cuts[cut];
    const laterStart = order.includes('later') ? starts[order.indexOf('later')] : outroStart - 150;
    const dusk = interpolate(frame, [0, laterStart, outroStart, outroStart + 60], [0, 0.05, 0.5, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    return (
        <LayoutContext.Provider value={layout}>
            <AbsoluteFill>
                <Painting dusk={dusk} progress={frame / durationOf(cut)} />
                <Veil layout={layout} dusk={dusk} />
                {cuts[cut].map((name, i) => {
                    const Scene = scenes[name];

                    return (
                        // Text keeps the day ink for contrast, except in the outro, which sits on the night sky.
                        <PaletteContext.Provider key={name} value={paletteAt(name === 'outro' ? 1 : 0)}>
                            <Sequence name={name} from={starts[i]} durationInFrames={durations[name]}>
                                <Scene />
                            </Sequence>
                        </PaletteContext.Provider>
                    );
                })}
            </AbsoluteFill>
        </LayoutContext.Provider>
    );
};

// Keeps the text legible over the painting, as the website's hero does: a soft wash of paper where the captions sit,
// denser at night when the clouds are bright behind light text.
const Veil = ({ layout, dusk }: { layout: Layout; dusk: number }) => {
    const { paper } = paletteAt(dusk);
    const core = Math.round(interpolate(dusk, [0, 1], [55, 82]));
    const shape = layout === 'landscape' ? 'ellipse 62% 75% at 24% 46%' : 'ellipse 140% 50% at 40% 30%';

    return <AbsoluteFill style={{ background: `radial-gradient(${shape}, color-mix(in oklab, ${paper} ${core}%, transparent) 30%, transparent 78%)` }} />;
};
