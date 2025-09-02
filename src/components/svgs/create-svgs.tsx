import React from 'react';
import { Id, SvgsElem } from '../../constants/constants';
import { calcVariableFunction } from '../../util/parse';
import { Components } from '../../constants/components';
import { supportsChildren } from '../../util/svgTagWithChildren';
import { addGlobalAlert } from '../../redux/runtime/runtime-slice';
import { useRootDispatch, useRootSelector } from '../../redux';
import { VariableFunction } from '../../constants/variable-function';

export interface CreateSvgsProps {
    svgsElem: SvgsElem;
    components: Components[];
    prefix: Id[];
    handlePointerDown: (id: Id, path: Id[], e: React.PointerEvent<SVGElement>) => void;
    handlePointerMove: (id: Id, path: Id[], e: React.PointerEvent<SVGElement>) => void;
    handlePointerUp: (id: Id, path: Id[], e: React.PointerEvent<SVGElement>) => void;
}

export const CreateSvgs = (props: CreateSvgsProps) => {
    const { svgsElem, components, prefix, handlePointerUp, handlePointerMove, handlePointerDown } = props;
    const { id, type, attrs } = svgsElem;
    const dispatch = useRootDispatch();
    const { globalAlerts, selected } = useRootSelector(state => state.runtime);
    const { color } = useRootSelector(state => state.param);

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerDown(id, [...prefix, id], e),
        [id, handlePointerDown]
    );
    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerMove(id, [...prefix, id], e),
        [id, handlePointerMove]
    );
    const onPointerUp = React.useCallback(
        (e: React.PointerEvent<SVGElement>) => handlePointerUp(id, [...prefix, id], e),
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
        svgAttrs: Record<string, VariableFunction>,
        varIds: string[],
        varValues: string[]
    ): Record<string, string> => {
        const modifiedAttrs: Partial<Record<string, string>> = {};
        if (error || hasGlobalAlert) return modifiedAttrs as Record<string, string>;

        for (const key in svgAttrs) {
            if (Object.prototype.hasOwnProperty.call(svgAttrs, key)) {
                try {
                    modifiedAttrs[key] = calcVariableFunction(svgAttrs[key], varIds, varValues);
                } catch (e) {
                    if (e instanceof Error) {
                        setError(e.message);
                    }
                }
            }
        }

        return modifiedAttrs as Record<string, string>;
    };

    const colorVarLabel = color ? ['color[2]', 'color[3]'] : [];
    const colorVarValue = color
        ? color.value
            ? [color.value[2], color.value[3]]
            : [color.defaultValue[2], color.defaultValue[3]]
        : [];

    const newAttrs = modifyAttributes(
        attrs,
        [...components.map(s => s.label), ...colorVarLabel],
        [...components.map(s => (s.value ? s.value : s.defaultValue)), ...colorVarValue]
    );

    const Children =
        supportsChildren(type) && svgsElem.children
            ? svgsElem.children.map((s, i) => (
                  <CreateSvgs
                      key={i}
                      svgsElem={s}
                      components={components}
                      prefix={[...prefix, id]}
                      handlePointerDown={handlePointerDown}
                      handlePointerMove={handlePointerMove}
                      handlePointerUp={handlePointerUp}
                  />
              ))
            : '_rmp_children_text' in newAttrs
              ? [newAttrs._rmp_children_text]
              : [];

    function parseStyleString(styleStr: string): Record<string, string> {
        const styleObj: Record<string, string> = {};

        styleStr.split(';').forEach(item => {
            const [key, value] = item.split(':').map(s => s.trim());
            if (key && value) {
                styleObj[key] = value;
            }
        });

        return { ...styleObj, cursor: 'move' };
    }
    const newStyle = 'style' in newAttrs ? parseStyleString(newAttrs.style) : { cursor: 'move' };
    return (
        <g
            id={`g_${id}`}
            key={`g_${id}`}
            transform={`translate(${newAttrs.x ?? 0}, ${newAttrs.y ?? 0})`}
            opacity={!selected.has(id) && selected.size !== 0 ? 0.5 : 1}
        >
            {React.createElement(
                type,
                {
                    ...newAttrs,
                    id: id,
                    key: id,
                    x: 0,
                    y: 0,
                    onPointerDown,
                    onPointerMove,
                    onPointerUp,
                    style: newStyle,
                },
                ...Children
            )}
        </g>
    );
};
