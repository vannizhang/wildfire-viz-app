import * as React from 'react';
import axios from 'axios';
import { add } from 'date-fns';
import { useSelector, useDispatch  } from 'react-redux';

import IMapView from 'esri/views/MapView';
import SmokeLayer from './SmokeLayer';
import { MapConfig } from '../../AppConfig';

import {
    smokeLayerVisibleSelector,
    smokeLayerFullTimeExtentSelector,
    smokeLayerCurrentTimeExtentSelector,
    // smokeLayerCurrentTimeExtentChanged,
    smokeLayerFullTimeExtentChanged,
    startSmokeLayerAnimation,
    stopSmokeLayerAnimation,
    isSmokeLayerAnimationSelector
} from  '../../store/reducers/map'

// import { urlFns } from 'helper-toolkit-ts';
// import { HashParamKey } from '../../types';

interface Props {
    mapView?: IMapView
}

interface LayerInfo {
    timeInfo: {
        timeExtent: number[],
        timeInterval: 1
    }
};

const LAYER_URL = MapConfig.SmokeLayerUrl;

const SmokeLayerContainer:React.FC<Props> = ({
    mapView
})=>{

    const dispatch = useDispatch()

    const isVisible = useSelector(smokeLayerVisibleSelector);

    const isAnimationOn = useSelector(isSmokeLayerAnimationSelector)

    const fullTimeExtent = useSelector(smokeLayerFullTimeExtentSelector);

    const currTimeExtent = useSelector(smokeLayerCurrentTimeExtentSelector);

    // const [ FullTimeExtent, setFullTimeExtent ] = React.useState<number[]>();
    
    // const [ activeTimeExtent, setActiveTimeExtent ]= React.useState<number[]>();

    // const animationIntervalRef = React.useRef<number>();

    // const startTimeRef = React.useRef<number>();

    // const TimerSpeed = 2000;

    const getLayerInfo = async()=>{

        try {
            const requestUrl = `${LAYER_URL}/0?f=json`
            const { data }: {data: LayerInfo} = await axios.get(requestUrl);

            if(data){
                const { timeInfo } = data;

                dispatch(smokeLayerFullTimeExtentChanged(timeInfo.timeExtent))
            }

        } catch(err){
            console.error(err);
        }
    };

    React.useEffect(()=>{
        getLayerInfo();

        return () => {
            dispatch(stopSmokeLayerAnimation());
        };
    }, []);

    React.useEffect(()=>{
        
        if(fullTimeExtent.length){
            dispatch(startSmokeLayerAnimation())
        }

    }, [fullTimeExtent]);

    // React.useEffect(()=>{
    //     console.log('activeTimeExtent', currTimeExtent)
    //     // dispatch(smokeLayerCurrentTimeExtentChanged(activeTimeExtent));
    // }, [currTimeExtent])

    return (
        <SmokeLayer 
            url={LAYER_URL}
            visible={isVisible}
            timeExtent={currTimeExtent.length ? currTimeExtent : null}
            mapView={mapView}
        />
    );
};

export default SmokeLayerContainer;

