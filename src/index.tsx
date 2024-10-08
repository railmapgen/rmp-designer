import rmgRuntime from '@railmapgen/rmg-runtime';
import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { createRoot, Root } from 'react-dom/client';
import AppRoot from './components/app-root';
import store from './redux';
import initStore from './redux/init';
import { setParam } from './redux/param/param-slice';
import { setAppState, setLogin } from './redux/app/app-slice';
import { Events } from './constants/constants';
import i18n from './i18n/config';
import { upgrade } from './util/save';

let root: Root;

const renderApp = () => {
    root = createRoot(document.getElementById('root') as HTMLDivElement);
    root.render(
        <StrictMode>
            <Provider store={store}>
                <I18nextProvider i18n={i18n}>
                    <HashRouter>
                        <AppRoot />
                    </HashRouter>
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

const appState = localStorage.getItem('rmp-designer__app');
const param = localStorage.getItem('rmp-designer__param');
const account = localStorage.getItem('rmg-home__account');

appState !== null && store.dispatch(setAppState(JSON.parse(appState)));
account !== null && store.dispatch(setLogin(JSON.parse(account)));

upgrade(param).then(param => {
    store.dispatch(setParam(JSON.parse(param)));
});
