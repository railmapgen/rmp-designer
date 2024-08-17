import { CloseButton, SystemStyleObject } from '@chakra-ui/react';
import { RmgAppClip } from '@railmapgen/rmg-components';
import React from 'react';

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

    return (
        <RmgAppClip isOpen={isOpen} onClose={onClose} size="full" sx={styles}>
            <iframe src="/rmp-gallery/" loading="lazy" />
            <CloseButton onClick={onClose} position="fixed" top="5px" right="15px" />
        </RmgAppClip>
    );
}
