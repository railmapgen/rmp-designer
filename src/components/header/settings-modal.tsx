import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from '@chakra-ui/react';
import { useRootDispatch, useRootSelector } from '../../redux';
import { useTranslation } from 'react-i18next';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { setCanvas } from '../../redux/app/app-slice';
import { CanvasColor } from '../../constants/constants';
import React from 'react';

const SettingsModal = (props: { isOpen: boolean; onClose: () => void }) => {
    const { isOpen, onClose } = props;
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const { canvasColor } = useRootSelector(store => store.app);

    const field: RmgFieldsField[] = [
        {
            label: t('header.settings.canvasBackground.label'),
            type: 'select',
            options: {
                auto: t('header.settings.canvasBackground.auto'),
                white: t('header.settings.canvasBackground.white'),
                dark: t('header.settings.canvasBackground.dark'),
            },
            value: canvasColor,
            onChange: value => {
                dispatch(setCanvas(value as CanvasColor));
            },
        },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" trapFocus={false}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t('header.settings.title')}</ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <RmgFields fields={field} />
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('close')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SettingsModal;
