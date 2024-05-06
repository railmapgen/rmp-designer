import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Components, Param, SvgsElem } from "../../constants/constants";
import { RectSvgAttrs } from "../../components/svgs/rect";
import { SvgsAttrs, SvgsType } from "../../constants/svgs";

const defaultRectSvgAttrs: RectSvgAttrs = {
    width: '10',
    height: '10',
    rx: '0',
    ry: '0',
    opacity: '1',
    fill: '"black"',
    stroke: '"none"',
};

const paramSlice = createSlice({
    name: 'param',
    initialState: {
        id: 'new',
        type: 'MiscNode',
        color: undefined,
        svgs: [
            {
                id: 'qwq',
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
        setSvgs: (state, action: PayloadAction<[]>) => {
            state.svgs = action.payload;
        },
        setSvgValue: (state, action: PayloadAction<{ index: number; value: SvgsElem<SvgsAttrs> }>) => {
            state.svgs[action.payload.index] = action.payload.value;
        },
        setComponents: (state, action: PayloadAction<Components[]>) => {
            state.components = action.payload;
        },
        setComponentValue: (state, action: PayloadAction<{ index: number; value: Components }>) => {
            state.components[action.payload.index] = action.payload.value;
        },
    },
});

export const { setId, setType, setSvgs, setSvgValue, setComponents, setComponentValue } = paramSlice.actions;

const paramReducer = paramSlice.reducer;
export default paramReducer;
