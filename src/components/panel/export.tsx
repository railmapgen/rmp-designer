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

    React.useEffect(() => {
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
                    <Text hidden={exportMode}>Hi, the software has just been updated!</Text>
                    <Text hidden={exportMode}>Please open RMP and go to the master node for importing.</Text>
                    <br />
                    <Text hidden={exportMode}>嗨，软件刚刚更新！</Text>
                    <Text hidden={exportMode}>请打开 RMP，进入大师节点后再进行导入。</Text>
                    <br />
                    <Text hidden={exportMode}>嗨，軟體剛剛更新！</Text>
                    <Text hidden={exportMode}>請打開 RMP，進入大師節點後再進行導入。</Text>
                    <br />
                    <Text hidden={exportMode}>こんにちは、ソフトウェアが更新されました！</Text>
                    <Text hidden={exportMode}>RMP を開いて、マスターノードに移動してからインポートしてください。</Text>
                    <br />
                    <Text hidden={exportMode}>안녕하세요, 소프트웨어가 방금 업데이트되었습니다!</Text>
                    <Text hidden={exportMode}>RMP 를 열고 마스터 노드로 이동한 후 가져오기를 진행하세요.</Text>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                        {t('close')}
                    </Button>
                    <Button
                        colorScheme="blue"
                        variant="solid"
                        mr="1"
                        onClick={postMessage}
                        isLoading={loading}
                        hidden={!exportMode}
                    >
                        {t('header.export.export')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
