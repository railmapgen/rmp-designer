import { combineReducers, configureStore, createListenerMiddleware, TypedStartListening } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { enableMapSet } from 'immer';
import appReducer from './app/app-slice';
import runtimeReducer from './runtime/runtime-slice';
import paramReducer from './param/param-slice';
import marketplaceReducer from './marketplace/marketplace-slice';

enableMapSet();

const rootReducer = combineReducers({
    app: appReducer,
    runtime: runtimeReducer,
    param: paramReducer,
    marketplace: marketplaceReducer,
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

store.subscribe(() => {
    localStorage.setItem('rmp-designer__param', JSON.stringify(store.getState().param));
    localStorage.setItem('rmp-designer__app', JSON.stringify(store.getState().app));
});

export type RootDispatch = typeof store.dispatch;
export const useRootDispatch = () => useDispatch<RootDispatch>();
export const useRootSelector: TypedUseSelectorHook<RootState> = useSelector;

type RootStartListening = TypedStartListening<RootState, RootDispatch>;
export const startRootListening = listenerMiddleware.startListening as RootStartListening;

(window as any).rmgStore = store;
export default store;
