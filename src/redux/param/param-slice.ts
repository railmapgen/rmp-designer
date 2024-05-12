import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Id, Param, SvgsElem } from '../../constants/constants';
import { RectSvgAttrs } from '../../components/svgs/rect';
import { SvgsAttrs, SvgsType } from '../../constants/svgs';
import { Components } from '../../constants/components';

const defaultRectSvgAttrs: RectSvgAttrs = {
    width: '10',
    height: '10',
    rx: '0',
    ry: '0',
    opacity: '1',
    fill: '"black"',
    stroke: '"none"',
    strokeWidth: '0',
};

const paramSlice = createSlice({
    name: 'param',
    initialState: {
        id: 'new',
        type: 'MiscNode',
        color: undefined,
        svgs: [
            {
                id: 'id_qwq' as Id,
                type: SvgsType.Rect,
                isCore: false,
                x: '20',
                y: '20',
                attrs: defaultRectSvgAttrs,
            },
        ],
        components: [
            {
                id: 'd',
                type: 'number',
                label: 'd',
                defaultValue: 0,
            },
        ],
    } as Param,
    reducers: {
        setId: (state, action: PayloadAction<string>) => {
            state.id = action.payload;
        },
        setType: (state, action: PayloadAction<'MiscNode' | 'Station'>) => {
            state.type = action.payload;
        },
        setColor: (state, action: PayloadAction<Components | undefined>) => {
            state.color = action.payload;
        },
        setSvgs: (state, action: PayloadAction<Array<SvgsElem<SvgsAttrs[keyof SvgsAttrs]>>>) => {
            state.svgs = action.payload;
        },
        addSvg: (state, action: PayloadAction<SvgsElem<SvgsAttrs[keyof SvgsAttrs]>>) => {
            state.svgs.push(action.payload);
        },
        setSvgValue: (state, action: PayloadAction<{ index: number; value: SvgsElem<SvgsAttrs[keyof SvgsAttrs]> }>) => {
            state.svgs[action.payload.index] = action.payload.value;
        },
        deleteSvg: (state, action: PayloadAction<number>) => {
            state.svgs = state.svgs.filter((s, i) => i !== action.payload);
        },
        setComponents: (state, action: PayloadAction<Components[]>) => {
            state.components = action.payload;
        },
        addComponent: (state, action: PayloadAction<Components>) => {
            state.components.push(action.payload);
        },
        deleteComponent: (state, action: PayloadAction<number>) => {
            state.components = state.components.filter((s, i) => i !== action.payload);
        },
        setComponentValue: (state, action: PayloadAction<{ index: number; value: Components }>) => {
            state.components[action.payload.index] = action.payload.value;
        },
    },
});

export const {
    setId,
    setType,
    setColor,
    setSvgs,
    addSvg,
    setSvgValue,
    deleteSvg,
    setComponents,
    addComponent,
    deleteComponent,
    setComponentValue,
} = paramSlice.actions;

const paramReducer = paramSlice.reducer;
export default paramReducer;
