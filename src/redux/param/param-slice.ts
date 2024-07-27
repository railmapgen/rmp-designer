import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultParam, Param, ParamTransform, SvgsElem } from '../../constants/constants';
import { Components } from '../../constants/components';

const paramSlice = createSlice({
    name: 'param',
    initialState: defaultParam,
    reducers: {
        setParam: (state, action: PayloadAction<Param>) => {
            state.id = action.payload.id;
            state.label = action.payload.label;
            state.transform = action.payload.transform;
            state.type = action.payload.type;
            state.color = action.payload.color;
            state.svgs = action.payload.svgs;
            state.components = action.payload.components;
            state.core = action.payload.core;
        },
        setId: (state, action: PayloadAction<string>) => {
            state.id = action.payload;
        },
        setLabel: (state, action: PayloadAction<string>) => {
            state.label = action.payload;
        },
        setTransform: (state, action: PayloadAction<ParamTransform>) => {
            state.transform = action.payload;
        },
        setType: (state, action: PayloadAction<'MiscNode' | 'Station'>) => {
            state.type = action.payload;
        },
        setColor: (state, action: PayloadAction<Components | undefined>) => {
            state.color = action.payload;
        },
        setSvgs: (state, action: PayloadAction<SvgsElem[]>) => {
            state.svgs = action.payload;
        },
        addSvg: (state, action: PayloadAction<SvgsElem>) => {
            state.svgs.push(action.payload);
        },
        setSvgValue: (state, action: PayloadAction<{ index: number; value: SvgsElem }>) => {
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
        setCore: (state, action: PayloadAction<string | undefined>) => {
            state.core = action.payload;
        },
    },
});

export const {
    setParam,
    setLabel,
    setTransform,
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
    setCore,
} = paramSlice.actions;

const paramReducer = paramSlice.reducer;
export default paramReducer;
