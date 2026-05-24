import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanvasColor, Login } from '../../constants/constants';

interface AppState {
    canvasColor: CanvasColor;
    panelSplitRatio: number;
    login?: Login;
}

const initialState: AppState = {
    canvasColor: 'auto',
    panelSplitRatio: 0.6,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setAppState: (state, action: PayloadAction<AppState>) => {
            state.canvasColor = action.payload.canvasColor;
            state.panelSplitRatio = action.payload.panelSplitRatio ?? initialState.panelSplitRatio;
        },
        setCanvas: (state, action: PayloadAction<CanvasColor>) => {
            state.canvasColor = action.payload;
        },
        setPanelSplitRatio: (state, action: PayloadAction<number>) => {
            state.panelSplitRatio = action.payload;
        },
        setLogin: (state, action: PayloadAction<Login | undefined>) => {
            state.login = action.payload;
        },
    },
});

export const { setAppState, setCanvas, setPanelSplitRatio, setLogin } = appSlice.actions;

const appReducer = appSlice.reducer;
export default appReducer;
