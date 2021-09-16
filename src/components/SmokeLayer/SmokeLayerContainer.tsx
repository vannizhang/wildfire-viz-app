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
import { lastSyncTimeSelector } from '../../store/reducers/UI';

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

    const lastSyncTime = useSelector(lastSyncTimeSelector);

    const getLayerInfo = async()=>{

        try {
            const requestUrl = `${LAYER_URL}/0?f=json`
            const { data }: {data: LayerInfo} = await axios.get(requestUrl);

            if(data){
                const { timeInfo } = data;

                dispatch(loadSmokeLayerFullTimeExtent(timeInfo.timeExtent))

                console.log(`fetched smoke forecast layer info`)
            }

        } catch(err){
            console.error(err);
        }
    };

    React.useEffect(()=>{
        return () => {
            // clearInterval(intervalRef.current)
            dispatch(stopSmokeLayerAnimation());
        };
    }, []);

    React.useEffect(()=>{
        getLayerInfo();
    }, [lastSyncTime]);

    React.useEffect(()=>{
        
        if(fullTimeExtent.length && !isAnimationOn){
            dispatch(startSmokeLayerAnimation())
        }

    }, [fullTimeExtent]);

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

