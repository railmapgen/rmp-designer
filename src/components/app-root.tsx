import React from 'react';
import { Button, Flex, HStack, Spacer } from '@chakra-ui/react';
import WindowHeader from './header/window-header';
import { RmgPage, RmgErrorBoundary, RmgThemeProvider, RmgWindow } from '@railmapgen/rmg-components';
import { useTranslation } from 'react-i18next';
import { useRootDispatch, useRootSelector } from '../redux';
import { closePaletteAppClip, onPaletteAppClipEmit } from '../redux/runtime/runtime-slice';
import { useWindowSize } from '../util/hook';
import { ToolsPanel } from './panel/tools';
import SvgWrapper from './svg-wrapper';
import { RmpDetails } from './panel/details-rmp';
import { DetailsSvgs } from './panel/details-svgs';
import { Settings } from './panel/settings';
import { Export } from './panel/export';
import { DetailsComponents } from './panel/details-components';
import RmgPaletteAppClip from './panel/rmg-palette-app-clip';

export default function AppRoot() {
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const {
        paletteAppClip: { input },
        globalAlerts,
    } = useRootSelector(state => state.runtime);
    const [isDetailsOpen, setDetailsOpen] = React.useState(false);
    const [openExport, setOpenExport] = React.useState(false);
    const size = useWindowSize();
    const svgHeight = (((size.height ?? 720) - 40) * 3) / 5;

    return (
        <RmgThemeProvider>
            <RmgWindow>
                <WindowHeader />
                <RmgPage>
                    <RmgErrorBoundary allowReset>
                        <Flex direction="row" height={svgHeight} overflow="hidden" sx={{ position: 'relative' }}>
                            <ToolsPanel />
                            <SvgWrapper />
                            <RmpDetails isOpen={isDetailsOpen} onClose={() => setDetailsOpen(false)} />
                        </Flex>
                        <Flex p={2} direction="row" height="100%" overflow="hidden" sx={{ position: 'relative' }}>
                            <HStack width="100%">
                                <Settings />
                                <Button onClick={() => setOpenExport(true)} isDisabled={globalAlerts.size !== 0}>
                                    Export
                                </Button>
                                <Spacer />
                                <Button hidden={isDetailsOpen} onClick={() => setDetailsOpen(true)}>
                                    {t('panel.details.header')}
                                </Button>
                            </HStack>
                        </Flex>
                        <Flex direction="row" height="100%" overflow="hidden" sx={{ position: 'relative' }}>
                            <DetailsSvgs />
                            <DetailsComponents />
                        </Flex>
                        <Export isOpen={openExport} onClose={() => setOpenExport(false)} param={param} />
                    </RmgErrorBoundary>

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
