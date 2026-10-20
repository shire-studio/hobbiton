import type { ReactNode } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { fonts, term, useLayout } from './theme';

// A highlight walks through the snippet: each note lights up every `⟦group|text⟧` marked with its group.
export type Note = { group: string; at: number; text: string };

const syntax = { keyword: '#c3a6ff', string: '#9fd6a8', tag: '#8ccff0', attr: '#f2c14e', plain: '#dbe3ea', punct: '#6b7787' };

const tokenPattern = /('[^']*'|"[^"]*"|\b(?:import|from|const|let|export|default|function|return|satisfies|setup|lang)\b|<\/?[A-Za-z][\w.]*|[:@]?[a-z][\w-]*(?==)|[{}()[\]<>/=,!|?.]|\s+|[^\s'"{}()[\]<>/=,!|?.]+)/g;

const colour = (token: string): string => {
    if (/^['"]/.test(token)) return syntax.string;
    if (/^(import|from|const|let|export|default|function|return|satisfies|setup|lang)$/.test(token)) return syntax.keyword;
    if (/^<\/?[A-Za-z]/.test(token)) return syntax.tag;
    if (/^[{}()[\]<>/=,!|?.]$/.test(token)) return syntax.punct;

    return syntax.plain;
};

// Strips the `⟦group|text⟧` markers, keeping where each marked range starts and ends.
const parse = (line: string): { text: string; ranges: { start: number; end: number; group: string }[] } => {
    const ranges: { start: number; end: number; group: string }[] = [];
    let text = '';

    for (const part of line.split(/(⟦[a-z]\|[^⟧]+⟧)/)) {
        const marker = /^⟦([a-z])\|([^⟧]+)⟧$/.exec(part);

        if (marker) {
            ranges.push({ start: text.length, end: text.length + marker[2].length, group: marker[1] });
            text += marker[2];
        } else {
            text += part;
        }
    }

    return { text, ranges };
};

const renderLine = (line: string, active: string | null, glow: number): ReactNode[] => {
    const { text, ranges } = parse(line);
    const lit = ranges.filter((range) => range.group === active);
    const cuts = [...new Set(ranges.flatMap((range) => [range.start, range.end]))];

    // Colour the whole line first, so markers inside strings or tags never break the highlighting.
    return [...text.matchAll(tokenPattern)].flatMap(({ 0: token, index }, i) => {
        const tag = /^<\/?/.exec(token);
        const isAttribute = /^[:@]?[a-z][\w-]*$/.test(token) && text[index + token.length] === '=';
        const splits = [...cuts, ...(tag !== null ? [index + tag[0].length] : [])];
        const bounds = [...new Set([index, ...splits.filter((cut) => cut > index && cut < index + token.length), index + token.length])].sort((a, b) => a - b);

        return bounds.slice(0, -1).map((from, j) => {
            const to = bounds[j + 1];
            const piece = text.slice(from, to);
            const inTagName = tag !== null && token.length > tag[0].length && from >= index + tag[0].length;
            const color = tag && !inTagName ? syntax.punct : inTagName ? syntax.tag : isAttribute ? syntax.attr : colour(token);
            const isLit = lit.some((range) => from >= range.start && to <= range.end);

            return (
                <span
                    key={`${i}-${j}`}
                    style={{
                        color,
                        background: isLit ? `rgba(242, 193, 78, ${0.2 * glow})` : 'transparent',
                        boxShadow: isLit ? `0 -3px 0 rgba(242, 193, 78, ${0.2 * glow}), 0 3px 0 rgba(242, 193, 78, ${0.2 * glow})` : 'none',
                    }}
                >
                    {piece}
                </span>
            );
        });
    });
};

export type CodeTab = { file: string; from: number; lines: string[]; notes: Note[] };

// An editor with one tab per file, switching to each tab at its `from` frame.
export const Code = ({ tabs }: { tabs: CodeTab[] }) => {
    const frame = useCurrentFrame();
    const layout = useLayout();
    const fontSize = layout === 'landscape' ? 20 : 21;
    const tab = tabs.filter((candidate) => frame >= candidate.from).at(-1) ?? tabs[0];
    const current = tab.notes.filter((note) => frame >= note.at).at(-1) ?? null;
    const glow = current === null ? 0 : interpolate(frame - current.at, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    // Size the editor for the longest file, so switching tabs never resizes it.
    const height = Math.max(...tabs.map((candidate) => candidate.lines.length)) * fontSize * 1.6 + 44;
    const swap = interpolate(frame - tab.from, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return (
        <div
            style={{
                width: '100%',
                borderRadius: 22,
                background: term.bg,
                boxShadow: `inset 0 0 0 1.5px ${term.border}, 0 40px 80px -30px rgba(6, 12, 24, 0.55)`,
                overflow: 'hidden',
                fontFamily: fonts.mono,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, padding: '12px 18px 0', background: term.bar }}>
                {tabs.map((candidate) => {
                    const active = candidate === tab;

                    return (
                        <span
                            key={candidate.file}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '10px 10px 0 0',
                                background: active ? term.bg : 'transparent',
                                color: active ? term.text : term.dim,
                                fontSize: layout === 'landscape' ? 16 : 17,
                            }}
                        >
                            {candidate.file.split('/').at(-1)}
                        </span>
                    );
                })}
            </div>
            <div style={{ height, padding: '22px 0', fontSize, lineHeight: 1.6, whiteSpace: 'pre', fontVariantLigatures: 'none', opacity: swap, transform: `translateY(${(1 - swap) * 10}px)` }}>
                {tab.lines.map((line, i) => (
                    <div key={i} style={{ display: 'flex' }}>
                        <div style={{ width: '3ch', margin: '0 2ch 0 1.5ch', textAlign: 'right', color: 'rgba(107, 119, 135, 0.6)', flexShrink: 0 }}>{i + 1}</div>
                        <div>{renderLine(line, current?.group ?? null, glow)}</div>
                    </div>
                ))}
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 24px',
                    borderTop: `1.5px solid ${term.border}`,
                    color: term.text,
                    fontSize: fontSize - 1,
                    minHeight: fontSize * 1.6,
                }}
            >
                <span style={{ width: 10, height: 10, borderRadius: 99, background: term.amber, opacity: glow }} />
                <span style={{ opacity: glow }}>{current?.text ?? ' '}</span>
            </div>
        </div>
    );
};
