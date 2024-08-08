import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Heading } from '@chakra-ui/react';
import { RmgLineBadge } from '@railmapgen/rmg-components';
import { MonoColour } from '@railmapgen/rmg-palette-resources';
import { useTranslation } from 'react-i18next';
import { Marketplace, Metadata } from '../../constants/marketplace';
import useTranslatedName from '../../util/hook';

export const TemplateCard = (props: {
    id: number;
    metadata: Marketplace[number];
    handleDetails: (id: number, metadata: Metadata) => void;
}) => {
    const { id, metadata, handleDetails } = props;
    const translateName = useTranslatedName();
    const { t } = useTranslation();

    const updateSvgViewBox = (svgString: string, viewBox: string, widthAndHeight: number): string => {
        const style = `width: ${widthAndHeight}; height: ${widthAndHeight}; user-select: none; touch-action: none; background-color: white;`;
        return svgString
            .replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`)
            .replace(/style="[^"]*"/, `style="${style}"`);
    };

    return (
        <Card key={id} variant="elevated" minW="300" maxW="340" m="2">
            <CardBody>
                <div
                    dangerouslySetInnerHTML={{ __html: updateSvgViewBox(metadata.svgString, '-150 -150 300 300', 300) }}
                />
            </CardBody>
            <CardHeader>
                <Heading size="lg" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
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
            </CardHeader>
            <CardFooter>
                <Avatar size="md" />
                <Button variant="solid" colorScheme="blue" ml="auto" onClick={() => handleDetails(id, metadata)}>
                    {t('marketplace.details')}
                </Button>
            </CardFooter>
        </Card>
    );
};
