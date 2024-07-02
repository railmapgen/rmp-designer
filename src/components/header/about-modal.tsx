import {
    Avatar,
    Box,
    Flex,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Tag,
    TagLabel,
    Text,
    VStack,
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
                    <Flex direction="row" p={5}>
                        <Image boxSize="128px" src={import.meta.env.BASE_URL + '/logo192.png'} />
                        <Flex direction="column" width="100%" alignItems="center" justifyContent="center">
                            <Text fontSize="xl" as="b">
                                {t('RMP Designer')}
                            </Text>
                            <br />
                            <Text>{appVersion}</Text>
                        </Flex>
                    </Flex>

                    <Box margin={5}>
                        <Text fontSize="xl">{t('header.about.intro')}</Text>
                    </Box>

                    <VStack>
                        <Tag
                            size="lg"
                            w="95%"
                            onClick={() => window.open('https://github.com/langonginc', '_blank')}
                            cursor="pointer"
                        >
                            <Avatar src="https://github.com/langonginc.png" size="lg" my={2} ml={-1} mr={2} />
                            <TagLabel display="block" width="100%">
                                <Text fontSize="lg" fontWeight="bold" mb={1}>
                                    langonginc
                                </Text>
                                <Text fontSize="sm">Live a life you will remember.</Text>
                                <Text fontSize="sm" align="right" mb={1}>
                                    --Avicii
                                </Text>
                            </TagLabel>
                        </Tag>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default AboutModal;
