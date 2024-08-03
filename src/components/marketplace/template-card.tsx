import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Heading } from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';

import { Marketplace, Metadata } from '../../constants/marketplace';
import useTranslatedName from '../../util/hook';

export const TemplateCard = (props: {
    id: string;
    metadata: Marketplace[string];
    handleDetails: (id: string, metadata: Metadata) => void;
}) => {
    const { id, metadata, handleDetails } = props;
    const translateName = useTranslatedName();
    const { t } = useTranslation();

    return (
        <Card key={id} variant="elevated" minW="300" maxW="340" m="2">
            <CardBody>
                {/* Using native img due to: https://bugzilla.mozilla.org/show_bug.cgi?id=1647077 */}
                <img width="300" height="300" loading="lazy" src={`resources/images/${id}.jpg`} alt={id} />
            </CardBody>
            <CardHeader>
                <Heading size="lg" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                    {translateName(metadata.name)}
                </Heading>
            </CardHeader>
            <CardFooter>
                <Avatar src={`https://avatars.githubusercontent.com/u/${metadata.contributor}?s=48`} />
                <Button variant="solid" colorScheme="blue" ml="auto" onClick={() => handleDetails(id, metadata)}>
                    {t('marketplace.details')}
                </Button>
            </CardFooter>
        </Card>
    );
};
