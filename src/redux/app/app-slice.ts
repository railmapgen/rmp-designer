import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanvasColor, Login } from '../../constants/constants';

interface AppState {
    canvasColor: CanvasColor;
    login?: Login;
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
        setLogin: (state, action: PayloadAction<Login | undefined>) => {
            state.login = action.payload;
        },
    },
});

export const { setAppState, setCanvas, setLogin } = appSlice.actions;

const appReducer = appSlice.reducer;
export default appReducer;
