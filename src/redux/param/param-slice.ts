import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultParam, Param, ParamTransform, SvgsElem } from '../../constants/constants';
import { Components } from '../../constants/components';
import { nanoid } from '../../util/helper';

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
        setLabel: (state, action: PayloadAction<string>) => {
            state.label = action.payload;
            state.id = nanoid(6);
        },
        setTransform: (state, action: PayloadAction<ParamTransform>) => {
            state.transform = action.payload;
            state.id = nanoid(6);
        },
        setType: (state, action: PayloadAction<'MiscNode' | 'Station'>) => {
            state.type = action.payload;
            state.id = nanoid(6);
        },
        setColor: (state, action: PayloadAction<Components | undefined>) => {
            state.color = action.payload;
            state.id = nanoid(6);
        },
        setSvgs: (state, action: PayloadAction<SvgsElem[]>) => {
            state.svgs = action.payload;
            state.id = nanoid(6);
        },
        addSvg: (state, action: PayloadAction<SvgsElem>) => {
            state.svgs.push(action.payload);
            state.id = nanoid(6);
        },
        setComponents: (state, action: PayloadAction<Components[]>) => {
            state.components = action.payload;
            state.id = nanoid(6);
        },
        addComponent: (state, action: PayloadAction<Components>) => {
            state.components.push(action.payload);
            state.id = nanoid(6);
        },
        deleteComponent: (state, action: PayloadAction<number>) => {
            state.components = state.components.filter((s, i) => i !== action.payload);
            state.id = nanoid(6);
        },
        setComponentValue: (state, action: PayloadAction<{ index: number; value: Components }>) => {
            state.components[action.payload.index] = action.payload.value;
            state.id = nanoid(6);
        },
        setCore: (state, action: PayloadAction<string | undefined>) => {
            state.core = action.payload;
            state.id = nanoid(6);
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
    setComponents,
    addComponent,
    deleteComponent,
    setComponentValue,
    setCore,
} = paramSlice.actions;

const paramReducer = paramSlice.reducer;
export default paramReducer;
