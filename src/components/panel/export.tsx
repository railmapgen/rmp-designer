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
} from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Param } from '../../constants/constants';
import { nanoid } from '../../util/helper';

const RMP_MASTER_CHANNEL_NAME = 'RMP_MASTER_CHANNEL';
const RMP_MASTER_CHANNEL_POST = 'MASTER_POST';
const CHN_MASTER = new BroadcastChannel(RMP_MASTER_CHANNEL_NAME);

export const Export = (props: { isOpen: boolean; onClose: () => void; param: Param; exportMode?: boolean }) => {
    const { isOpen, onClose, param, exportMode } = props;
    const { t } = useTranslation();

    // const [code, setCode] = React.useState('');
    React.useEffect(() => {
        // if (isOpen) {
        //     // setCode(generateCode(param));
        //     // console.log(JSON.stringify({ ...param, id: nanoid(10) }));
        //     setCode(JSON.stringify({ ...param, id: nanoid(6) }));
        // }
        setLoading(false);
    }, [isOpen]);

    const [loading, setLoading] = React.useState(false);
    const postMessage = () => {
        setLoading(true);
        const post = JSON.stringify({ ...param, id: nanoid(6) });
        CHN_MASTER.postMessage({
            event: RMP_MASTER_CHANNEL_POST,
            data: post,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" scrollBehavior="inside">
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
                    <Text>Hi, the software has just been updated!</Text>
                    <Text>Please open RMP and go to the master node for importing.</Text>
                    {/*<Textarea value={code} readOnly fontFamily="monospace" fontSize="xs" minH="300" />*/}
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('close')}
                    </Button>
                    <Button colorScheme="blue" variant="solid" mr="1" onClick={postMessage} isLoading={loading}>
                        {t('header.export.export')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
