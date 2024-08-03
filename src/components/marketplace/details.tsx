import {
    Avatar,
    Heading,
    IconButton,
    Image,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spacer,
    Text,
    Tooltip,
    useToast,
    VStack,
} from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BiImport } from 'react-icons/bi';
import { MdDownload, MdShare } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import useTranslatedName from '../../util/hook';
import { Metadata } from '../../constants/marketplace';
import { useDispatch } from 'react-redux';
import { setParam } from '../../redux/param/param-slice';
import { defaultParam, Param } from '../../constants/constants';

const MarketplaceDetailsModal = (props: { id: string; metadata: Metadata; isOpen: boolean; onClose: () => void }) => {
    const { id, metadata, isOpen, onClose } = props;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const toast = useToast();
    const { t } = useTranslation();
    const translateName = useTranslatedName();

    const [dataParam, setDataParam] = React.useState<Param>(defaultParam);
    React.useEffect(() => {
        fetch(`resources/json/${id}.json`)
            .then(res => res.json())
            .then(data => setDataParam(data));
    }, [id]);

    const handleOpenTemplate = () => {
        dispatch(setParam(dataParam));
        toast({
            title: t(`Template ${id} imported in RMP Designer.`),
            status: 'success' as const,
            duration: 9000,
            isClosable: true,
        });
        onClose();
        navigate('/');
    };

    const rmpShareLink = `https://${window.location.hostname}/?app=rmp&searchParams=${id}`;
    const rmpShareLinkClickedToast = {
        title: t('Link copied.'),
        status: 'success' as const,
        duration: 9000,
        isClosable: true,
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t('marketplace.details')}</ModalHeader>
                <ModalCloseButton />

                <ModalBody paddingBottom={10}>
                    <VStack>
                        <a href={`resources/images/${id}.jpg`} target="_blank" rel="noopener noreferrer">
                            <Image src={`resources/images/${id}.jpg`} alt={id} borderRadius="lg" />
                        </a>
                    </VStack>
                    <Heading as="h5" size="md" mt={3} mb={2}>
                        {translateName(metadata.name)}
                    </Heading>
                    <Text>{translateName(metadata.desc)}</Text>
                </ModalBody>

                <ModalFooter>
                    <Avatar src={`https://avatars.githubusercontent.com/u/${metadata.contributor}?s=48`} />
                    <Spacer />
                    <Tooltip label={'Coming soon...'}>
                        <IconButton
                            aria-label="Share"
                            variant="ghost"
                            icon={<MdShare />}
                            onClick={() => {
                                navigator.clipboard.writeText(rmpShareLink);
                                toast(rmpShareLinkClickedToast);
                            }}
                            isDisabled={true}
                        />
                    </Tooltip>
                    <a href={`resources/json/${id}.json`} target="_blank" rel="noopener noreferrer">
                        <IconButton aria-label="Download" variant="ghost" icon={<MdDownload />} />
                    </a>
                    <IconButton aria-label="Import" variant="ghost" icon={<BiImport />} onClick={handleOpenTemplate} />
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default MarketplaceDetailsModal;
