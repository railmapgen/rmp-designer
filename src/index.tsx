import rmgRuntime from '@railmapgen/rmg-runtime';
import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { createRoot, Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import AppRoot from './components/app-root';
import store from './redux';
import initStore from './redux/init';
import { setParam } from './redux/param/param-slice';
import { Events } from './constants/constants';
import i18n from './i18n/config';

let root: Root;

const renderApp = () => {
    root = createRoot(document.getElementById('root') as HTMLDivElement);
    root.render(
        <StrictMode>
            <Provider store={store}>
                <I18nextProvider i18n={i18n}>
                    <AppRoot />
                </I18nextProvider>
            </Provider>
        </StrictMode>
    );
};

rmgRuntime.ready().then(() => {
    initStore(store);
    renderApp();
    rmgRuntime.injectUITools();
    rmgRuntime.event(Events.APP_LOAD, {});
});

const param = localStorage.getItem('rmp-designer__param');
param !== null && store.dispatch(setParam(JSON.parse(param)));
