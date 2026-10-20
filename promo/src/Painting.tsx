import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useLayout } from './theme';

// The layered oil landscape from the Shire Studio website hero (app/components/PaintedLandscape.vue), rebuilt for
// video. Each band of depth is its own plane at the same offsets the site uses. Where the site moves the planes
// with the pointer, a slow camera drift moves them here, so the valley opens up over the length of the video.
// Each band has a day and a night painting, and `dusk` cross fades between them.

const REM = 16;
const PAN = 18;
const hero = (name: string) => staticFile(`hero/${name}.webp`);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Day and night clouds pair up by index. `top` and `size` are percentages of the frame, `speed` the seconds a
// crossing takes (quicker than the site's, so they visibly move within a short video) and `start` how far
// through a crossing each one begins.
const clouds = [
    { day: 3, night: 2, top: 3, size: 30, speed: 90, start: 0.12 },
    { day: 6, night: 5, top: 10, size: 19, speed: 70, start: 0.62 },
    { day: 2, night: 1, top: 24, size: 24, speed: 80, start: 0.38 },
    { day: 1, night: 3, top: 1, size: 22, speed: 100, start: 0.86 },
    { day: 7, night: 7, top: 7, size: 21, speed: 84, start: 0.3 },
    { day: 8, night: 8, top: 29, size: 26, speed: 74, start: 0.75 },
    { day: 10, night: 10, top: 0, size: 18, speed: 105, start: 0.55 },
];

// Swallows keep to the top of the sky, above the captions.
const swallows = [
    { top: 6, size: 1.6, delay: 0 },
    { top: 9, size: 1.3, delay: 0.9 },
    { top: 4, size: 1.15, delay: 1.6 },
    { top: 11, size: 1, delay: 2.8 },
    { top: 7, size: 0.9, delay: 3.5 },
];

const bats = [
    { x: 64, y: 8, size: 1.9, speed: 13, delay: 0 },
    { x: 72, y: 20, size: 1.5, speed: 11, delay: 4 },
    { x: 56, y: 26, size: 1.3, speed: 15, delay: 7 },
    { x: 44, y: 46, size: 1, speed: 14, delay: 9 },
];

const motes = Array.from({ length: 30 }, (_, i) => ({
    x: 18 + random(`mote-x-${i}`) * 82,
    y: 45 + random(`mote-y-${i}`) * 50,
    size: 3 + random(`mote-s-${i}`) * 4,
    speed: 10 + random(`mote-v-${i}`) * 12,
    phase: random(`mote-p-${i}`),
}));

const stars = Array.from({ length: 80 }, (_, i) => ({
    x: random(`star-x-${i}`) * 100,
    y: random(`star-y-${i}`) * 50,
    size: random(`star-s-${i}`) < 0.2 ? 2.5 : 1.5,
    phase: random(`star-p-${i}`) * Math.PI * 2,
}));

export const Painting = ({ dusk, progress }: { dusk: number; progress: number }) => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();
    const layout = useLayout();
    const t = frame / fps;

    // The site's band geometry: the land overscans the frame, and on short wide frames it sinks so the far ridge
    // stays in the lower third.
    const land = Math.max(width, 64 * REM) + 12 * REM;
    const drop = Math.max(0, land * 0.26 - 0.32 * height);
    const bottom = (fraction: number) => land * fraction - drop;
    const night = interpolate(dusk, [0.35, 0.85], [0, 1], clamp);

    // The camera drifts left to right across the whole video, near planes moving furthest.
    const plane = (depth: number): CSSProperties => ({
        position: 'absolute',
        inset: 0,
        transform: `translate3d(${(0.5 - progress) * 2 * depth * PAN}px, ${Math.sin(progress * Math.PI) * depth * -3}px, 0)`,
    });

    // `children` are placed relative to the band, as the village is on the mid hill.
    const band = (name: string, fraction: number, extra: CSSProperties = {}, children?: ReactNode): ReactNode => (
        <div style={{ position: 'absolute', right: -6 * REM, width: land, bottom: bottom(fraction), ...extra }}>
            <Img src={hero(`day-${name}`)} style={{ display: 'block', width: '100%', opacity: 1 - night }} />
            <Img src={hero(`night-${name}`)} style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', opacity: night }} />
            {children}
        </div>
    );

    const sway = (period: number, degrees: number) => Math.sin((t / period) * Math.PI * 2) * degrees;
    const portrait = layout === 'portrait';

    return (
        <AbsoluteFill style={{ overflow: 'hidden', background: backdrop(night) }}>
            {/* A slow push in over the whole video. */}
            <AbsoluteFill style={{ transform: `scale(${1.04 + progress * 0.05})`, transformOrigin: '60% 70%' }}>
                <div style={plane(0.3)}>
                    <div style={{ position: 'absolute', top: -2 * REM, left: -3 * REM, right: -3 * REM, bottom: bottom(0.24) }}>
                        <Img src={hero('day-sky')} style={cover('60% 100%')} />
                        <Img src={hero('night-sky')} style={{ ...cover('60% 100%'), opacity: night }} />
                        <Img
                            src={hero('day-glow')}
                            style={{ ...cover('60% 100%'), mixBlendMode: 'screen', opacity: (0.85 + Math.sin(t / 1.4) * 0.15) * (1 - night) }}
                        />
                    </div>
                    {stars.map((star, i) => (
                        <span
                            key={i}
                            style={{
                                position: 'absolute',
                                left: `${star.x}%`,
                                top: `${star.y}%`,
                                width: star.size,
                                height: star.size,
                                borderRadius: '50%',
                                background: '#eef2ff',
                                boxShadow: '0 0 4px #c9d6ff',
                                opacity: night * (0.5 + 0.5 * Math.sin(t * 1.8 + star.phase)),
                            }}
                        />
                    ))}
                </div>

                {/* The moon rises as night falls. */}
                <div style={plane(0.35)}>
                    <div
                        style={{
                            position: 'absolute',
                            right: portrait ? '10%' : '16%',
                            top: `${interpolate(night, [0, 1], [24, portrait ? 6 : 9])}%`,
                            width: portrait ? 150 : 136,
                            aspectRatio: '1',
                            opacity: night,
                        }}
                    >
                        <Img src={hero('halo')} style={{ position: 'absolute', inset: '-120%', width: '340%', opacity: 0.7 + Math.sin(t / 1.4) * 0.3 }} />
                        <Img src={hero('moon')} style={{ position: 'absolute', inset: 0, width: '100%' }} />
                    </div>
                </div>

                <div style={plane(0.6)}>
                    {clouds.map((cloud) => {
                        const w = (cloud.size * width) / 100 + 5 * REM;
                        const x = -w + (width + w) * ((cloud.start + t / cloud.speed) % 1);

                        return (
                            <div key={cloud.day} style={{ position: 'absolute', top: `${cloud.top}%`, left: 0, width: w, transform: `translateX(${x}px)` }}>
                                <Img src={hero(`day-cloud-${cloud.day}`)} style={{ display: 'block', width: '100%', opacity: 1 - night }} />
                                <Img src={hero(`night-cloud-${cloud.night}`)} style={{ position: 'absolute', left: 0, top: 0, width: '100%', opacity: night * 0.8 }} />
                            </div>
                        );
                    })}
                </div>

                <div style={plane(0.9)}>
                    {swallows.map((bird, i) => (
                        <Flyer key={i} sheet="bird" ratio={147 / 96} size={bird.size * REM * 1.4} top={bird.top} start={1 + bird.delay * 0.6} duration={9} t={t} flapSeconds={0.42 + bird.size * 0.08} opacity={1 - night} />
                    ))}
                    <Flyer sheet="owl" ratio={155 / 128} size={3.6 * REM} top={18} start={36} duration={14} t={t} flapSeconds={1.3} opacity={night} />
                    {bats.map((bat, i) => {
                        const phase = ((t + bat.delay) / bat.speed) * Math.PI * 2;

                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: `${bat.x}%`,
                                    top: `${bat.y}%`,
                                    opacity: night,
                                    transform: `translate(${Math.sin(phase) * 90}px, ${Math.sin(phase * 2) * 30}px)`,
                                }}
                            >
                                <Sheet name="bat" ratio={59 / 80} size={bat.size * REM * 1.4} frame={Math.floor(t / 0.06) % 4} />
                            </div>
                        );
                    })}
                </div>

                <div style={plane(0.8)}>{band('mountains', 0.05)}</div>
                <div style={plane(1.2)}>{band('far', 0.0156)}</div>
                <div style={plane(1.5)}>
                    <Mist name="mist-1" left="-8%" bottom={bottom(0.15)} width={land * 0.8} opacity={0.6} t={t} period={16} night={night} />
                </div>
                <div style={plane(1.9)}>
                    {band('mid', -0.1016, {}, <Village night={night} t={t} />)}
                </div>
                <div style={plane(2.3)}>
                    <Mist name="mist-2" right="-12%" bottom={bottom(0.09)} width={land * 0.8} opacity={0.32} t={t} period={12} night={night} />
                    <Mist name="mist-3" left="4%" bottom={bottom(0.03)} width={land * 0.6} opacity={0.4} t={t} period={14} night={night} />
                </div>
                <div style={plane(2.9)}>{band('fore', -0.0547)}</div>

                <div style={plane(3.4)}>
                    {motes.map((mote, i) => {
                        const cycle = (t / mote.speed + mote.phase) % 1;

                        return (
                            <span
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: `${mote.x + Math.sin(cycle * Math.PI * 2) * 2}%`,
                                    top: `${mote.y - cycle * 8}%`,
                                    width: mote.size,
                                    height: mote.size,
                                    borderRadius: '50%',
                                    background: night > 0.5 ? 'radial-gradient(#fbffd0, #d8f27a 40%, transparent 70%)' : 'radial-gradient(#fff6d8, #ffd27a 45%, transparent 70%)',
                                    boxShadow: night > 0.5 ? '0 0 6px 1px rgb(214 242 122 / 0.55)' : 'none',
                                    opacity: Math.sin(cycle * Math.PI) * (0.4 + night * 0.6),
                                }}
                            />
                        );
                    })}
                </div>

                <div style={plane(4.4)}>
                    <div
                        style={{
                            position: 'absolute',
                            top: portrait ? '-1%' : '-4%',
                            right: portrait ? -0.44 * width : -9 * REM,
                            height: portrait ? 0.86 * width : Math.min(1.12 * height, 1.7 * width),
                            aspectRatio: '540 / 960',
                            transformOrigin: '100% 100%',
                            transform: `rotate(${sway(11, 0.6)}deg)`,
                        }}
                    >
                        <Img src={hero('day-tree')} style={{ position: 'absolute', inset: 0, height: '100%', opacity: 1 - night }} />
                        <Img src={hero('night-tree')} style={{ position: 'absolute', inset: 0, height: '100%', opacity: night }} />
                    </div>
                </div>
                <div style={plane(5.2)}>
                    {band('grass', -0.1, { transformOrigin: '50% 100%', transform: `skewX(${sway(4.5, 0.8)}deg)` })}
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};

const cover = (position: string): CSSProperties => ({ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: position });

// The site's paper colours behind the painting while it loads, warm by day and blue by night.
const backdrop = (night: number) => (night < 0.5 ? '#e9d6a8' : '#17213a');

// One frame of a horizontal sprite sheet with four frames.
const Sheet = ({ name, ratio, size, frame }: { name: string; ratio: number; size: number; frame: number }) => (
    <div
        style={{
            width: size,
            height: size * ratio,
            backgroundImage: `url(${hero(name)})`,
            backgroundSize: `${size * 4}px 100%`,
            backgroundPosition: `${-size * frame}px 0`,
            backgroundRepeat: 'no-repeat',
        }}
    />
);

// A bird crossing the sky once, from `start` seconds for `duration` seconds, bobbing as it flaps.
const Flyer = ({ sheet, ratio, size, top, start, duration, t, flapSeconds, opacity }: {
    sheet: string; ratio: number; size: number; top: number; start: number; duration: number; t: number; flapSeconds: number; opacity: number;
}) => {
    const { width, height } = useVideoConfig();
    const pass = (t - start) / duration;

    if (pass < 0 || pass > 1 || opacity <= 0) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                top: `${top}%`,
                opacity,
                transform: `translate(${-6 * REM + pass * (width + 12 * REM)}px, ${0.02 * height - pass * 0.08 * height + Math.sin(t * 1.3) * 7}px)`,
            }}
        >
            <Sheet name={sheet} ratio={ratio} size={size} frame={Math.floor(t / (flapSeconds / 4)) % 4} />
        </div>
    );
};

const Mist = ({ name, left, right, bottom, width, opacity, t, period, night }: {
    name: string; left?: string; right?: string; bottom: number; width: number; opacity: number; t: number; period: number; night: number;
}) => (
    <div style={{ position: 'absolute', left, right, bottom, width, opacity, transform: `translateX(${Math.sin((t / period) * Math.PI) * 40}px)` }}>
        <Img src={hero(`day-${name}`)} style={{ display: 'block', width: '100%', opacity: 1 - night }} />
        <Img src={hero(`night-${name}`)} style={{ position: 'absolute', left: 0, top: 0, width: '100%', opacity: night }} />
    </div>
);

// The village on the mid hill, with smoke rising from its chimney.
const Village = ({ night, t }: { night: number; t: number }) => {
    const art: CSSProperties = { position: 'absolute', inset: 0, width: '100%', transform: 'scaleY(0.78)', transformOrigin: '50% 100%', maskImage: 'linear-gradient(black 55%, transparent 92%)' };

    return (
        <div style={{ position: 'absolute', left: '21%', top: '9%', width: '8%', aspectRatio: '120 / 40' }}>
            <Img src={hero('day-village')} style={{ ...art, opacity: 1 - night }} />
            <Img src={hero('night-village')} style={{ ...art, opacity: night }} />
            {[0, 2.3, 4.6].map((offset) => {
                const cycle = ((t + offset) % 7) / 7;

                return (
                    <span
                        key={offset}
                        style={{
                            position: 'absolute',
                            left: '62%',
                            top: '36%',
                            width: '7%',
                            aspectRatio: '1',
                            borderRadius: '50%',
                            background: `radial-gradient(closest-side, ${night > 0.5 ? 'rgb(196 210 236 / 0.3)' : 'rgb(236 228 214 / 0.5)'}, transparent)`,
                            opacity: Math.sin(cycle * Math.PI),
                            transform: `translate(${cycle * 60}%, ${-cycle * 260}%) scale(${1 + cycle * 2.5})`,
                        }}
                    />
                );
            })}
        </div>
    );
};
