export type ExpressionBlockKind = 'literal' | 'variable' | 'operator' | 'function' | 'punctuation';

export interface ExpressionBlock {
    text: string;
    kind: ExpressionBlockKind;
}

const functionNames = new Set(['Math.min', 'Math.max', 'Math.round', 'Math.abs', 'Math.floor', 'Math.ceil']);
const operators = new Set(['+', '-', '*', '/', '?', ':']);
const punctuation = new Set(['(', ')', ',']);
const tokenPattern = /\{[^{}]+\}|Math\.(?:min|max|round|abs|floor|ceil)|[()+\-*/?:,]|\d+(?:\.\d+)?|[^\s(){}+\-*/?:,]+/g;

const shouldSplitIntoBlocks = (value: string) =>
    /\{[^{}]+\}/.test(value) ||
    /\bMath\.(?:min|max|round|abs|floor|ceil)\s*\(/.test(value) ||
    /\?/.test(value) ||
    /(?:\d|\}|\))\s*[+\-*/]\s*(?:\d|\{|\(|Math\.)/.test(value);

export const getExpressionBlockKind = (text: string): ExpressionBlockKind => {
    if (/^\{[^{}]+\}$/.test(text)) return 'variable';
    if (functionNames.has(text)) return 'function';
    if (operators.has(text)) return 'operator';
    if (punctuation.has(text)) return 'punctuation';
    return 'literal';
};

export const expressionTextToBlocks = (value: string): ExpressionBlock[] => {
    if (value.trim() === '') return [];
    if (!shouldSplitIntoBlocks(value)) {
        return [{ text: value, kind: 'literal' }];
    }

    return [...value.matchAll(tokenPattern)]
        .map(match => match[0].trim())
        .filter(Boolean)
        .map(text => ({ text, kind: getExpressionBlockKind(text) }));
};

export const expressionBlocksToText = (blocks: ExpressionBlock[]): string => {
    const tokens = blocks.map(block => block.text.trim()).filter(Boolean);
    return tokens.reduce((output, token, index) => {
        const previous = tokens[index - 1];
        if (!output) return token;
        if (token === ')' || token === ',') return `${output.trimEnd()}${token}`;
        if (previous === '(' || functionNames.has(previous)) return `${output}${token}`;
        if (token === '(') return functionNames.has(previous) ? `${output}${token}` : `${output} ${token}`;
        if (previous === ',') return `${output} ${token}`;
        if (operators.has(token) || operators.has(previous)) return `${output.trimEnd()} ${token}`;
        return `${output}${token}`;
    }, '');
};

export const insertExpressionText = (
    blocks: ExpressionBlock[],
    text: string,
    index = blocks.length
): ExpressionBlock[] => {
    const inserted = expressionTextToBlocks(text);
    return [...blocks.slice(0, index), ...inserted, ...blocks.slice(index)];
};

export const moveExpressionBlock = (blocks: ExpressionBlock[], fromIndex: number, toIndex: number): ExpressionBlock[] => {
    if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0) return blocks;
    const next = [...blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(Math.min(toIndex, next.length), 0, moved);
    return next;
};

export const updateExpressionBlock = (
    blocks: ExpressionBlock[],
    index: number,
    text: string
): ExpressionBlock[] =>
    blocks.map((block, blockIndex) =>
        blockIndex === index ? { text, kind: getExpressionBlockKind(text.trim()) } : block
    );

export const removeExpressionBlock = (blocks: ExpressionBlock[], index: number): ExpressionBlock[] =>
    blocks.filter((_block, blockIndex) => blockIndex !== index);
