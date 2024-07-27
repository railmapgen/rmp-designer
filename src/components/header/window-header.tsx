import { Heading, HStack, IconButton } from '@chakra-ui/react';
import { RmgEnvBadge, RmgWindowHeader } from '@railmapgen/rmg-components';
import rmgRuntime from '@railmapgen/rmg-runtime';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdHelp, MdRedo, MdSettings, MdUndo } from 'react-icons/md';
import { useRootDispatch, useRootSelector } from '../../redux';
import { setParam } from '../../redux/param/param-slice';
import { backupParam, backupRedo, backupRemove, backupUndo } from '../../redux/runtime/runtime-slice';
import AboutModal from './about-modal';
import { ZoomPopover } from './zoom-popover';
import OpenActions from './open-actions';
import SettingsModal from './settings-modal';
import ExportActions from './export-actions';

export default function WindowHeader() {
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const { history, undo_history } = useRootSelector(store => store.runtime);
    const param = useRootSelector(store => store.param);

    const environment = rmgRuntime.getEnv();
    const appVersion = rmgRuntime.getAppVersion();

    const [openAbout, setOpenAbout] = React.useState(false);
    const [openSettings, setOpenSettings] = React.useState(false);

    return (
        <RmgWindowHeader>
            <Heading as="h4" size="md">
                {t('RMP Designer')}
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
                <OpenActions />
                <ExportActions />
                <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Settings"
                    icon={<MdSettings />}
                    onClick={() => setOpenSettings(true)}
                />
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
            <SettingsModal isOpen={openSettings} onClose={() => setOpenSettings(false)} />
        </RmgWindowHeader>
    );
}
