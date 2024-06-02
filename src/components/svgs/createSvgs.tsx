import React from 'react';
import { Id, SvgsElem } from '../../constants/constants';
import { calcFunc } from '../../util/parse';
import { Components } from '../../constants/components';
import { supportsChildren } from '../../util/svgTagWithChildren';
import { addGlobalAlert } from '../../redux/runtime/runtime-slice';
import { useRootDispatch, useRootSelector } from '../../redux';

export interface CreateSvgsProps {
    svgsElem: SvgsElem;
    components: Components[];
    handlePointerDown: (id: Id, e: React.PointerEvent<SVGElement>) => void;
    handlePointerMove: (id: Id, e: React.PointerEvent<SVGElement>) => void;
    handlePointerUp: (id: Id, e: React.PointerEvent<SVGElement>) => void;
}

export const CreateSvgs = (props: CreateSvgsProps) => {
    const { svgsElem, components, handlePointerUp, handlePointerMove, handlePointerDown } = props;
    const { id, type, attrs } = svgsElem;
    const dispatch = useRootDispatch();
    const { globalAlerts } = useRootSelector(state => state.runtime);

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerDown(id, e),
        [id, handlePointerDown]
    );
    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerMove(id, e),
        [id, handlePointerMove]
    );
    const onPointerUp = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerUp(id, e),
        [id, handlePointerUp]
    );
    const hasGlobalAlert = globalAlerts.has(id);

    const [error, setError] = React.useState<string | undefined>(undefined);
    React.useEffect(() => {
        if (!hasGlobalAlert && error) {
            dispatch(addGlobalAlert({ id: id, str: error }));
            setError(undefined);
        }
    }, [error]);

    const modifyAttributes = (
        svgAttrs: Record<string, string>,
        varIds: string[],
        varValues: string[],
        varType: string[]
    ): Record<string, string> => {
        const modifiedAttrs: Partial<Record<string, string>> = {};
        if (error || hasGlobalAlert) return modifiedAttrs as Record<string, string>;

        for (const key in svgAttrs) {
            if (Object.prototype.hasOwnProperty.call(svgAttrs, key)) {
                try {
                    modifiedAttrs[key] = calcFunc(
                        svgAttrs[key],
                        ...varIds
                    )(
                        ...varValues.map((v, varI) =>
                            varType[varI] === 'number' && !Number.isNaN(Number(v)) ? Number(v) : v
                        )
                    );
                } catch (e) {
                    if (e instanceof Error) {
                        setError(e.message);
                    }
                }
            }
        }

        return modifiedAttrs as Record<string, string>;
    };

    const newAttrs = modifyAttributes(
        attrs,
        components.map(s => s.label),
        components.map(s => (s.value ? s.value : s.defaultValue)),
        components.map(s => s.type)
    );
    const Children =
        supportsChildren(type) && svgsElem.children
            ? svgsElem.children.map(s => (
                  <CreateSvgs
                      key={s.id}
                      svgsElem={s}
                      components={components}
                      handlePointerDown={() => {}}
                      handlePointerMove={() => {}}
                      handlePointerUp={() => {}}
                  />
              ))
            : '_rmp_children_text' in newAttrs
              ? [newAttrs._rmp_children_text]
              : [];
    if ('style' in newAttrs && typeof newAttrs.style !== 'object') {
        setError('"style" must be an object!');
    }
    const newStyle =
        'style' in newAttrs && typeof newAttrs.style === 'object'
            ? { ...(newAttrs.style as object), cursor: 'move' }
            : { cursor: 'move' };
    return React.createElement(
        type,
        {
            ...newAttrs,
            id: id,
            key: id,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            style: newStyle,
        },
        ...Children
    );
};
