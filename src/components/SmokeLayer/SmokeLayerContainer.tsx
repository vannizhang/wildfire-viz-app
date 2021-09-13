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
    loadSmokeLayerFullTimeExtent,
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

    const dispatch = useDispatch();

    const isVisible = useSelector(smokeLayerVisibleSelector);

    const isAnimationOn = useSelector(isSmokeLayerAnimationSelector)

    const fullTimeExtent = useSelector(smokeLayerFullTimeExtentSelector);

    const currTimeExtent = useSelector(smokeLayerCurrentTimeExtentSelector);

    const [timeModified4FullTimeExtent, setTimeModified4FullTimeExtent] = React.useState(Date.now());

    const intervalRef = React.useRef<number>()

    const getLayerInfo = async()=>{

        try {
            const requestUrl = `${LAYER_URL}/0?f=json`
            const { data }: {data: LayerInfo} = await axios.get(requestUrl);

            if(data){
                const { timeInfo } = data;

                dispatch(loadSmokeLayerFullTimeExtent(timeInfo.timeExtent))
            }

        } catch(err){
            console.error(err);
        }
    };

    React.useEffect(()=>{
        // getLayerInfo();

        intervalRef.current = setInterval(() => setTimeModified4FullTimeExtent(Date.now()), 1000 * 60 * 60);

        return () => {
            clearInterval(intervalRef.current)
            dispatch(stopSmokeLayerAnimation());
        };
    }, []);

    React.useEffect(()=>{
        if(timeModified4FullTimeExtent){
            getLayerInfo();
        }
    }, [timeModified4FullTimeExtent]);

    React.useEffect(()=>{
        
        if(fullTimeExtent.length && !isAnimationOn){
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

