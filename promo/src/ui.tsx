import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { fonts, useLayout, usePalette } from './theme';

// One long ease out for every entrance, so the whole video moves with the same feel.
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

// 0 before `delay`, easing to 1 over `duration` frames.
export const useProgress = (delay: number, duration = 24): number => {
    const frame = useCurrentFrame();

    return interpolate(frame, [delay, delay + duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
};

// Fades a scene in over its first frames and out over its last, drifting up through both. The opening scene skips the fade in.
export const useSceneFade = (duration: number, edge = 20, fadeIn = true): CSSProperties => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, edge, duration - edge, duration], [fadeIn ? 0 : 1, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.quad),
    });
    const enter = interpolate(frame, [0, edge * 1.5], [fadeIn ? 30 : 0, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
    const leave = interpolate(frame, [duration - edge, duration], [0, -20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });

    return { opacity, transform: `translateY(${enter + leave}px)` };
};

export const Rise = ({ delay, children, style }: { delay: number; children: ReactNode; style?: CSSProperties }) => {
    const t = useProgress(delay);

    return <div style={{ opacity: t, transform: `translateY(${(1 - t) * 24}px)`, ...style }}>{children}</div>;
};

// Slides a line up from behind a mask, like a title card.
const Reveal = ({ delay, children }: { delay: number; children: ReactNode }) => {
    const t = useProgress(delay, 28);

    return (
        <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em' }}>
            <span style={{ display: 'block', transform: `translateY(${(1 - t) * 105}%)` }}>{children}</span>
        </span>
    );
};

export const Eyebrow = ({ children }: { children: ReactNode }) => {
    const p = usePalette();
    const layout = useLayout();

    return (
        <div
            style={{
                fontFamily: fonts.mono,
                fontWeight: 500,
                fontSize: layout === 'landscape' ? 19 : 22,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: p.eyebrow,
            }}
        >
            {children}
        </div>
    );
};

// `delay` staggers the two lines in; pass a negative one to have them already in place at the first frame.
export const Headline = ({ lead, accent, size, delay = 0 }: { lead: string; accent: string; size: number; delay?: number }) => {
    const p = usePalette();

    return (
        <h1 style={{ margin: 0, fontFamily: fonts.sans, fontWeight: 600, fontSize: size, lineHeight: 0.95, letterSpacing: '-0.035em', color: p.text }}>
            <Reveal delay={delay}>{lead}</Reveal>
            <Reveal delay={delay + 6}>
                <em
                    style={{
                        display: 'block',
                        fontFamily: fonts.serif,
                        fontWeight: 400,
                        fontStyle: 'italic',
                        fontSize: size * 1.18,
                        letterSpacing: '-0.01em',
                        color: p.accent,
                    }}
                >
                    {accent}
                </em>
            </Reveal>
        </h1>
    );
};

export const Body = ({ children, size }: { children: ReactNode; size: number }) => {
    const p = usePalette();

    return <p style={{ margin: 0, fontFamily: fonts.sans, fontSize: size, lineHeight: 1.4, color: p.muted }}>{children}</p>;
};

export const Chip = ({ children, size }: { children: ReactNode; size: number }) => {
    const p = usePalette();

    return (
        <span
            style={{
                display: 'inline-block',
                padding: `${size * 0.55}px ${size * 0.85}px`,
                borderRadius: 999,
                background: p.chipBg,
                boxShadow: `inset 0 0 0 1.5px ${p.chipBorder}`,
                backdropFilter: 'blur(8px)',
                fontFamily: fonts.mono,
                fontWeight: 500,
                fontSize: size,
                lineHeight: 1,
                color: p.chipText,
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </span>
    );
};
