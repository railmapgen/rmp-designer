import {
    Box,
    Card,
    CardBody,
    CardHeader,
    Flex,
    Heading,
    IconButton,
    SystemStyleObject,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
} from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdClose } from 'react-icons/md';
import { defaultMetadata, Marketplace, Metadata, ResponseMetadata } from '../../constants/marketplace';
import { useRootSelector } from '../../redux';
import { decompressFromBase64 } from '../../util/helper';
import { TemplateCard } from './template-card';
import MarketplaceDetailsModal from './details';
import { Preview } from '../panel/preview';

const stickyHeaderStyles: SystemStyleObject = {
    position: 'sticky',
    top: -4,
    zIndex: 1,
    background: 'inherit',
};

export default function MarketplaceView() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { login } = useRootSelector(state => state.app);
    const { refresh } = useRootSelector(state => state.marketplace);

    const [id, setId] = React.useState<number>(1);
    const [metadata, setMetadata] = React.useState<Metadata>(defaultMetadata);
    const [userRole, setUserRole] = React.useState('USER');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

    const handleDetails = (id: number, metadata: Metadata) => {
        setId(id);
        setMetadata(metadata);
        setIsDetailsModalOpen(true);
    };

    const handleNew = () => setIsPreviewOpen(true);

    const [publicList, setPublicList] = React.useState<Marketplace>({});
    const [myList, setMyList] = React.useState<Marketplace>({});
    const [adminList, setAdminList] = React.useState<Marketplace>({});

    React.useEffect(() => {
        const setItem = (p: ResponseMetadata): Marketplace[number] => {
            const data = JSON.parse(p.data);
            return {
                name: data.name,
                desc: data.desc,
                contributor: `${p.userId}`,
                lastUpdateOn: p.lastUpdateAt,
                type: p.type,
                status: p.status,
                paramStr: data.param,
                svgString: decompressFromBase64(p.svgString),
                svgHash: data.svgHash,
            };
        };

        const fetchServerPublic = async () => {
            if (!login) return;
            const rep = await fetch('http://localhost:3000/v1/designer/public', {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${login!.token}`,
                },
            });
            if (rep.status !== 200) {
                return;
            }
            const res = await rep.json();

            const pub: Marketplace = {};
            res.forEach((p: ResponseMetadata) => {
                pub[p.id] = setItem(p);
            });
            setPublicList(pub);
            return;
        };

        const fetchServerUser = async () => {
            if (!login) return;
            const rep = await fetch('http://localhost:3000/v1/designer/user', {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${login!.token}`,
                },
            });
            if (rep.status !== 200) {
                return;
            }
            const { userRole, data: res } = await rep.json();

            const user: Marketplace = {};
            res.forEach((p: ResponseMetadata) => {
                user[p.id] = setItem(p);
            });
            setMyList(user);
            setUserRole(userRole);
            if (userRole === 'ADMIN') {
                await fetchServerAdmin();
            }
            return;
        };

        const fetchServerAdmin = async () => {
            if (!login) return;
            const rep = await fetch('http://localhost:3000/v1/designer/admin', {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${login!.token}`,
                },
            });
            if (rep.status !== 200) {
                return;
            }
            const res = await rep.json();

            const admin: Marketplace = {};
            res.forEach((p: ResponseMetadata) => {
                admin[p.id] = setItem(p);
            });
            setAdminList(admin);
            return;
        };

        fetchServerPublic();
        fetchServerUser();
    }, [refresh]);

    const [filterName, setFilterName] = React.useState('');
    const [sortBy, setSortBy] = React.useState('alphabetical' as 'alphabetical' | 'update_time');
    const sortByOptions = {
        alphabetical: t('marketplace.sortBy.alphabetical'),
        update_time: t('marketplace.sortBy.updateTime'),
    };
    const fields: RmgFieldsField[] = [
        {
            type: 'input',
            label: t('marketplace.filterName'),
            value: filterName,
            onChange: val => setFilterName(val),
            debouncedDelay: 500,
            minW: 200,
        },
        {
            type: 'select',
            label: t('marketplace.sortBy.label'),
            value: sortBy,
            options: sortByOptions,
            onChange: val => setSortBy(val.toString() as 'alphabetical' | 'update_time'),
            minW: 200,
        },
    ];

    const [type, setType] = React.useState('public');
    const handleTabChange = (i: number) => {
        if (i === 0) setType('public');
        else if (i === 1) setType('my');
        else if (i === 2) setType('admin');
    };

    const tabs = Object.entries(adminList).length > 0 ? [publicList, myList, adminList] : [publicList, myList];
    const noLogin =
        Object.entries(publicList).length + Object.entries(myList).length + Object.entries(adminList).length === 0;

    return (
        <>
            {!noLogin ? (
                <Tabs isLazy isFitted onChange={i => handleTabChange(i)} overflow="hidden">
                    <TabList>
                        <Tab>{t('gallery.type.public')}</Tab>
                        <Tab>{t('gallery.type.my')}</Tab>
                        {Object.entries(adminList).length > 0 && <Tab>{t('admin')}</Tab>}
                        <IconButton
                            aria-label="bacl"
                            size="lg"
                            icon={<MdClose />}
                            variant="ghost"
                            onClick={() => navigate('/')}
                        />
                    </TabList>
                    <TabPanels overflow="hidden" h="100%">
                        {tabs.map((g, i) => (
                            <TabPanel key={i}>
                                {type === 'public' && (
                                    <Card mt="2" overflowY="auto" h="calc(100% - 2rem - 8px)">
                                        <CardHeader sx={stickyHeaderStyles}>
                                            <Flex direction="row">
                                                <Heading size="lg" mr="auto">
                                                    {t('marketplace.editorSelected')}
                                                </Heading>
                                            </Flex>
                                        </CardHeader>
                                        <CardBody paddingTop="0">
                                            <Flex flexWrap="wrap">
                                                {[3]
                                                    .map(id => ({ id, metadata: publicList[id] }))
                                                    .filter(({ metadata }) => metadata !== undefined)
                                                    .map(({ id, metadata }) => (
                                                        <TemplateCard
                                                            key={id}
                                                            id={id}
                                                            metadata={metadata}
                                                            handleDetails={handleDetails}
                                                        />
                                                    ))}
                                            </Flex>
                                        </CardBody>
                                    </Card>
                                )}

                                <Card mt="2">
                                    <CardHeader sx={stickyHeaderStyles}>
                                        <Flex direction="row">
                                            <Heading size="lg" mr="auto">
                                                {t('marketplace.all')}
                                            </Heading>
                                            <RmgFields fields={fields} />
                                        </Flex>
                                    </CardHeader>
                                    <CardBody paddingTop="0">
                                        <Flex flexWrap="wrap">
                                            {Object.entries(g)
                                                .filter(([_, metadata]) =>
                                                    filterName === ''
                                                        ? true
                                                        : Object.values(metadata.name.en as string)
                                                              .map(_ => _.toLowerCase())
                                                              .join()
                                                              .includes(filterName.toLowerCase())
                                                )
                                                .sort((a, b) =>
                                                    // https://stackoverflow.com/questions/59773396/why-array-prototype-sort-has-different-behavior-in-chrome
                                                    sortBy === 'alphabetical'
                                                        ? b[1].name.en! < a[1].name.en!
                                                            ? 1
                                                            : -1
                                                        : b[1].lastUpdateOn - a[1].lastUpdateOn
                                                )
                                                .map(([id, metadata]) => (
                                                    <TemplateCard
                                                        key={id}
                                                        id={Number(id)}
                                                        metadata={metadata}
                                                        handleDetails={handleDetails}
                                                    />
                                                ))}
                                            <Box
                                                onClick={handleNew}
                                                position="fixed"
                                                bottom="20px"
                                                right="20px"
                                                zIndex={3}
                                            >
                                                <IconButton
                                                    aria-label="new"
                                                    size="lg"
                                                    icon={<MdAdd />}
                                                    colorScheme="blue"
                                                    variant="solid"
                                                />
                                            </Box>
                                            <Box
                                                onClick={() => navigate('/')}
                                                position="fixed"
                                                bottom="20px"
                                                right="75px"
                                                zIndex={3}
                                            >
                                                <IconButton
                                                    aria-label="bacl"
                                                    size="lg"
                                                    icon={<MdClose />}
                                                    variant="solid"
                                                />
                                            </Box>
                                        </Flex>
                                    </CardBody>
                                </Card>
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>
            ) : (
                <Card mt="2" overflowY="auto" h="calc(100% - 2rem - 8px)">
                    <CardHeader sx={stickyHeaderStyles}>
                        <Flex direction="row">
                            <Heading size="lg" mr="auto">
                                {t('marketplace.title')}
                            </Heading>
                            <IconButton
                                aria-label="bacl"
                                size="lg"
                                icon={<MdClose />}
                                variant="outline"
                                onClick={() => navigate('/')}
                            />
                        </Flex>
                    </CardHeader>
                    <CardBody>
                        <Text>Login first</Text>
                    </CardBody>
                </Card>
            )}
            <MarketplaceDetailsModal
                id={id}
                metadata={metadata}
                userRole={userRole}
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
            />
            <Preview isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
        </>
    );
}
