import { IconButton, Menu, MenuButton, MenuItem, MenuList, useToast } from '@chakra-ui/react';
import React from 'react';
import { MdNoteAdd, MdOpenInBrowser, MdOpenInNew, MdOutlineImage, MdUpload } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useRootDispatch } from '../../redux';
import { clearGlobalAlerts } from '../../redux/runtime/runtime-slice';
import { setLabel, setParam, setSvgs, setTransform } from '../../redux/param/param-slice';
import { defaultParam, defaultTransform, Param } from '../../constants/constants';
import { upgrade } from '../../util/save';
import { nanoid, readFileAsText } from '../../util/helper';
import { ImportFromSvg, isBase64Svg, loadSvgs } from './import-svg-modal';
import RmpGalleryAppClip from './rmp-gallery-app-clip';

export default function OpenActions() {
    const { t } = useTranslation();
    const dispatch = useRootDispatch();
    const toast = useToast();
    const fileSvgInputRef = React.useRef<HTMLInputElement | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [openImportSvg, setOpenImportSvg] = React.useState(false);
    const [isOpenGallery, setIsOpenGallery] = React.useState(false);

    const loadParam = async (paramStr: string) => {
        const updated = await upgrade(paramStr);
        const param = JSON.parse(updated);
        if (
            'id' in param &&
            'type' in param &&
            'label' in param &&
            'svgs' in param &&
            Array.isArray(param.svgs) &&
            'components' in param &&
            Array.isArray(param.components) &&
            'transform' in param
        ) {
            const p = await upgrade(paramStr);
            dispatch(setParam(JSON.parse(p) as Param));
        } else {
            toast({
                title: 'Invalid param',
                status: 'error' as const,
                duration: 9000,
                isClosable: true,
            });
            throw new Error('Invalid param');
        }
        dispatch(clearGlobalAlerts());
    };

    const handleUploadParam = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        console.log('OpenActions.handleUpload():: received file', file);

        if (file?.type !== 'application/json') {
            console.error('OpenActions.handleUpload():: Invalid file type! Only file in JSON format is accepted.');
        } else {
            try {
                const paramStr = await readFileAsText(file);
                await loadParam(paramStr);
            } catch (err) {
                console.error(
                    'OpenActions.handleUpload():: Unknown error occurred while parsing the uploaded file',
                    err
                );
            }
        }

        // clear field for next upload
        event.target.value = '';
        dispatch(clearGlobalAlerts());
    };

    const handleUploadSvg = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        console.log('OpenActions.handleUpload():: received file', file);

        if (file?.type !== 'image/svg+xml') {
            console.error('OpenActions.handleUpload():: Invalid file type! Only file in JSON format is accepted.');
        } else {
            try {
                const svgStr = await readFileAsText(file);
                if (isBase64Svg(svgStr)) {
                    toast({
                        title: 'SVG format not available',
                        status: 'error' as const,
                        duration: 9000,
                        isClosable: true,
                    });
                    return;
                }
                dispatch(setSvgs(loadSvgs(svgStr)));
                dispatch(setLabel(`SVG ${nanoid(5)}`));
                dispatch(setTransform(defaultTransform));
            } catch (err) {
                console.error(
                    'OpenActions.handleUpload():: Unknown error occurred while parsing the uploaded file',
                    err
                );
            }
        }

        // clear field for next upload
        event.target.value = '';
        dispatch(clearGlobalAlerts());
    };

    return (
        <Menu id="upload">
            <MenuButton as={IconButton} size="sm" variant="ghost" icon={<MdUpload />} />
            <MenuList>
                <MenuItem
                    icon={<MdNoteAdd />}
                    onClick={() => {
                        dispatch(setParam(defaultParam));
                        dispatch(setTransform(defaultTransform));
                        dispatch(clearGlobalAlerts());
                    }}
                >
                    {t('header.import.new')}
                </MenuItem>
                <input
                    id="upload_param"
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    hidden={true}
                    onChange={handleUploadParam}
                    data-testid="file-upload"
                />
                <MenuItem icon={<MdUpload />} onClick={() => fileInputRef?.current?.click()}>
                    {t('header.import.uploadParam')}
                </MenuItem>
                <MenuItem hidden={true} icon={<MdOutlineImage />} onClick={() => setOpenImportSvg(true)}>
                    {t('header.import.pasteSVG')}
                </MenuItem>
                <input
                    id="upload_svg"
                    ref={fileSvgInputRef}
                    type="file"
                    accept=".svg"
                    hidden={true}
                    onChange={handleUploadSvg}
                    data-testid="file-upload"
                />
                <MenuItem icon={<MdOpenInBrowser />} onClick={() => fileSvgInputRef?.current?.click()}>
                    {t('header.import.uploadSVG')}
                </MenuItem>
                <MenuItem icon={<MdOpenInNew />} onClick={() => setIsOpenGallery(true)}>
                    {t('header.import.gallery')}
                </MenuItem>
            </MenuList>
            <ImportFromSvg isOpen={openImportSvg} onClose={() => setOpenImportSvg(false)} />
            <RmpGalleryAppClip isOpen={isOpenGallery} onClose={() => setIsOpenGallery(false)} />
        </Menu>
    );
}
