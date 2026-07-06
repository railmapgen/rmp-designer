import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { render, createTestStore } from '../test-utils';
import { defaultParam, type SvgsElem } from '../constants/constants';
import { setParam } from '../redux/param/param-slice';
import { setSelected } from '../redux/runtime/runtime-slice';
import SvgWrapper from './svg-wrapper';

const firstElem: SvgsElem = {
    id: 'id_first',
    type: 'rect',
    label: 'First rect',
    attrs: {
        x: '1"10"',
        y: '1"20"',
        width: '1"30"',
        height: '1"40"',
    },
    attrBindings: {
        x: { kind: 'literal', value: 10 },
        y: { kind: 'literal', value: 20 },
        width: { kind: 'literal', value: 30 },
        height: { kind: 'literal', value: 40 },
    },
};

const secondElem: SvgsElem = {
    id: 'id_second',
    type: 'circle',
    label: 'Second circle',
    attrs: {
        x: '1"50"',
        y: '1"60"',
        r: '1"12"',
    },
    attrBindings: {
        x: { kind: 'literal', value: 50 },
        y: { kind: 'literal', value: 60 },
        r: { kind: 'literal', value: 12 },
    },
};

const installClipboardMock = () => {
    let clipboardText = '';
    const clipboard = {
        get text() {
            return clipboardText;
        },
        writeText: vi.fn(async (text: string) => {
            clipboardText = text;
        }),
        readText: vi.fn(async () => clipboardText),
    };

    Object.defineProperty(navigator, 'clipboard', {
        value: clipboard,
        configurable: true,
    });

    return clipboard;
};

describe('SvgWrapper clipboard shortcuts', () => {
    it('copies the selected SVG elements and pastes them with fresh ids', async () => {
        const clipboard = installClipboardMock();
        const store = createTestStore();
        store.dispatch(setParam({ ...defaultParam, svgs: [firstElem, secondElem] }));
        store.dispatch(setSelected(new Set([firstElem.id, secondElem.id])));

        const { container } = render(<SvgWrapper height={300} />, { store });
        const svg = container.querySelector('svg')!;
        vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 984,
            bottom: 300,
            width: 984,
            height: 300,
            toJSON: () => ({}),
        });

        fireEvent.keyDown(svg, { key: 'c', code: 'KeyC', ctrlKey: true });

        await waitFor(() => expect(clipboard.writeText).toHaveBeenCalledTimes(1));
        expect(JSON.parse(clipboard.text)).toMatchObject({
            version: 1,
            type: 'rmp-designer/svg-elements',
            elements: [
                {
                    id: firstElem.id,
                    type: firstElem.type,
                    label: firstElem.label,
                },
                {
                    id: secondElem.id,
                    type: secondElem.type,
                    label: secondElem.label,
                },
            ],
        });

        fireEvent(svg, new MouseEvent('pointermove', { clientX: 100, clientY: 120, bubbles: true }));
        fireEvent.keyDown(svg, { key: 'v', code: 'KeyV', ctrlKey: true });

        await waitFor(() => expect(store.getState().param.svgs).toHaveLength(4));
        const pasted = store.getState().param.svgs.slice(2);
        expect(pasted[0]).toMatchObject({
            type: firstElem.type,
            label: firstElem.label,
            attrs: {
                ...firstElem.attrs,
                x: '1"-400"',
                y: '1"-130"',
            },
            attrBindings: {
                ...firstElem.attrBindings,
                x: { kind: 'literal', value: -400 },
                y: { kind: 'literal', value: -130 },
            },
        });
        expect(pasted[1]).toMatchObject({
            type: secondElem.type,
            label: secondElem.label,
            attrs: {
                ...secondElem.attrs,
                x: '1"-360"',
                y: '1"-90"',
            },
            attrBindings: {
                ...secondElem.attrBindings,
                x: { kind: 'literal', value: -360 },
                y: { kind: 'literal', value: -90 },
            },
        });
        expect(pasted.map(elem => elem.id)).not.toContain(firstElem.id);
        expect(pasted.map(elem => elem.id)).not.toContain(secondElem.id);
        expect(store.getState().runtime.selected).toEqual(new Set(pasted.map(elem => elem.id)));
    });
});
