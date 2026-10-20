import { Composition } from 'remotion';
import { type Cut, durationOf, Promo } from './Promo';
import type { Layout } from './theme';

const formats: { id: string; layout: Layout; cut: Cut; width: number; height: number }[] = [
    { id: 'Landscape', layout: 'landscape', cut: 'full', width: 1920, height: 1080 },
    { id: 'Portrait', layout: 'portrait', cut: 'full', width: 1080, height: 1920 },
    { id: 'LandscapeShort', layout: 'landscape', cut: 'short', width: 1920, height: 1080 },
    { id: 'PortraitShort', layout: 'portrait', cut: 'short', width: 1080, height: 1920 },
];

export const Root = () => (
    <>
        {formats.map(({ id, layout, cut, width, height }) => (
            <Composition key={id} id={id} component={Promo} durationInFrames={durationOf(cut)} fps={30} width={width} height={height} defaultProps={{ layout, cut }} />
        ))}
    </>
);
