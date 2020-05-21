import * as React from 'react';
import styled from 'styled-components';
import { stringFns } from 'helper-toolkit-ts';

import { WildfireFeature } from '../../store/reducers/wildfires';
import { UIConfig } from '../../AppConfig';

import {
    FireflyIcon
} from '..';

export interface TimelineDataItem {
    feature: WildfireFeature;
    dayLabel?: string;
    monthLabel?: string;
};

interface Props {
    data: TimelineDataItem[];
    onClick: (feature:WildfireFeature)=>void;
    onHoverHandler: (feature?:WildfireFeature)=>void;
}

const TimelineWrap = styled.div`
    display:flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-content: stretch;
    align-items: stretch;
`;

const DayLabel = styled.div`
    position: relative;
    width: 75px;
    height: 50px;
    line-height: 50px;

    &.show-ticker::after {
        content: ' ';
        display: inline-block;
        position: absolute;
        top: 50%;
        margin-top: -1px;
        right: -15px;
        width: 15px;
        height: 1px;
        background-color: ${UIConfig.ThemeColorBrightPurple};
    }
`;

const FireInfo = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;

    padding: .5rem 0;
    flex-grow: 1;
    flex-shrink: 0;
    border-left: solid 1px ${UIConfig.ThemeColorBrightPurple};
    cursor: pointer;
    text-align: right;
    font-size: 0.8125rem;
    line-height: 1.5;
`;

const MonthTitle = styled.div`
    background-color: ${UIConfig.ThemeColorBrightPurple};
    padding: .3rem;
    text-align: center;
`;

const Timeline:React.FC<Props> = ({
    data,
    onClick,
    onHoverHandler
})=>{

    const getElements = () =>{

        if(!data.length){
            return null;
        }

        return data.map(d=>{

            const { 
                dayLabel, 
                monthLabel, 
                feature 
            } = d;

            const {
                classBreak,
                attributes
            } = feature;

            const { 
                IncidentName, 
                PercentContained, 
                // OBJECTID,
                UniqueFireIdentifier
            } = attributes;

            const monthHeader = monthLabel ? (
                <MonthTitle>
                    <span className='avenir-bold'>{monthLabel}</span>
                </MonthTitle>
            ) : null;

            const fireNameFormatted = stringFns.capitalizeFirstLetter(IncidentName);

            const pctContainedFormatted  = `${PercentContained.toFixed(0)}% contained`;

            const TimelineItem = (
                <TimelineWrap>

                    <DayLabel className={dayLabel ? 'show-ticker' : ''}>
                        { dayLabel ? <span className='font-size--2'>{dayLabel}</span> : null }
                    </DayLabel>

                    <FireInfo
                        onClick={onClick.bind(this, feature)}
                        onMouseEnter={onHoverHandler.bind(this, feature)}
                        onMouseLeave={onHoverHandler.bind(this, null)}
                    >

                        <div className='margin-right-half'>
                            <strong>{fireNameFormatted} Fire</strong>  
                            <br/> 
                            <span>{pctContainedFormatted}</span>
                        </div>

                        <FireflyIcon size={classBreak} />
                    </FireInfo>

                </TimelineWrap>
            )

            return (
                <div key={`timeline-${UniqueFireIdentifier}`}>
                    { monthHeader }
                    { TimelineItem }
                </div>
            );
        })
    }

    return (
        <div>
            { getElements() }
        </div>
    );
};

export default Timeline;