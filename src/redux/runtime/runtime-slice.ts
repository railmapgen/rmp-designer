import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Id, Param, RuntimeActive, RuntimeMode, Theme } from '../../constants/constants';

/**
 * RuntimeState contains all the data that do not require any persistence.
 * All of them can be initiated with default value.
 */
interface RuntimeState {
    selected: Set<Id>;
    active: RuntimeActive;
    mode: RuntimeMode;
    svgViewBoxZoom: number;
    svgViewBoxMin: {
        x: number;
        y: number;
    };
    paletteAppClip: {
        input: Theme | undefined;
        output: Theme | undefined;
    };
    globalAlerts: Map<string, string>;
    history: Param[];
    undo_history: Param[];
}

const initialState: RuntimeState = {
    selected: new Set<Id>(),
    active: undefined,
    mode: 'free',
    svgViewBoxZoom: 100,
    svgViewBoxMin: {
        x: -500,
        y: -250,
    },
    paletteAppClip: {
        input: undefined,
        output: undefined,
    },
    globalAlerts: new Map<string, string>(),
    history: [],
    undo_history: [],
};

const runtimeSlice = createSlice({
    name: 'runtime',
    initialState,
    reducers: {
        setSelected: (state, action: PayloadAction<Set<Id>>) => {
            state.selected = action.payload;
        },
        addSelected: (state, action: PayloadAction<Id>) => {
            state.selected.add(action.payload);
        },
        removeSelected: (state, action: PayloadAction<Id>) => {
            state.selected.delete(action.payload);
        },
        clearSelected: state => {
            state.selected = new Set<Id>();
        },
        setActive: (state, action: PayloadAction<Id | 'background' | undefined>) => {
            state.active = action.payload;
        },
        setMode: (state, action: PayloadAction<RuntimeMode>) => {
            state.mode = action.payload;
        },
        openPaletteAppClip: (state, action: PayloadAction<Theme>) => {
            state.paletteAppClip.input = action.payload;
            state.paletteAppClip.output = undefined;
        },
        closePaletteAppClip: state => {
            state.paletteAppClip.input = undefined;
        },
        onPaletteAppClipEmit: (state, action: PayloadAction<Theme>) => {
            state.paletteAppClip.input = undefined;
            state.paletteAppClip.output = action.payload;
        },
        addGlobalAlert: (state, action: PayloadAction<{ id: string; str: string }>) => {
            state.globalAlerts.set(action.payload.id, action.payload.str);
        },
        removeGlobalAlert: (state, action: PayloadAction<string>) => {
            state.globalAlerts.has(action.payload) && state.globalAlerts.delete(action.payload);
        },
        removeGlobalAlertArray: (state, action: PayloadAction<string[] | Set<string>>) => {
            action.payload.forEach(s => {
                state.globalAlerts.has(s) && state.globalAlerts.delete(s);
            });
        },
        clearGlobalAlerts: state => {
            state.globalAlerts.clear();
        },
        setSvgViewBoxZoom: (state, action: PayloadAction<number>) => {
            state.svgViewBoxZoom = action.payload;
        },
        setSvgViewBoxMin: (state, action: PayloadAction<{ x: number; y: number }>) => {
            state.svgViewBoxMin = action.payload;
        },
        backupParam: (state, action: PayloadAction<Param>) => {
            state.history.push(action.payload);
            state.undo_history = [];
        },
        backupUndo: (state, action: PayloadAction<Param>) => {
            state.undo_history.push(action.payload);
        },
        backupRedo: state => {
            state.undo_history.pop();
        },
        backupRemove: state => {
            state.history.pop();
        },
    },
});

export const {
    setSelected,
    addSelected,
    removeSelected,
    clearSelected,
    setActive,
    setMode,
    openPaletteAppClip,
    closePaletteAppClip,
    onPaletteAppClipEmit,
    addGlobalAlert,
    removeGlobalAlert,
    removeGlobalAlertArray,
    clearGlobalAlerts,
    setSvgViewBoxZoom,
    setSvgViewBoxMin,
    backupParam,
    backupUndo,
    backupRedo,
    backupRemove,
} = runtimeSlice.actions;

const runtimeReducer = runtimeSlice.reducer;
export default runtimeReducer;
