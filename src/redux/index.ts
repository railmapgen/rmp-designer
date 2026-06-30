import { combineReducers, configureStore, createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { enableMapSet } from 'immer';
import appReducer from './app/app-slice';
import runtimeReducer from './runtime/runtime-slice';
import paramReducer from './param/param-slice';

enableMapSet();

const rootReducer = combineReducers({
    app: appReducer,
    runtime: runtimeReducer,
    param: paramReducer,
});
export type RootState = ReturnType<typeof rootReducer>;

const listenerMiddleware = createListenerMiddleware();
export const createStore = (preloadedState: Partial<RootState> = {}) =>
    configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false }).prepend(listenerMiddleware.middleware),
        preloadedState,
    });
const store = createStore();
export type RootStore = typeof store;

const persistDelayMs = 250;
let previousParam = store.getState().param;
let previousApp = store.getState().app;
let pendingParam: RootState['param'] | undefined;
let pendingApp: RootState['app'] | undefined;
let persistTimer: number | undefined;

const canPersistLocalState = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const flushPersistedLocalState = () => {
    if (!canPersistLocalState()) return;
    if (persistTimer !== undefined) {
        window.clearTimeout(persistTimer);
        persistTimer = undefined;
    }

    if (pendingParam !== undefined) {
        window.localStorage.setItem('rmp-designer__param', JSON.stringify(pendingParam));
        pendingParam = undefined;
    }
    if (pendingApp !== undefined) {
        window.localStorage.setItem('rmp-designer__app', JSON.stringify(pendingApp));
        pendingApp = undefined;
    }
};

const schedulePersistedLocalStateFlush = () => {
    if (!canPersistLocalState() || persistTimer !== undefined) return;
    persistTimer = window.setTimeout(flushPersistedLocalState, persistDelayMs);
};

store.subscribe(() => {
    const state = store.getState();
    let hasPendingPersistence = false;

    if (state.param !== previousParam) {
        previousParam = state.param;
        pendingParam = state.param;
        hasPendingPersistence = true;
    }
    if (state.app !== previousApp) {
        previousApp = state.app;
        pendingApp = state.app;
        hasPendingPersistence = true;
    }

    if (hasPendingPersistence) schedulePersistedLocalStateFlush();
});

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flushPersistedLocalState);
}

export type RootDispatch = typeof store.dispatch;
export const useRootDispatch = () => useDispatch<RootDispatch>();
export const useRootSelector: TypedUseSelectorHook<RootState> = useSelector;

type RootStartListening = TypedStartListening<RootState, RootDispatch>;
export const startRootListening = listenerMiddleware.startListening as RootStartListening;

(window as any).rmgStore = store;
export default store;
