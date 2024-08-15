import { CloseButton, SystemStyleObject } from '@chakra-ui/react';
import { RmgAppClip } from '@railmapgen/rmg-components';
import React from 'react';
import { Param } from '../../constants/constants';
import { useRootDispatch } from '../../redux';
import { clearSelected } from '../../redux/runtime/runtime-slice';
import { setParam } from '../../redux/param/param-slice';
import { upgrade } from '../../util/save';

const RMP_GALLERY_CHANNEL_NAME = 'RMP_GALLERY_CHANNEL';
const RMP_GALLERY_CHANNEL_EVENT = 'OPEN_DESIGNER';
const CHN = new BroadcastChannel(RMP_GALLERY_CHANNEL_NAME);

const styles: SystemStyleObject = {
    h: '80%',
    w: '80%',

    '& iframe': {
        h: '100%',
        w: '100%',
    },

    '& div': {
        h: '100%',
        w: '100%',
    },
};

interface RmpGalleryAppClipProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RmpGalleryAppClip(props: RmpGalleryAppClipProps) {
    const { isOpen, onClose } = props;
    const dispatch = useRootDispatch();

    const handleOpenTemplate = async (paramStr: string) => {
        const param = JSON.parse(await upgrade(paramStr)) as Param;
        dispatch(clearSelected());
        dispatch(setParam(param));
    };

    React.useEffect(() => {
        CHN.onmessage = e => {
            const { event, data: paramStr } = e.data;
            console.log(event);
            if (event === RMP_GALLERY_CHANNEL_EVENT) {
                handleOpenTemplate(paramStr);
                onClose();
            }
        };
        return () => CHN.close();
    }, []);

    return (
        <RmgAppClip isOpen={isOpen} onClose={onClose} size="full" sx={styles}>
            <iframe src="/rmp-gallery/" loading="lazy" />
            <CloseButton onClick={onClose} position="fixed" top="5px" right="15px" />
        </RmgAppClip>
    );
}
