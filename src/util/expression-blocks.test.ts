import { describe, expect, it } from 'vitest';
import {
    expressionBlocksToText,
    expressionTextToBlocks,
    insertExpressionText,
    moveExpressionBlock,
    removeExpressionBlock,
    updateExpressionBlock,
} from './expression-blocks';

describe('expression block helpers', () => {
    it('splits formulas with variables into draggable blocks', () => {
        const blocks = expressionTextToBlocks('3 + {Width}');

        expect(blocks.map(block => block.text)).toEqual(['3', '+', '{Width}']);
        expect(blocks.map(block => block.kind)).toEqual(['literal', 'operator', 'variable']);
        expect(expressionBlocksToText(blocks)).toBe('3 + {Width}');
    });

    it('keeps plain text as a single block', () => {
        const blocks = expressionTextToBlocks('Airport Express');

        expect(blocks).toEqual([{ text: 'Airport Express', kind: 'literal' }]);
        expect(expressionBlocksToText(blocks)).toBe('Airport Express');
    });

    it('concatenates adjacent text and variable blocks without adding math operators', () => {
        const blocks = expressionTextToBlocks('Line {Station label}');

        expect(blocks.map(block => block.text)).toEqual(['Line', '{Station label}']);
        expect(blocks.map(block => block.kind)).toEqual(['literal', 'variable']);
        expect(expressionBlocksToText(blocks)).toBe('Line{Station label}');
    });

    it('round trips simple Math function calls', () => {
        const blocks = expressionTextToBlocks('Math.min(3, {Width})');

        expect(blocks.map(block => block.text)).toEqual(['Math.min', '(', '3', ',', '{Width}', ')']);
        expect(expressionBlocksToText(blocks)).toBe('Math.min(3, {Width})');
    });

    it('inserts, updates, removes and moves blocks', () => {
        const inserted = insertExpressionText(expressionTextToBlocks('3'), ' + {Width}');
        const updated = updateExpressionBlock(inserted, 0, '4');
        const removed = removeExpressionBlock(updated, 1);
        const moved = moveExpressionBlock(removed, 1, 0);

        expect(expressionBlocksToText(inserted)).toBe('3 + {Width}');
        expect(expressionBlocksToText(updated)).toBe('4 + {Width}');
        expect(expressionBlocksToText(removed)).toBe('4{Width}');
        expect(expressionBlocksToText(moved)).toBe('{Width}4');
    });
});
