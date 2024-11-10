import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
} from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Param } from '../../constants/constants';

const RMP_MASTER_CHANNEL_NAME = 'RMP_MASTER_CHANNEL';
const RMP_MASTER_CHANNEL_POST = 'MASTER_POST';
const CHN_MASTER = new BroadcastChannel(RMP_MASTER_CHANNEL_NAME);

export const Export = (props: { isOpen: boolean; onClose: () => void; param: Param; exportMode?: boolean }) => {
    const { isOpen, onClose, param, exportMode } = props;
    const { t } = useTranslation();

    const [code, setCode] = React.useState('');
    React.useEffect(() => {
        setCode(JSON.stringify(param));
    }, [isOpen]);

    const postMessage = () => {
        const post = JSON.stringify(param);
        CHN_MASTER.postMessage({
            event: RMP_MASTER_CHANNEL_POST,
            data: post,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Text as="b" fontSize="xl">
                        {t('header.export.export')}
                    </Text>
                    <ModalCloseButton />
                </ModalHeader>

                <ModalBody>
                    <Textarea
                        value={code}
                        hidden={exportMode}
                        readOnly
                        fontFamily="monospace"
                        fontSize="xx-small"
                        minH="200"
                    />
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('close')}
                    </Button>
                    <Button colorScheme="blue" variant="solid" mr="1" onClick={postMessage} hidden={!exportMode}>
                        {t('header.export.export')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
