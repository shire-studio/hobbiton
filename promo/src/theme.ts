import { loadFont as loadInstrumentSerif } from '@remotion/google-fonts/InstrumentSerif';
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { loadFont as loadJetBrainsMono } from '@remotion/google-fonts/JetBrainsMono';
import { createContext, useContext } from 'react';
import { interpolateColors } from 'remotion';

export const fonts = {
    serif: loadInstrumentSerif('italic', { weights: ['400'], subsets: ['latin'] }).fontFamily,
    sans: loadInterTight('normal', { weights: ['400', '500', '600'], subsets: ['latin'] }).fontFamily,
    mono: loadJetBrainsMono('normal', { weights: ['400', '500', '700'], subsets: ['latin'] }).fontFamily,
};

// The Shire Studio website's paper and ink, warm by day and moonlit by night, so the text sits on the painting
// the way it does on the site. `paper` is the veil colour behind the text.
const day = {
    paper: '#efe4cf', text: '#1f1a12', accent: '#286457', muted: '#57493a', eyebrow: '#67584a',
    chipBg: 'rgba(246, 237, 220, 0.72)', chipBorder: 'rgba(42, 32, 22, 0.14)', chipText: '#2a2016',
    frame: '#c9a46a', knob: '#f2c14e',
};

const night: typeof day = {
    paper: '#0d1220', text: '#e9e6dc', accent: '#8ccfbd', muted: '#a7adbd', eyebrow: '#8a91a3',
    chipBg: 'rgba(19, 26, 43, 0.72)', chipBorder: 'rgba(255, 255, 255, 0.12)', chipText: '#d6d9e2',
    frame: '#5a4630', knob: '#f2c14e',
};

export type Palette = typeof day;

export const paletteAt = (dusk: number): Palette =>
    Object.fromEntries(
        (Object.keys(day) as (keyof Palette)[]).map((key) => [key, interpolateColors(dusk, [0, 1], [day[key], night[key]])]),
    ) as Palette;

// The terminal stays dark whatever the time of day, like a real one.
export const term = {
    bg: '#0a0f1b',
    bar: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(160, 200, 255, 0.16)',
    text: '#dbe3ea',
    dim: '#6b7787',
    green: '#9fd6a8',
    cyan: '#8ccff0',
    amber: '#f2c14e',
};

export type Layout = 'landscape' | 'portrait';

export const LayoutContext = createContext<Layout>('landscape');

export const useLayout = (): Layout => useContext(LayoutContext);

export const PaletteContext = createContext<Palette>(day);

export const usePalette = (): Palette => useContext(PaletteContext);
