import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanvasColor } from '../../constants/constants';

interface AppState {
    canvasColor: CanvasColor;
}

const initialState: AppState = {
    canvasColor: 'auto',
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setAppState: (state, action: PayloadAction<AppState>) => {
            state.canvasColor = action.payload.canvasColor;
        },
        setCanvas: (state, action: PayloadAction<CanvasColor>) => {
            state.canvasColor = action.payload;
        },
    },
});

export const { setAppState, setCanvas } = appSlice.actions;

const appReducer = appSlice.reducer;
export default appReducer;
