import React from 'react';
import { Button, Flex } from '@chakra-ui/react';
import WindowHeader from './window-header';
import { RmgPage, RmgErrorBoundary, RmgThemeProvider, RmgWindow } from '@railmapgen/rmg-components';
import { useTranslation } from 'react-i18next';
import { useRootSelector } from '../redux';
import SvgWrapper from './svg-wrapper';
import { RmpDetails } from './panel/details-rmp';
import { DetailsSvgs } from './panel/details-svgs';
import { Settings } from './panel/settings';
import { Export } from './panel/export';
import { DetailsComponents } from './panel/details-components';

export default function AppRoot() {
    const { t } = useTranslation();
    const param = useRootSelector(store => store.param);
    const [openExport, setOpenExport] = React.useState(false);

    return (
        <RmgThemeProvider>
            <RmgWindow>
                <WindowHeader />
                <RmgPage>
                    <RmgErrorBoundary allowReset>
                        <Flex direction="row" height="100%" overflow="hidden" sx={{ position: 'relative' }}>
                            <SvgWrapper />
                            <RmpDetails />
                        </Flex>
                        <Flex p={2} direction="row" height="100%" overflow="hidden" sx={{ position: 'relative' }}>
                            <Settings />
                            <Button onClick={() => setOpenExport(true)}>Export</Button>
                        </Flex>
                        <Flex direction="row" height="100%" overflow="hidden" sx={{ position: 'relative' }}>
                            <DetailsSvgs />
                            <DetailsComponents />
                        </Flex>
                        <Export isOpen={openExport} onClose={() => setOpenExport(false)} param={param} />
                    </RmgErrorBoundary>
                </RmgPage>
            </RmgWindow>
        </RmgThemeProvider>
    );
}
