import * as React from 'react';
import { useDispatch, useSelector  } from 'react-redux';
import { format, differenceInDays } from 'date-fns';

import {
    visibleFeaturesSelector,
    WildfireFeature, 
    updateWildfireFeature2FlyTo,
    updateWildfireFeature2OpenPopup
} from '../../store/reducers/wildfires';

import {
    listModeSelector,
    searchTermSelector
} from '../../store/reducers/UI';

import {
    GridList
} from '..';

import { TimelineDataItem, TimeLine } from '../Timeline/Timeline';

const ListViewContainer:React.FC = ()=>{

    const dispatch = useDispatch();

    const visibleFeatures = useSelector(visibleFeaturesSelector);

    const activeListMode = useSelector(listModeSelector);

    const searchTerm = useSelector(searchTermSelector);

    const onClickHandler = (feature:WildfireFeature)=>{
        dispatch(updateWildfireFeature2FlyTo(feature))
    };

    const onHoverHandler = (feature?:WildfireFeature)=>{
        dispatch(updateWildfireFeature2OpenPopup(feature))
    };

    const getTimelineData = (): TimelineDataItem[]=>{

        if(!visibleFeatures.length){
            return [];
        }

        const currDate = new Date();

        const distinctLabel: { [key:string]: boolean } = {};

        const features = getFeatures()
            .filter(feature=>{
                // only include fires within 180 days
                return feature && differenceInDays(currDate, new Date(feature.attributes.FireDiscoveryDateTime)) <= 180;
            })
            .sort((a ,b)=>{
                return b.attributes.FireDiscoveryDateTime - a.attributes.FireDiscoveryDateTime;
            });

        const timelineData: TimelineDataItem[] = features.map(feature=>{

            const discoveryDate = new Date(feature.attributes.FireDiscoveryDateTime);

            const formattedDay = format(discoveryDate, 'MMM do');

            const formattedMonth =  format(discoveryDate, 'MMMM');

            // the formatted day and month should only be shown for once in the timeline
            const dayLabel = !distinctLabel[formattedDay] ? formattedDay : '';
            distinctLabel[formattedDay] = true;

            const monthLabel = !distinctLabel[formattedMonth] ? formattedMonth : '';
            distinctLabel[formattedMonth] = true;

            const data = {
                feature,
                dayLabel,
                monthLabel,
            };

            return data;
        });

        // console.log(timelineData);

        return timelineData;

    };

    const getGridData = ()=>{

        const features = getFeatures();

        return features.sort((a ,b)=>{
            return b.attributes.DailyAcres - a.attributes.DailyAcres;
        });
    }

    const getFeatures = ()=>{
        const features = !searchTerm || searchTerm.length < 3
            ? [...visibleFeatures] 
            : [...visibleFeatures].filter(d=>{
                const fireName = d.attributes.IncidentName.toLowerCase();
                const matchString = searchTerm.toLowerCase();
                return fireName.indexOf(matchString) > -1
            });
        
        return features;
    }

    const getList = ()=>{

        if(!visibleFeatures.length){
            // return (
            //     <div className='text-center leader-1'>
            //         <p>No wildfire in view</p>
            //     </div>
            // )
            return null;
        }

        return activeListMode === 'timeline' 
            ? <TimeLine 
                data={getTimelineData()}
                onClick={onClickHandler}
                onHoverHandler={onHoverHandler}

            />
            : <GridList 
                data={getGridData()}
                onClick={onClickHandler}
                onHoverHandler={onHoverHandler}
            />;
    };

    return getList();
};

export default ListViewContainer;