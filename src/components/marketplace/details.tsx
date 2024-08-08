import {
    Avatar,
    Button,
    Flex,
    Heading,
    IconButton,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Popover,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
    Spacer,
    Text,
    Tooltip,
    useToast,
} from '@chakra-ui/react';
import { RmgLineBadge } from '@railmapgen/rmg-components';
import { MonoColour } from '@railmapgen/rmg-palette-resources';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { BiImport } from 'react-icons/bi';
import { MdDownload, MdShare, MdVisibility } from 'react-icons/md';
import useTranslatedName from '../../util/hook';
import { useRootSelector } from '../../redux';
import { setParam } from '../../redux/param/param-slice';
import { defaultParam, Param } from '../../constants/constants';
import { Metadata } from '../../constants/marketplace';
import { downloadAs } from '../../util/helper';
import { Export } from '../panel/export';
import { setRefresh } from '../../redux/marketplace/marketplace-slice';

const MarketplaceDetailsModal = (props: {
    id: number;
    metadata: Metadata;
    isOpen: boolean;
    onClose: () => void;
    userRole: string;
}) => {
    const { id, metadata, isOpen, onClose, userRole } = props;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const toast = useToast();
    const { t } = useTranslation();
    const { login } = useRootSelector(state => state.app);
    const translateName = useTranslatedName();

    const handleOpenTemplate = () => {
        dispatch(setParam(JSON.parse(metadata.paramStr)));
        toast({
            title: t(`Template ${id} imported in RMP Designer.`),
            status: 'success' as const,
            duration: 9000,
            isClosable: true,
        });
        onClose();
        navigate('/');
    };

    const [metaToParam, setMetaToParams] = React.useState<Param>(defaultParam);
    React.useEffect(() => {
        try {
            const p = JSON.parse(metadata.paramStr);
            setMetaToParams(p);
        } catch {
            return;
        }
    }, [id, isOpen]);

    const rmpShareLink = `https://${window.location.hostname}/?app=rmp&searchParams=${id}`;
    const rmpShareLinkClickedToast = {
        title: t('Link copied.'),
        status: 'success' as const,
        duration: 9000,
        isClosable: true,
    };

    const handleChangeStatus = async (type: 'public' | 'pending' | 'rejected') => {
        console.log(login);
        if (!login) return;
        const rep = await fetch('http://localhost:3000/v1/designer/admin', {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${login!.token}`,
            },
            body: JSON.stringify({
                id,
                status: type,
            }),
            method: 'PATCH',
        });
        if (rep.status !== 200) {
            toast({
                title: `Failed: ${rep.status} ${rep.statusText}`,
                status: 'error' as const,
                duration: 9000,
                isClosable: true,
            });
            return;
        }
        toast({
            title: `Success!`,
            status: 'success' as const,
            duration: 9000,
            isClosable: true,
        });
        dispatch(setRefresh());
        setIsVisibleOpen(false);
        onClose();
    };

    const [isExportOpen, setIsExportOpen] = React.useState(false);
    const [isVisibleOpen, setIsVisibleOpen] = React.useState(false);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{t('marketplace.details')}</ModalHeader>
                <ModalCloseButton />

                <ModalBody paddingBottom={10}>
                    <div dangerouslySetInnerHTML={{ __html: metadata.svgString }} />
                    <Heading as="h5" size="md" mt={3} mb={2}>
                        {translateName(metadata.name)}
                        {metadata.status !== 'public' && (
                            <RmgLineBadge
                                mx={2}
                                name={metadata.status}
                                fg={MonoColour.white}
                                bg={metadata.status === 'pending' ? '#faa037' : '#ec0202'}
                            />
                        )}
                    </Heading>
                    <Text>{translateName(metadata.desc)}</Text>
                </ModalBody>

                <ModalFooter>
                    <Avatar />
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
                    <Popover isOpen={isVisibleOpen}>
                        <PopoverTrigger>
                            <IconButton
                                hidden={userRole !== 'ADMIN'}
                                aria-label="zoom"
                                variant="ghost"
                                icon={<MdVisibility />}
                                onClick={() => setIsVisibleOpen(!isVisibleOpen)}
                            />
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverBody>
                                <Flex direction="row">
                                    <Button colorScheme="green" onClick={() => handleChangeStatus('public')}>
                                        PUBLIC
                                    </Button>
                                    <Button colorScheme="yellow" onClick={() => handleChangeStatus('pending')}>
                                        PENDING
                                    </Button>
                                    <Button colorScheme="red" onClick={() => handleChangeStatus('rejected')}>
                                        REJECTED
                                    </Button>
                                </Flex>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                    <IconButton
                        aria-label="Download"
                        variant="ghost"
                        icon={<MdDownload />}
                        onClick={() =>
                            downloadAs(
                                `RMP-Designer_Marketplace_${new Date().valueOf()}.json`,
                                'application/json',
                                metadata.paramStr
                            )
                        }
                    />
                    <IconButton aria-label="Import" variant="ghost" icon={<BiImport />} onClick={handleOpenTemplate} />
                    <Button variant="ghost" onClick={() => setIsExportOpen(true)}>
                        RMP
                    </Button>
                </ModalFooter>
            </ModalContent>
            <Export isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} param={metaToParam} />
        </Modal>
    );
};

export default MarketplaceDetailsModal;
