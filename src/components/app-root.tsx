import { RmgPage, RmgErrorBoundary, RmgThemeProvider, RmgWindow } from '@railmapgen/rmg-components';
import React from 'react';
import { Route, Routes, useNavigate, useMatch } from 'react-router-dom';
import { useRootDispatch, useRootSelector } from '../redux';
import { setLogin } from '../redux/app/app-slice';
import { setParam } from '../redux/param/param-slice';
import { clearSelected, closePaletteAppClip, onPaletteAppClipEmit } from '../redux/runtime/runtime-slice';
import { Param } from '../constants/constants';
import { MetadataDetail } from '../constants/marketplace';
import { upgrade } from '../util/save';
import { nanoid } from '../util/helper';
import WindowHeader from './header/window-header';
import RmgPaletteAppClip from './panel/rmg-palette-app-clip';
import DesignerRoot from './designer-root';
import Ticket from './marketplace/ticket';
import ExportRoot from './export-root';

const RMP_GALLERY_CHANNEL_NAME = 'RMP_GALLERY_CHANNEL';
const RMP_GALLERY_CHANNEL_OPEN_EVENT = 'OPEN_DESIGNER';
const RMP_GALLERY_CHANNEL_NEW_EVENT = 'NEW_DESIGNER';
const CHN = new BroadcastChannel(RMP_GALLERY_CHANNEL_NAME);

export default function AppRoot() {
    const navigate = useNavigate();
    const isInNew = useMatch('/new');
    const dispatch = useRootDispatch();
    const {
        paletteAppClip: { input },
    } = useRootSelector(state => state.runtime);
    const param = useRootSelector(state => state.param);

    React.useEffect(() => {
        const p = localStorage.getItem('rmg-home__account');
        const login = p ? JSON.parse(p) : undefined;
        dispatch(setLogin(login));
    }, [localStorage.getItem('rmg-home__account')]);

    const handleOpenTemplate = async (paramStr: string) => {
        const param = JSON.parse(await upgrade(paramStr)) as Param;
        dispatch(clearSelected());
        dispatch(setParam(param));
    };

    React.useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            const { event, data } = e.data;
            if (event === RMP_GALLERY_CHANNEL_OPEN_EVENT) {
                handleOpenTemplate(data);
            } else if (event === RMP_GALLERY_CHANNEL_NEW_EVENT) {
                const from = isInNew ? 'ticket' : 'designer';
                navigate('/new', {
                    state: {
                        metadata: {
                            name: data.name,
                            desc: data.desc,
                            param: data.data,
                            type: data.type,
                            svgString: data.svg,
                            id: data.id,
                            from,
                        } as MetadataDetail,
                    },
                });
            }
        };
        CHN.addEventListener('message', handleMessage);
        return () => {
            CHN.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <RmgThemeProvider>
            <RmgWindow>
                <RmgPage>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <RmgErrorBoundary allowReset>
                                    <WindowHeader />
                                    <DesignerRoot />
                                </RmgErrorBoundary>
                            }
                        />
                        <Route
                            path="/new"
                            element={
                                <RmgErrorBoundary>
                                    <Ticket />
                                </RmgErrorBoundary>
                            }
                        />
                        <Route
                            path="/export"
                            element={
                                <RmgErrorBoundary>
                                    <ExportRoot />
                                </RmgErrorBoundary>
                            }
                        />
                    </Routes>

                    <RmgPaletteAppClip
                        isOpen={!!input}
                        onClose={() => dispatch(closePaletteAppClip())}
                        defaultTheme={input}
                        onSelect={nextTheme => dispatch(onPaletteAppClipEmit(nextTheme))}
                    />
                </RmgPage>
            </RmgWindow>
        </RmgThemeProvider>
    );
}
