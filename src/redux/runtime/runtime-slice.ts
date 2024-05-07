import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Id, RuntimeActive, RuntimeMode, Theme } from '../../constants/constants';

/**
 * RuntimeState contains all the data that do not require any persistence.
 * All of them can be initiated with default value.
 */
interface RuntimeState {
    /**
     * Current selection (nodes and edges id, possible multiple selection).
     */
    selected: Set<Id>;
    active: RuntimeActive;
    /**
     * Watch these refresh indicators to know whether there is a change in `window.graph`.
     */
    refresh: number;
    mode: RuntimeMode;
    /**
     * The state for color picker modal from rmg-palette.
     * prevTheme is used to save the temporary value and display in the app clip after clicking the theme button.
     * nextTheme is used to save the temporary value and let the component decide how to do with the newly selected.
     */
    paletteAppClip: {
        input: Theme | undefined;
        output: Theme | undefined;
    };
    globalAlerts?: string;
}

const initialState: RuntimeState = {
    selected: new Set<Id>(),
    active: undefined,
    refresh: Date.now(),
    mode: 'free',
    paletteAppClip: {
        input: undefined,
        output: undefined,
    },
    globalAlerts: undefined,
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
        setRefresh: state => {
            state.refresh = Date.now();
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
        /**
         * If linkedApp is true, alert will try to open link in the current domain.
         * E.g. linkedApp=true, url='/rmp' will open https://railmapgen.github.io/rmp/
         * If you want to open a url outside the domain, DO NOT set or pass FALSE to linkedApp.
         */
        setGlobalAlert: (state, action: PayloadAction<string | undefined>) => {
            state.globalAlerts = action.payload;
        },
    },
});

export const {
    setSelected,
    addSelected,
    removeSelected,
    clearSelected,
    setActive,
    setRefresh,
    setMode,
    openPaletteAppClip,
    closePaletteAppClip,
    onPaletteAppClipEmit,
    setGlobalAlert,
} = runtimeSlice.actions;

const runtimeReducer = runtimeSlice.reducer;
export default runtimeReducer;
