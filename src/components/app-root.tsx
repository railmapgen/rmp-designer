import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import WindowHeader from './header/window-header';
import { RmgPage, RmgErrorBoundary, RmgThemeProvider, RmgWindow } from '@railmapgen/rmg-components';
import { useRootDispatch, useRootSelector } from '../redux';
import { closePaletteAppClip, onPaletteAppClipEmit } from '../redux/runtime/runtime-slice';
import RmgPaletteAppClip from './panel/rmg-palette-app-clip';
import MarketplaceView from './marketplace/marketplace';
import DesignerRoot from './designer-root';
import Ticket from './marketplace/ticket';

export default function AppRoot() {
    const dispatch = useRootDispatch();
    const {
        paletteAppClip: { input },
    } = useRootSelector(state => state.runtime);

    return (
        <HashRouter>
            <RmgThemeProvider>
                <RmgWindow>
                    <WindowHeader />
                    <RmgPage>
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <RmgErrorBoundary allowReset>
                                        <DesignerRoot />
                                    </RmgErrorBoundary>
                                }
                            />
                            <Route
                                path="/marketplace"
                                element={
                                    <RmgErrorBoundary>
                                        <MarketplaceView />
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
        </HashRouter>
    );
}
