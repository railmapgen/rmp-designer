import { ChakraProvider } from '@chakra-ui/react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { defaultParam, type SvgsElem } from '../../constants/constants';
import { setParam } from '../../redux/param/param-slice';
import { setSelected, setSvgCursorPosition } from '../../redux/runtime/runtime-slice';
import { createTestStore, render } from '../../test-utils';
import WindowHeader from './window-header';

vi.mock('@railmapgen/rmg-components', () => ({
    RmgEnvBadge: () => <span>Env</span>,
    RmgWindowHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
}));

vi.mock('./zoom-popover', () => ({
    ZoomPopover: () => <button>Zoom</button>,
}));

vi.mock('./open-actions', () => ({
    default: () => <button>Open</button>,
}));

vi.mock('./export-actions', () => ({
    default: () => <button>Export</button>,
}));

vi.mock('./about-modal', () => ({
    default: () => null,
}));

vi.mock('./settings-modal', () => ({
    default: () => null,
}));

const firstElem: SvgsElem = {
    id: 'id_first',
    type: 'rect',
    label: 'First rect',
    attrs: { x: '1"10"', y: '1"20"', width: '1"30"', height: '1"40"' },
};

const secondElem: SvgsElem = {
    id: 'id_second',
    type: 'circle',
    label: 'Second circle',
    attrs: { x: '1"30"', y: '1"50"', r: '1"12"' },
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

describe('WindowHeader clipboard actions', () => {
    it('renders icon-only copy/paste buttons and copies multiple selected SVG elements', async () => {
        const clipboard = installClipboardMock();
        const store = createTestStore();
        store.dispatch(setParam({ ...defaultParam, svgs: [firstElem, secondElem] }));
        store.dispatch(setSelected(new Set([firstElem.id, secondElem.id])));
        store.dispatch(setSvgCursorPosition({ x: -100, y: -200 }));

        render(
            <ChakraProvider>
                <WindowHeader />
            </ChakraProvider>,
            { store }
        );

        expect(screen.queryByText('Copy')).not.toBeInTheDocument();
        expect(screen.queryByText('Paste')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

        await waitFor(() => expect(clipboard.writeText).toHaveBeenCalledTimes(1));
        expect(JSON.parse(clipboard.text)).toMatchObject({
            version: 1,
            type: 'rmp-designer/svg-elements',
            elements: [{ id: firstElem.id }, { id: secondElem.id }],
        });

        await userEvent.click(screen.getByRole('button', { name: 'Paste' }));

        await waitFor(() => expect(store.getState().param.svgs).toHaveLength(4));
        const pasted = store.getState().param.svgs.slice(2);
        expect(pasted.map(elem => elem.id)).not.toContain(firstElem.id);
        expect(pasted.map(elem => elem.id)).not.toContain(secondElem.id);
        expect(pasted.map(elem => elem.type)).toEqual([firstElem.type, secondElem.type]);
        expect(pasted[0].attrBindings).toMatchObject({
            x: { kind: 'literal', value: -100 },
            y: { kind: 'literal', value: -200 },
        });
        expect(pasted[1].attrBindings).toMatchObject({
            x: { kind: 'literal', value: -80 },
            y: { kind: 'literal', value: -170 },
        });
        expect(store.getState().runtime.selected).toEqual(new Set(pasted.map(elem => elem.id)));
    });
});
