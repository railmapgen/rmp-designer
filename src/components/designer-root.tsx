import { Box, Button, Flex, HStack, Spacer, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdErrorOutline } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../redux';
import { setPanelSplitRatio } from '../redux/app/app-slice';
import { ToolsPanel } from './panel/tools';
import { useWindowSize } from '../util/hook';
import { getErrorList } from '../util/helper';
import SvgWrapper from './svg-wrapper';
import RmpGalleryAppClip from './header/rmp-gallery-app-clip';
import { RmpDetails } from './panel/details-rmp';
import { Settings } from './panel/settings';
import { DetailsSvgs } from './panel/details-svgs';
import { DetailsComponents } from './panel/details-components';
import { Preview } from './panel/preview';
import { ErrorDisplay } from './panel/error-display';

const DesignerRoot = () => {
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const param = useRootSelector(store => store.param);
    const { globalAlerts } = useRootSelector(state => state.runtime);
    const { panelSplitRatio } = useRootSelector(state => state.app);
    const [isDetailsOpen, setDetailsOpen] = React.useState(false);
    const [openExport, setOpenExport] = React.useState(false);
    const [openErrorDisplay, setOpenErrorDisplay] = React.useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
    const size = useWindowSize();
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [isResizing, setIsResizing] = React.useState(false);
    const availableHeight = Math.max(360, (size.height ?? 720) - 40);
    const dividerHeight = 8;
    const minTopHeight = 160;
    const minBottomHeight = 160;
    const maxTopHeight = Math.max(minTopHeight, availableHeight - dividerHeight - minBottomHeight);
    const svgHeight = Math.min(maxTopHeight, Math.max(minTopHeight, (availableHeight - dividerHeight) * panelSplitRatio));
    const bottomHeight = availableHeight - dividerHeight - svgHeight;
    const dividerBg = useColorModeValue('gray.200', 'gray.700');
    const dividerHoverBg = useColorModeValue('blue.300', 'blue.500');

    const updateSplitFromPointer = React.useCallback(
        (clientY: number) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const nextTopHeight = Math.min(maxTopHeight, Math.max(minTopHeight, clientY - rect.top));
            dispatch(setPanelSplitRatio(nextTopHeight / Math.max(1, availableHeight - dividerHeight)));
        },
        [availableHeight, dispatch, dividerHeight, maxTopHeight]
    );

    const [errorList, setErrorList] = React.useState<Array<string[]>>([]);
    React.useEffect(() => {
        setErrorList(getErrorList(globalAlerts, param));
    }, [globalAlerts, param]);

    return (
        <Flex ref={containerRef} direction="column" height={availableHeight} overflow="hidden">
            <Flex direction="row" height={svgHeight} overflow="hidden" sx={{ position: 'relative' }}>
                <ToolsPanel />
                <SvgWrapper height={svgHeight} />
                <RmpDetails isOpen={isDetailsOpen} onClose={() => setDetailsOpen(false)} />
            </Flex>
            <Box
                height={`${dividerHeight}px`}
                flexShrink={0}
                cursor="row-resize"
                bg={isResizing ? dividerHoverBg : dividerBg}
                _hover={{ bg: dividerHoverBg }}
                onPointerDown={event => {
                    setIsResizing(true);
                    event.currentTarget.setPointerCapture(event.pointerId);
                    updateSplitFromPointer(event.clientY);
                }}
                onPointerMove={event => {
                    if (isResizing) updateSplitFromPointer(event.clientY);
                }}
                onPointerUp={event => {
                    setIsResizing(false);
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={() => setIsResizing(false)}
                role="separator"
                aria-orientation="horizontal"
                aria-valuemin={minTopHeight}
                aria-valuemax={maxTopHeight}
                aria-valuenow={Math.round(svgHeight)}
            />
            <Flex height={bottomHeight} direction="column" overflow="hidden">
                <Flex p={2} direction="row" overflow="hidden" sx={{ position: 'relative' }}>
                    <HStack width="100%">
                        <Settings />
                        <Button onClick={() => setOpenExport(true)} isDisabled={errorList.length > 0}>
                            {t('header.export.export')} / {t('header.export.gallery')}
                        </Button>
                        <Button onClick={() => setIsGalleryOpen(true)}>{t('header.import.gallery')}</Button>
                        {errorList.length > 0 && (
                            <Button onClick={() => setOpenErrorDisplay(true)}>
                                <MdErrorOutline />
                                {errorList.length}
                            </Button>
                        )}
                        <Spacer />
                        <Button hidden={isDetailsOpen} onClick={() => setDetailsOpen(true)}>
                            {t('panel.details.header')}
                        </Button>
                    </HStack>
                </Flex>
                <Flex direction="row" height="100%" overflow="auto" sx={{ position: 'relative' }}>
                    <DetailsSvgs />
                    <DetailsComponents />
                </Flex>
            </Flex>
            <Preview isOpen={openExport} onClose={() => setOpenExport(false)} />
            <ErrorDisplay isOpen={openErrorDisplay} onClose={() => setOpenErrorDisplay(false)} errorList={errorList} />
            <RmpGalleryAppClip isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
        </Flex>
    );
};

export default DesignerRoot;
