import type { ReactNode } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { fonts, term, useLayout } from './theme';

// Each step mirrors what Laravel Prompts prints for shire-kit, appearing at frame `at`.
export type Step =
    | { type: 'command'; at: number; cwd: string; text: string; speed?: number }
    | { type: 'select'; at: number; label: string; options: string[]; moves: { at: number; index: number }[]; submitAt: number }
    | { type: 'confirm'; at: number; label: string; submitAt: number }
    | { type: 'spin'; at: number; until: number; label: string }
    | { type: 'info' | 'note' | 'outro'; at: number; lines: string[] }
    | { type: 'json'; at: number; lines: string[]; perFrame?: number }
    | { type: 'agent'; at: number; until: number; agent: string; task: string };

// Slows a script down by `factor`, so every prompt and line gets longer on screen without retiming each step by hand.
export const stretch = (steps: Step[], factor = 1.35): Step[] =>
    steps.map((step) => {
        const at = Math.round(step.at * factor);

        switch (step.type) {
            case 'command':
                return { ...step, at, speed: (step.speed ?? CHARS_PER_FRAME) / factor };
            case 'select':
                return { ...step, at, submitAt: Math.round(step.submitAt * factor), moves: step.moves.map((move) => ({ ...move, at: Math.round(move.at * factor) })) };
            case 'confirm':
                return { ...step, at, submitAt: Math.round(step.submitAt * factor) };
            case 'spin':
            case 'agent':
                return { ...step, at, until: Math.round(step.until * factor) };
            default:
                return { ...step, at };
        }
    });

const SPINNER = ['⠂', '⠒', '⠐', '⠰', '⠠', '⠤', '⠄', '⠆'];
const CHARS_PER_FRAME = 0.8;

// A block of terminal output, `lines` rows tall so scrolling can be worked out without measuring.
type Block = { key: string; lines: number; node: ReactNode };

const Box = ({ label, color, border, lines, children }: { label: string; color: string; border: string; lines: number; children: ReactNode }) => (
    <div
        style={{
            position: 'relative',
            height: `calc(${lines} * var(--lh) - 0.4 * var(--lh))`,
            marginTop: 'calc(0.2 * var(--lh))',
            marginBottom: 'calc(0.2 * var(--lh))',
            border: `1.5px solid ${border}`,
            borderRadius: 6,
            padding: '0 1.2ch',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        }}
    >
        <span style={{ position: 'absolute', top: 'calc(-0.5 * var(--lh))', left: '1ch', padding: '0 0.8ch', background: term.bg, color }}>{label}</span>
        {children}
    </div>
);

// `cols` is how many characters fit on a row, so long output lines can wrap and still scroll correctly.
const blockOf = (step: Step, frame: number, key: string, cols: number): Block | null => {
    const f = frame - step.at;

    switch (step.type) {
        case 'command': {
            const speed = step.speed ?? CHARS_PER_FRAME;
            const typed = step.text.slice(0, Math.floor(f * speed));
            // The cursor blinks briefly after typing, then leaves the line as the command runs.
            const caret = typed.length < step.text.length || (f < step.text.length / speed + 20 && Math.floor(f / 10) % 2 === 0);

            return {
                key,
                lines: Math.max(1, Math.ceil((step.cwd.length + 3 + step.text.length) / cols)),
                node: (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                        <span style={{ color: term.green }}>{step.cwd}</span>
                        <span style={{ color: term.dim }}> ❯ </span>
                        <span style={{ color: term.text }}>{typed}</span>
                        <span style={{ background: caret ? term.text : 'transparent' }}> </span>
                    </div>
                ),
            };
        }

        case 'select': {
            const active = step.moves.filter((move) => frame >= move.at).at(-1)?.index ?? 0;

            if (frame >= step.submitAt) {
                return {
                    key,
                    lines: 3,
                    node: (
                        <Box label={step.label} color={term.dim} border={term.dim} lines={3}>
                            <div style={{ color: term.text }}>{step.options[active]}</div>
                        </Box>
                    ),
                };
            }

            return {
                key,
                lines: step.options.length + 2,
                node: (
                    <Box label={step.label} color={term.cyan} border={term.cyan} lines={step.options.length + 2}>
                        {step.options.map((option, i) => (
                            <div key={option} style={{ color: i === active ? term.text : term.dim }}>
                                <span style={{ color: i === active ? term.cyan : term.dim }}>{i === active ? '› ● ' : '  ○ '}</span>
                                {option}
                            </div>
                        ))}
                    </Box>
                ),
            };
        }

        case 'confirm': {
            const answered = frame >= step.submitAt;

            return {
                key,
                lines: 3,
                node: (
                    <Box label={step.label} color={answered ? term.dim : term.cyan} border={answered ? term.dim : term.cyan} lines={3}>
                        {answered
                            ? <div style={{ color: term.text }}>Yes</div>
                            : <div><span style={{ color: term.green }}>● Yes</span><span style={{ color: term.dim }}> / ○ No</span></div>}
                    </Box>
                ),
            };
        }

        case 'spin':
            return frame >= step.until ? null : {
                key,
                lines: 1,
                node: (
                    <div>
                        <span style={{ color: term.cyan, display: 'inline-block', width: '2ch' }}>{SPINNER[Math.floor(f / 3) % SPINNER.length]}</span>
                        <span style={{ color: term.text }}>{step.label}</span>
                    </div>
                ),
            };

        case 'info':
        case 'note':
        case 'outro':
            return {
                key,
                lines: step.lines.reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / cols)), 0),
                node: step.lines.map((line, i) => (
                    <div
                        key={i}
                        style={{
                            color: step.type === 'note' ? term.text : term.green,
                            fontWeight: step.type === 'outro' ? 700 : 400,
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {line || ' '}
                    </div>
                )),
            };

        case 'json': {
            const shown = step.lines.slice(0, Math.max(1, Math.floor(f * (step.perFrame ?? 1)) + 1));

            return { key, lines: shown.length, node: shown.map((line, i) => <div key={i}>{json(line)}</div>) };
        }

        case 'agent': {
            const progress = interpolate(frame, [step.at + 10, step.until - 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const done = progress >= 1;

            return {
                key,
                lines: 4,
                node: (
                    <Box label={`✻ ${step.agent}`} color={term.amber} border={term.amber} lines={4}>
                        <div style={{ color: term.dim }}>Following {step.task}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2ch' }}>
                            <span style={{ color: done ? term.green : term.text, width: '32ch' }}>
                                {done ? 'Merged. Your changes are kept.' : 'Merging the upstream changes...'}
                            </span>
                            <span style={{ flex: 1, height: 'calc(0.36 * var(--lh))', borderRadius: 99, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                <span style={{ display: 'block', height: '100%', width: `${progress * 100}%`, borderRadius: 99, background: done ? term.green : term.amber }} />
                            </span>
                        </div>
                    </Box>
                ),
            };
        }
    }
};

// Colours keys, strings and literals in a line of pretty printed JSON.
const json = (line: string): ReactNode => {
    const parts = line.split(/("(?:[^"\\]|\\.)*"|\bnull\b|\btrue\b|\bfalse\b|-?\d+(?:\.\d+)?)/);

    return parts.map((part, i) => {
        const isKey = part.startsWith('"') && (parts[i + 1] ?? '').trimStart().startsWith(':');
        const color = i % 2 === 0 ? term.dim : isKey ? term.cyan : part.startsWith('"') ? term.green : term.amber;

        return <span key={i} style={{ color }}>{part}</span>;
    });
};

const blocksAt = (steps: Step[], frame: number, cols: number): Block[] =>
    steps
        .filter((step) => frame >= step.at)
        .flatMap((step, i) => {
            const block = blockOf(step, frame, `s${i}`, cols);
            const spaced = block !== null && !['command', 'note', 'outro', 'json'].includes(step.type);

            return block === null ? [] : spaced ? [{ key: `s${i}gap`, lines: 1, node: <div> </div> }, block] : [block];
        });

const linesAt = (steps: Step[], frame: number, cols: number): number => blocksAt(steps, frame, cols).reduce((sum, block) => sum + block.lines, 0);

export const Terminal = ({ steps, title, visibleLines }: { steps: Step[]; title: string; visibleLines: number }) => {
    const frame = useCurrentFrame();
    const layout = useLayout();
    const fontSize = layout === 'landscape' ? 20 : 22;
    const lineHeight = Math.round(fontSize * 1.55);
    // The panel is 1000px wide beside the caption in landscape and 960px under it in portrait, less padding.
    const cols = Math.floor((layout === 'landscape' ? 944 : 904) / (fontSize * 0.6));

    // Scroll smoothly by averaging the target offset over the last few frames.
    const offsetAt = (f: number) => Math.max(0, linesAt(steps, Math.max(0, f), cols) - visibleLines) * lineHeight;
    const offset = [0, 1, 2, 3, 4, 5].reduce((sum, back) => sum + offsetAt(frame - back), 0) / 6;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 20px', background: term.bar }}>
                {['#ff6b5f', '#ffbe3d', '#3fcf5c'].map((color) => (
                    <span key={color} style={{ width: 13, height: 13, borderRadius: 99, background: color, opacity: 0.85 }} />
                ))}
                <span style={{ flex: 1, textAlign: 'center', marginRight: 60, color: term.dim, fontSize: 16, letterSpacing: '0.04em' }}>{title}</span>
            </div>
            {/* Clip to whole lines inside the padding, so a line scrolled away never peeks out above the first one. */}
            <div style={{ padding: '20px 28px' }}>
                <div style={{ height: visibleLines * lineHeight, overflow: 'hidden' }}>
                <div
                    style={{
                        ['--lh' as string]: `${lineHeight}px`,
                        transform: `translateY(${-offset}px)`,
                        fontSize,
                        lineHeight: `${lineHeight}px`,
                        whiteSpace: 'pre',
                        fontVariantLigatures: 'none',
                    }}
                >
                    {blocksAt(steps, frame, cols).map((block) => <div key={block.key}>{block.node}</div>)}
                </div>
                </div>
            </div>
        </div>
    );
};
