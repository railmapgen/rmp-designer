import { Badge, Button, Flex, HStack, Spacer } from '@chakra-ui/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdErrorOutline } from 'react-icons/md';
import { useRootSelector } from '../redux';
import { ToolsPanel } from './panel/tools';
import { useWindowSize } from '../util/hook';
import { getErrorList } from '../util/helper';
import SvgWrapper from './svg-wrapper';
import { RmpDetails } from './panel/details-rmp';
import { Settings } from './panel/settings';
import { DetailsSvgs } from './panel/details-svgs';
import { DetailsComponents } from './panel/details-components';
import { Preview } from './panel/preview';
import { ErrorDisplay } from './panel/error-display';

const DesignerRoot = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const param = useRootSelector(store => store.param);
    const {
        paletteAppClip: { input },
        globalAlerts,
    } = useRootSelector(state => state.runtime);
    const [isDetailsOpen, setDetailsOpen] = React.useState(false);
    const [openExport, setOpenExport] = React.useState(false);
    const [openErrorDisplay, setOpenErrorDisplay] = React.useState(false);
    const size = useWindowSize();
    const svgHeight = (((size.height ?? 720) - 40) * 3) / 5;

    const [errorList, setErrorList] = React.useState<Array<string[]>>([]);
    React.useEffect(() => {
        setErrorList(getErrorList(globalAlerts, param));
    }, [globalAlerts, param]);

    return (
        <>
            <Flex direction="row" height={svgHeight} overflow="hidden" sx={{ position: 'relative' }}>
                <ToolsPanel />
                <SvgWrapper />
                <RmpDetails isOpen={isDetailsOpen} onClose={() => setDetailsOpen(false)} />
            </Flex>
            <Flex height={(size.height ?? 720) - 40 - svgHeight} direction="column" overflow="hidden">
                <Flex p={2} direction="row" overflow="hidden" sx={{ position: 'relative' }}>
                    <HStack width="100%">
                        <Settings />
                        <Button onClick={() => setOpenExport(true)} isDisabled={errorList.length > 0}>
                            {t('header.export.export')}
                            <Badge ml="1" colorScheme="green">
                                RMP
                            </Badge>
                        </Button>
                        <Button onClick={() => navigate('/marketplace')}>{t('marketplace.title')}</Button>
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
        </>
    );
};

export default DesignerRoot;
