import { Button, Flex, Heading, HStack, SystemStyleObject, useToast } from '@chakra-ui/react';
import { RmgFields, RmgFieldsField, RmgLabel, RmgPage } from '@railmapgen/rmg-components';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRootSelector } from '../../redux';
import { RMT_SERVER } from '../../constants/constants';
import { defaultMetadataDetail, MetadataDetail } from '../../constants/marketplace';
import { compressToBase64, createHash } from '../../util/helper';
import RmpGalleryAppClip from '../header/rmp-gallery-app-clip';
import MultiLangEntryCard from './multi-lang-entry-card';

const pageStyles: SystemStyleObject = {
    px: 2,
    pt: 2,
    width: { base: '100%', md: 520 },

    '& > div:first-of-type': {
        flexDirection: 'column',
        flex: 1,
        overflowY: 'auto',
    },

    '& > div:nth-of-type(2)': {
        my: 2,
    },
};

export default function Ticket() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { login } = useRootSelector(state => state.app);
    const { t } = useTranslation();

    const handleBack = () => navigate('/');

    const [metadata, setMetadata] = React.useState<MetadataDetail>(defaultMetadataDetail);
    React.useEffect(() => {
        if (state && state.metadata) {
            const data = state.metadata as MetadataDetail;
            if (data.from === 'designer') {
                setMetadata(state.metadata);
            } else {
                setMetadata({ ...metadata, id: Number(data.id) });
                if (metadata.svgString === '' || metadata.param === '') {
                    setMetadata({ ...metadata, svgString: data.svgString, param: data.param, type: data.type });
                }
                if (metadata.name.en === '' && metadata.desc.en === '') {
                    setMetadata({ ...metadata, name: data.name, desc: data.desc });
                }
            }
        }
    }, [state]);

    const name = metadata.name['en']?.replace(/[^A-Za-z0-9]/g, '').toLowerCase() ?? '';

    const [isLoading, setIsLoading] = React.useState(false);
    const [openGallery, setOpenGallery] = React.useState(false);

    const handleSubmit = async () => {
        if (!login) return;
        setIsLoading(true);
        const mainData = {
            data: metadata.param,
            hash: await createHash(metadata.param),
            name: JSON.stringify(metadata.name),
            desc: JSON.stringify(metadata.desc),
            type: metadata.type,
            svg: compressToBase64(metadata.svgString),
        };
        const rep =
            metadata.id === -1
                ? await fetch(RMT_SERVER + '/designer/public', {
                      method: 'POST',
                      headers: {
                          accept: 'application/json',
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${login!.token}`,
                      },
                      body: JSON.stringify(mainData),
                  })
                : await fetch(`${RMT_SERVER}/designer/public/${metadata.id}`, {
                      method: 'PATCH',
                      headers: {
                          accept: 'application/json',
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${login!.token}`,
                      },
                      body: JSON.stringify(mainData),
                  });
        setIsLoading(false);
        if (rep.status !== 201 && rep.status !== 200) {
            toast({
                title: `Failed: ${rep.status} ${rep.statusText}`,
                status: 'error' as const,
                duration: 9000,
                isClosable: true,
            });
            return;
        }
        toast({
            title: 'Done!',
            status: 'success' as const,
            duration: 9000,
            isClosable: true,
        });
        handleBack();
    };

    const field: RmgFieldsField[] = [
        {
            type: 'input',
            value: metadata.id.toString(),
            label: 'replacing work ID',
            onChange: val => setMetadata({ ...metadata, id: Number(val) }),
            hidden: metadata.id === -1,
        },
        {
            type: 'custom',
            label: '',
            component: <Button onClick={() => setMetadata({ ...metadata, id: -1 })}>{t('ticket.new')}</Button>,
            hidden: metadata.id === -1,
        },
        {
            type: 'custom',
            label: '',
            component: (
                <Button
                    onClick={() => {
                        setMetadata({ ...metadata, id: 1 });
                        setOpenGallery(true);
                    }}
                >
                    {t('ticket.replace')}
                </Button>
            ),
            hidden: metadata.id !== -1,
        },
    ];

    return (
        <RmgPage sx={pageStyles}>
            <Flex>
                <Heading size="lg">{t('ticket.title')}</Heading>
                <Heading size="md">{t('ticket.infoSection')}</Heading>
                <div dangerouslySetInnerHTML={{ __html: metadata.svgString }} />
                <Button onClick={handleBack}>{t('ticket.change')}</Button>
                <RmgLabel label={t('ticket.cityName')}>
                    <MultiLangEntryCard
                        inputType="input"
                        translations={Object.entries(metadata.name)}
                        onUpdate={(lang, name) =>
                            setMetadata({ ...metadata, name: { ...metadata.name, [lang]: name } })
                        }
                        onLangSwitch={(prevLang, nextLang) => {
                            const metadataCopy = structuredClone(metadata);
                            metadataCopy.name[nextLang] = metadataCopy.name[prevLang];
                            delete metadataCopy.name[prevLang];
                            setMetadata(metadataCopy);
                        }}
                        onRemove={lang => {
                            const metadataCopy = structuredClone(metadata);
                            delete metadataCopy.name[lang];
                            setMetadata(metadataCopy);
                        }}
                    />
                </RmgLabel>
                <RmgLabel label={t('ticket.description')}>
                    <MultiLangEntryCard
                        inputType="textarea"
                        translations={Object.entries(metadata.desc)}
                        onUpdate={(lang, desc) =>
                            setMetadata({ ...metadata, desc: { ...metadata.desc, [lang]: desc } })
                        }
                        onLangSwitch={(prevLang, nextLang) => {
                            const metadataCopy = structuredClone(metadata);
                            metadataCopy.desc[nextLang] = metadataCopy.desc[prevLang];
                            delete metadataCopy.desc[prevLang];
                            setMetadata(metadataCopy);
                        }}
                        onRemove={lang => {
                            const metadataCopy = structuredClone(metadata);
                            delete metadataCopy.desc[lang];
                            setMetadata(metadataCopy);
                        }}
                    />
                </RmgLabel>
                <Heading size="md">{t('ticket.operationSection')}</Heading>
                <RmgFields fields={field} />
            </Flex>

            <Flex>
                <Button size="sm" onClick={handleBack}>
                    {t('ticket.back')}
                </Button>

                <HStack ml="auto">
                    <Button
                        size="sm"
                        colorScheme="primary"
                        isDisabled={
                            metadata.svgString === '' ||
                            (Object.keys(metadata.desc).length > 0 && !('en' in metadata.desc)) ||
                            name === ''
                        }
                        onClick={handleSubmit}
                        isLoading={isLoading}
                    >
                        {t('ticket.submit')}
                    </Button>
                </HStack>
            </Flex>
            <RmpGalleryAppClip isOpen={openGallery} onClose={() => setOpenGallery(false)} />
        </RmgPage>
    );
}
