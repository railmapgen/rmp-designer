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
import { CreateSvgs } from '../svgs/createSvgs';
import { useRootDispatch, useRootSelector } from '../../redux';
import { RmgFields, RmgFieldsField } from '@railmapgen/rmg-components';
import { setLabel, setTransform } from '../../redux/param/param-slice';
import { Export } from './export';

export const Preview = (props: { isOpen: boolean; onClose: () => void }) => {
    const { isOpen, onClose } = props;
    const { t } = useTranslation();
    const param = useRootSelector(store => store.param);
    const dispatch = useRootDispatch();

    const svgRef = React.useRef<SVGSVGElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const [showLines, setShowLines] = React.useState(false);
    const [showBadges, setShowBadges] = React.useState(false);
    const [isExportOpen, setExportOpen] = React.useState(false);

    const exportToJpg = () => {
        setShowLines(false);
        setShowBadges(false);

        const svg = svgRef.current;
        const canvas = canvasRef.current;
        if (!svg || !canvas) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const scaleFactor = 4;
            const width = img.width;
            const height = img.height;
            canvas.width = width * scaleFactor;
            canvas.height = height * scaleFactor;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // 缩放图像
                ctx.scale(scaleFactor, scaleFactor);
                ctx.drawImage(img, 0, 0, width, height);

                const jpegUrl = canvas.toDataURL('image/jpeg', 0.8); // 最高质量

                // 创建下载链接
                const link = document.createElement('a');
                link.href = jpegUrl;
                link.download = `RMP-Designer_${new Date().valueOf()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const linePaths = [
        'M -1000 0 L 1000 0',
        'M 0 -1000 L 0 1000',
        'M -1000 -1000 L 1000 1000',
        'M 1000 -1000 L -1000 1000',
    ];

    const fields: RmgFieldsField[] = [
        {
            label: t('panel.common.label'),
            type: 'input',
            value: param.label,
            onChange: v => dispatch(setLabel(v)),
        },
        {
            label: t('header.export.showLines'),
            type: 'switch',
            isChecked: showLines,
            onChange: value => setShowLines(value),
        },
        {
            label: t('header.export.showBadges'),
            type: 'switch',
            isChecked: showBadges,
            onChange: value => setShowBadges(value),
        },
        {
            label: t('header.export.offsetX'),
            type: 'input',
            value: param.transform.translateX.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, translateX: Number(value) })),
        },
        {
            label: t('header.export.offsetY'),
            type: 'input',
            value: param.transform.translateY.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, translateY: Number(value) })),
        },
        {
            label: t('header.export.scale'),
            type: 'input',
            value: param.transform.scale.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, scale: Number(value) })),
        },
        {
            label: t('header.export.rotate'),
            type: 'input',
            value: param.transform.rotate.toString(),
            onChange: value => dispatch(setTransform({ ...param.transform, rotate: Number(value) })),
        },
    ];

    const handleExport = () => {
        setExportOpen(true);
        onClose();
    };

    React.useEffect(() => {
        if (isOpen) {
            setShowLines(false);
            setShowBadges(false);
        }
    }, [isOpen]);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Text as="b" fontSize="xl">
                            {t('header.export.preview')}
                            <Badge ml="1" colorScheme="green">
                                RMP
                            </Badge>
                        </Text>
                        <ModalCloseButton />
                    </ModalHeader>

                    <ModalBody>
                        <RmgFields fields={fields} />
                        <svg
                            id="rmp-style-gen-svg"
                            ref={svgRef}
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            colorInterpolationFilters="sRGB"
                            viewBox="-100 -100 200 200"
                            style={{
                                width: '100%',
                                height: '500',
                                userSelect: 'none',
                                touchAction: 'none',
                                backgroundColor: 'white',
                            }}
                            tabIndex={0}
                        >
                            {showLines &&
                                linePaths.map((linePath, i) => (
                                    <path
                                        key={i}
                                        d={linePath}
                                        fill="none"
                                        stroke="#C23A30"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                    />
                                ))}
                            {showBadges && (
                                <g>
                                    <g transform={`translate(-60, 70)`}>
                                        <rect fill="#E4002B" width="21" height="22.67" />
                                        <text
                                            className="rmp-name__zh"
                                            textAnchor="middle"
                                            x="10"
                                            y="19"
                                            fill="white"
                                            fontSize="21.33"
                                            letterSpacing="-1.75"
                                        >
                                            1
                                        </text>
                                        <text className="rmp-name__zh" x={21 + 2} y="12" fontSize="14.67">
                                            号线
                                        </text>
                                        <text className="rmp-name__en" x={21 + 4} y="21.5" fontSize="8">
                                            Line 1
                                        </text>
                                    </g>
                                    <g transform={`translate(8, 72.5)`}>
                                        <rect fill="#c23a30" x="0" width={11.84375 + 21} height="16" rx="2" />
                                        <text
                                            className="rmp-name__zh"
                                            textAnchor="middle"
                                            x={11.84375 / 2 + 2}
                                            y="13.5"
                                            fill="white"
                                            fontSize="15"
                                            letterSpacing="-1.5"
                                        >
                                            1
                                        </text>
                                        <text
                                            className="rmp-name__zh"
                                            x={11.84375 + 3}
                                            y="8.5"
                                            fontSize="7"
                                            fill="white"
                                        >
                                            号线
                                        </text>
                                        <text
                                            className="rmp-name__en"
                                            x={11.84375 + 4.5}
                                            y="13.5"
                                            fontSize="4"
                                            fill="white"
                                        >
                                            Line 1
                                        </text>
                                    </g>
                                </g>
                            )}
                            <g
                                transform={`translate(${param.transform.translateX}, ${param.transform.translateY}) scale(${param.transform.scale}) rotate(${param.transform.rotate})`}
                            >
                                {param.svgs.map(s => {
                                    const components = param.color
                                        ? [...param.components, param.color]
                                        : param.components;
                                    return (
                                        <CreateSvgs
                                            key={s.id}
                                            svgsElem={s}
                                            components={components}
                                            prefix={[s.id]}
                                            handlePointerDown={() => {}}
                                            handlePointerMove={() => {}}
                                            handlePointerUp={() => {}}
                                        />
                                    );
                                })}
                            </g>
                        </svg>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" variant="outline" mr="1" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button id="exportJPG" colorScheme="blue" variant="solid" mr="1" onClick={exportToJpg}>
                            {t('header.export.exportJPG')}
                        </Button>
                        <Button colorScheme="blue" variant="solid" mr="1" onClick={handleExport}>
                            {t('header.export.export')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Export isOpen={isExportOpen} onClose={() => setExportOpen(false)} param={param} />
        </>
    );
};
