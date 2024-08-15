import { Button, Flex, Heading, HStack, SystemStyleObject, useToast } from '@chakra-ui/react';
import { RmgFields, RmgFieldsField, RmgLabel, RmgPage } from '@railmapgen/rmg-components';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRootSelector } from '../../redux';
import { setRefresh } from '../../redux/marketplace/marketplace-slice';
import { RMT_SERVER } from '../../constants/constants';
import { defaultMetadataDetail, MetadataDetail } from '../../constants/marketplace';
import { compressToBase64, createHash } from '../../util/helper';
import MultiLangEntryCard from './multi-lang-entry-card';

const RMP_GALLERY_CHANNEL_NAME = 'RMP_GALLERY_CHANNEL';
const RMP_GALLERY_CHANNEL_EVENT = 'NEW_DESIGNER';
const CHN = new BroadcastChannel(RMP_GALLERY_CHANNEL_NAME);

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
    const dispatch = useDispatch();
    const { login } = useRootSelector(state => state.app);
    const { t } = useTranslation();

    const handleBack = () => navigate('/');

    const [metadata, setMetadata] = React.useState<MetadataDetail>(defaultMetadataDetail);
    const [editId, setEditId] = React.useState(-1);
    React.useEffect(() => {
        if (state && state.metadata) {
            setMetadata(state.metadata);
        }
    }, [state]);

    const name = metadata.name['en']?.replace(/[^A-Za-z0-9]/g, '').toLowerCase() ?? '';

    const [isLoading, setIsLoading] = React.useState(false);

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
            editId === -1
                ? await fetch(RMT_SERVER + '/designer/public', {
                      method: 'POST',
                      headers: {
                          accept: 'application/json',
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${login!.token}`,
                      },
                      body: JSON.stringify(mainData),
                  })
                : await fetch(`${RMT_SERVER}/designer/public/${editId}`, {
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
        dispatch(setRefresh());
        handleBack();
    };

    React.useEffect(() => {
        CHN.onmessage = e => {
            const { event, data } = e.data;
            console.log(event);
            if (event === RMP_GALLERY_CHANNEL_EVENT) {
                console.info(data);
                if (data && data.id) {
                    setEditId(Number(data.id));
                    if (metadata.svgString === '' || metadata.param) {
                        setMetadata({ ...metadata, svgString: data.svg, param: data.data, type: data.type });
                    }
                    if (metadata.name.en === '' && metadata.desc.en === '') {
                        setMetadata({ ...metadata, name: data.name, desc: data.desc });
                    }
                }
            }
        };
        return () => CHN.close();
    }, []);

    const field: RmgFieldsField[] = [
        {
            type: 'input',
            value: editId.toString(),
            label: 'replacing work ID',
            onChange: val => setEditId(Number(val)),
            hidden: editId === -1,
        },
        {
            type: 'custom',
            label: '',
            component: <Button onClick={() => setEditId(-1)}>As a new work</Button>,
            hidden: editId === -1,
        },
        {
            type: 'custom',
            label: '',
            component: <Button onClick={() => setEditId(1)}>Replace a existing work</Button>,
            hidden: editId !== -1,
        },
    ];

    return (
        <RmgPage sx={pageStyles}>
            <Flex>
                <Heading size="lg">{editId === -1 ? 'Uploading to gallery' : 'Updating your work'}</Heading>
                <div dangerouslySetInnerHTML={{ __html: metadata.svgString }} />
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
        </RmgPage>
    );
}
