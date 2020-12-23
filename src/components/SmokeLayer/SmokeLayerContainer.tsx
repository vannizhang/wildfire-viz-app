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

import { urlFns } from 'helper-toolkit-ts';
import { HashParamKey } from '../../types';

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

    // const [ FullTimeExtent, setFullTimeExtent ] = React.useState<number[]>();
    
    const [ activeTimeExtent, setActiveTimeExtent ]= React.useState<number[]>();

    const fullTimeExtentRef = React.useRef<number[]>([]);

    const animationIntervalRef = React.useRef<number>();

    const startTimeRef = React.useRef<number>();

    const TimerSpeed = 2000;

    const getLayerInfo = async()=>{

        try {
            const requestUrl = `${url}/0?f=json`
            const { data }: {data: LayerInfo} = await axios.get(requestUrl);

            if(data){
                const { timeInfo } = data;
                // setFullTimeExtent(timeInfo.timeExtent);

                fullTimeExtentRef.current = timeInfo.timeExtent
            }

        } catch(err){
            console.error(err);
        }

    };

    React.useEffect(()=>{
        getLayerInfo();

        return () => {
            clearInterval(animationIntervalRef.current);
        };

    }, []);

    React.useEffect(()=>{
        
        if(isVisible){

            animationIntervalRef.current = setInterval(() => {

                const [ LayerTimeExtentStart, LayerTimeExtentEnd ] = fullTimeExtentRef.current;
                // const [ startTime, endTime ] = activeTimeExtent || [ undefined, undefined ];

                startTimeRef.current = startTimeRef.current 
                    ? add(new Date(startTimeRef.current ), { hours: 1 }).getTime() 
                    : LayerTimeExtentStart;
                        
                if(startTimeRef.current > LayerTimeExtentEnd){
                    startTimeRef.current = LayerTimeExtentStart;
                };

                const newEndTime = add(new Date(startTimeRef.current), { hours: 1 }).getTime();

                setActiveTimeExtent([startTimeRef.current, newEndTime]);

            }, TimerSpeed)

      
        } else {
            clearInterval(animationIntervalRef.current);

            setActiveTimeExtent(null);

            startTimeRef.current = null;
        }


        const key:HashParamKey = 'smokeForecast'

        urlFns.updateHashParam({
            key,
            value: isVisible ? '1' : '0'
        });

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

