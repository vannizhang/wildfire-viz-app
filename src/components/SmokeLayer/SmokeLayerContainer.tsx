import * as React from 'react';
import axios from 'axios';
import { add } from 'date-fns';
import { useSelector, useDispatch  } from 'react-redux';

import IMapView from 'esri/views/MapView';
import SmokeLayer from './SmokeLayer';
import { MapConfig } from '../../AppConfig';

import {
    smokeLayerVisibleSelector,
    smokeLayerCurrentTimeExtentChanged
} from  '../../store/reducers/map'

interface Props {
    mapView?: IMapView
}

interface LayerInfo {
    timeInfo: {
        timeExtent: number[],
        timeInterval: 1
    }
};

const SmokeLayerContainer:React.FC<Props> = ({
    mapView
})=>{

    const url = MapConfig.SmokeLayerUrl;

    const isVisible = useSelector(smokeLayerVisibleSelector);

    const dispatch = useDispatch()

    const [ FullTimeExtent, setFullTimeExtent ] = React.useState<number[]>();

    const [ activeTimeExtent, setActiveTimeExtent ]= React.useState<number[]>();

    const [ timer, setTimer] = React.useState<number>();

    const TimerSpeed = 2000;

    const getLayerInfo = async()=>{
        const requestUrl = `${url}/0?f=json`
        const { data }: {data: LayerInfo} = await axios.get(requestUrl);
        const { timeInfo } = data;
        
        setFullTimeExtent(timeInfo.timeExtent);
    };

    React.useEffect(()=>{
        getLayerInfo();

        return () => {
            clearInterval(timer);
        };

    }, []);

    React.useEffect(()=>{
        if(isVisible){

            const timer = setInterval(() => {

                setActiveTimeExtent(activeTimeExtent => {
                    const [ LayerTimeExtentStart, LayerTimeExtentEnd ] = FullTimeExtent;
                    const [ startTime, endTime ] = activeTimeExtent || [ undefined, undefined ];

                    let newStartTime = startTime ? add(new Date(startTime), { hours: 1 }).getTime() : LayerTimeExtentStart;
                            
                    if(newStartTime > LayerTimeExtentEnd){
                        newStartTime = LayerTimeExtentStart;
                    };

                    const newEndTime = add(new Date(newStartTime), { hours: 1 }).getTime();

                    return [
                        newStartTime,
                        newEndTime
                    ];
                });

            }, TimerSpeed)

            setTimer(timer);
      
        } else {
            clearInterval(timer);
        }

    }, [isVisible]);

    React.useEffect(()=>{
        // console.log('activeTimeExtent', activeTimeExtent)
        dispatch(smokeLayerCurrentTimeExtentChanged(activeTimeExtent));
    }, [activeTimeExtent])

    return (
        <SmokeLayer 
            url={url}
            visible={isVisible}
            timeExtent={activeTimeExtent}
            mapView={mapView}
        />
    );
};

export default SmokeLayerContainer;

