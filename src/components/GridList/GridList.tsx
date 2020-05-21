import * as React from 'react';
import styled from 'styled-components';

import { WildfireFeature } from '../../store/reducers/wildfires';

import {
    FireflyIcon
} from '../';

import { UIConfig } from '../../AppConfig';

export interface Props {
    data: WildfireFeature[];
    onClick: (feature:WildfireFeature)=>void;
    onHoverHandler: (feature?:WildfireFeature)=>void;
};

interface PctIndicatorProps {
    widthPercent: number;
}

const GridDiv = styled.div`
    cursor: pointer;
    border: 1px solid transparent;

    &:hover {
        border: 1px solid ${UIConfig.ThemeColorBrightPurpleOpaque};
    }
`;

const PctIndicatorBase = styled.div`
    position: relative;
    width: 100%;
    background: ${UIConfig.ThemeColorYellow};
`;

const PctIndicator = styled.div`
    position: relative;
    width: ${(props:PctIndicatorProps)=> props.widthPercent + '%' };
    height: 1px;
    background: ${UIConfig.ThemeColorBrightPurpleOpaque};
`;

const GridList:React.FC<Props> = ({
    data,
    onClick,
    onHoverHandler
})=>{

    const getElements = ()=>{
        if(!data || !data.length){
            return null;
        }

        const blocks = data
        .filter(d=>d)
        .map(d=>{
            const {
                classBreak,
                attributes
            } = d;

            const { 
                // IncidentName, 
                PercentContained, 
                UniqueFireIdentifier 
            } = attributes;

            return (
                <GridDiv 
                    key={`grid-block-${UniqueFireIdentifier}`}
                    className='block trailer-half'
                    onClick={onClick.bind(this, d)}
                    onMouseEnter={onHoverHandler.bind(this, d)}
                    onMouseLeave={onHoverHandler.bind(this, null)}
                >
                    <FireflyIcon size={classBreak} />

                    <PctIndicatorBase>
                        <PctIndicator 
                            widthPercent={PercentContained}
                        />
                    </PctIndicatorBase>
                </GridDiv>
            )
        });

        return (
            <div className='block-group block-group-6-up'>
                { blocks }
            </div>
        )
    }

    return (
        <>
            { getElements() }
        </>
    );
};

export default GridList;