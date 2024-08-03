import { Box, Card, CardBody, CardHeader, Flex, Heading, IconButton, SystemStyleObject } from '@chakra-ui/react';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdClose } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { defaultMetadata, Marketplace, Metadata, MetadataDetail } from '../../constants/marketplace';
import { setStyles } from '../../redux/marketplace/marketplace-slice';
import { useRootDispatch, useRootSelector } from '../../redux';
import { TemplateCard } from './template-card';
import MarketplaceDetailsModal from './details';
import { nanoid } from '../../util/helper';

const stickyHeaderStyles: SystemStyleObject = {
    position: 'sticky',
    top: -4,
    zIndex: 1,
    background: 'inherit',
};

export default function MarketplaceView() {
    const navigate = useNavigate();
    const dispatch = useRootDispatch();
    const { t } = useTranslation();
    const { styles } = useRootSelector(state => state.marketplace);

    const [id, setId] = React.useState('shanghai');
    const [metadata, setMetadata] = React.useState<Metadata>(defaultMetadata);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
    const handleDetails = (id: string, metadata: Metadata) => {
        setId(id);
        setMetadata(metadata);
        setIsDetailsModalOpen(true);
    };

    const handleNew = () => {
        navigate('/new', {
            state: {
                metadata: {
                    name: { en: '' },
                    desc: { en: '' },
                    justification: 'New style ',
                } as MetadataDetail,
                id: nanoid(10),
            },
        });
    };

    React.useEffect(() => {
        fetch('resources/styles.json')
            .then(res => res.json() as Promise<Marketplace>)
            .then(data => dispatch(setStyles(data)));
    }, []);

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

    return (
        <>
            <Box>
                <Card mt="2">
                    <CardHeader sx={stickyHeaderStyles}>
                        <Flex direction="row">
                            <Heading size="lg" mr="auto">
                                {t('marketplace.editorSelected')}
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
                    <CardBody paddingTop="0">
                        <Flex flexWrap="wrap">
                            {['test02']
                                .map(id => ({ id, metadata: styles[id] }))
                                .filter(({ metadata }) => metadata !== undefined)
                                .map(({ id, metadata }) => (
                                    <TemplateCard key={id} id={id} metadata={metadata} handleDetails={handleDetails} />
                                ))}
                        </Flex>
                    </CardBody>
                </Card>

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
                            {Object.entries(styles)
                                .filter(([_, metadata]) =>
                                    filterName === ''
                                        ? true
                                        : Object.values(metadata.name)
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
                                    <TemplateCard key={id} id={id} metadata={metadata} handleDetails={handleDetails} />
                                ))}
                            <Box onClick={handleNew} position="fixed" bottom="20px" right="20px" zIndex={3}>
                                <IconButton
                                    aria-label="new"
                                    size="lg"
                                    icon={<MdAdd />}
                                    colorScheme="blue"
                                    variant="solid"
                                />
                            </Box>
                            <Box onClick={() => navigate('/')} position="fixed" bottom="20px" right="75px" zIndex={3}>
                                <IconButton aria-label="bacl" size="lg" icon={<MdClose />} variant="solid" />
                            </Box>
                        </Flex>
                    </CardBody>
                </Card>
            </Box>
            <MarketplaceDetailsModal
                id={id}
                metadata={metadata}
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
            />
        </>
    );
}
