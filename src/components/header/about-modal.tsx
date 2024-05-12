import {
    Flex,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Text,
} from '@chakra-ui/react';
import rmgRuntime from '@railmapgen/rmg-runtime';
import { useTranslation } from 'react-i18next';

const AboutModal = (props: { isOpen: boolean; onClose: () => void }) => {
    const { isOpen, onClose } = props;
    const { t } = useTranslation();
    const appVersion = rmgRuntime.getAppVersion();

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t('header.about.title')}</ModalHeader>
                <ModalCloseButton />

                <ModalBody paddingBottom={10}>
                    <Flex direction="row">
                        <Image boxSize="128px" src={import.meta.env.BASE_URL + '/logo192.png'} />
                        <Flex direction="column" width="100%" alignItems="center" justifyContent="center">
                            <Text fontSize="xl" as="b">
                                {t('RMP Style Generator')}
                            </Text>
                            <Text>{appVersion}</Text>
                            <Text />
                            <Text fontSize="sm">{t('header.about.railmapgen')}</Text>
                        </Flex>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default AboutModal;