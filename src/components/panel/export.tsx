import {
    Badge,
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
import { nanoid } from '../../util/helper';

export const Export = (props: { isOpen: boolean; onClose: () => void; param: Param }) => {
    const { isOpen, onClose, param } = props;
    const { t } = useTranslation();

    const [code, setCode] = React.useState('');
    React.useEffect(() => {
        if (isOpen) {
            // setCode(generateCode(param));
            // console.log(JSON.stringify({ ...param, id: nanoid(10) }));
            setCode(JSON.stringify({ ...param, id: nanoid(6) }));
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Text as="b" fontSize="xl">
                        {t('header.export.export')}
                        <Badge ml="1" colorScheme="green">
                            RMP
                        </Badge>
                    </Text>
                    <ModalCloseButton />
                </ModalHeader>

                <ModalBody>
                    <Textarea value={code} readOnly fontFamily="monospace" fontSize="xs" minH="300" />
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
