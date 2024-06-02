import { Heading, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { RmgEnvBadge, RmgWindowHeader } from '@railmapgen/rmg-components';
import rmgRuntime from '@railmapgen/rmg-runtime';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdHelp, MdOpenInNew, MdRedo, MdSave, MdUndo, MdUpload } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setParam } from '../../redux/param/param-slice';
import { backupParam, backupRedo, backupRemove, backupUndo } from '../../redux/runtime/runtime-slice';
import { defaultParam } from '../../constants/constants';
import AboutModal from './about-modal';
import { ZoomPopover } from './zoom-popover';
import { ImportFromSvg } from './import-modal';

export default function WindowHeader() {
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const { history, undo_history } = useRootSelector(store => store.runtime);
    const param = useRootSelector(store => store.param);

    const environment = rmgRuntime.getEnv();
    const appVersion = rmgRuntime.getAppVersion();

    const [openAbout, setOpenAbout] = React.useState(false);
    const [openImportSvg, setOpenImportSvg] = React.useState(false);

    return (
        <RmgWindowHeader>
            <Heading as="h4" size="md">
                {t('RMP Style Generator')}
            </Heading>
            <RmgEnvBadge environment={environment} version={appVersion} />

            <HStack ml="auto">
                <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Undo"
                    icon={<MdUndo />}
                    isDisabled={history.length === 0}
                    onClick={() => {
                        dispatch(backupUndo(param));
                        dispatch(setParam(history[history.length - 1]));
                        dispatch(backupRemove());
                    }}
                />
                <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Redo"
                    icon={<MdRedo />}
                    isDisabled={undo_history.length === 0}
                    onClick={() => {
                        dispatch(backupParam(param));
                        dispatch(setParam(undo_history[undo_history.length - 1]));
                        dispatch(backupRedo());
                    }}
                />
                <ZoomPopover />
                <Menu id="download">
                    <MenuButton as={IconButton} size="sm" variant="ghost" icon={<MdUpload />} />
                    <MenuList>
                        <MenuItem icon={<MdOpenInNew />} onClick={() => dispatch(setParam(defaultParam))}>
                            New
                        </MenuItem>
                        <MenuItem icon={<MdSave />} onClick={() => setOpenImportSvg(true)}>
                            Import from SVG
                        </MenuItem>
                    </MenuList>
                </Menu>
                <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={t('Help')}
                    title={t('Help')}
                    icon={<MdHelp />}
                    onClick={() => setOpenAbout(true)}
                />
            </HStack>
            <AboutModal isOpen={openAbout} onClose={() => setOpenAbout(false)} />
            <ImportFromSvg isOpen={openImportSvg} onClose={() => setOpenImportSvg(false)} />
        </RmgWindowHeader>
    );
}
