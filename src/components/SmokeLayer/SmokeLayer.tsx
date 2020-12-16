import * as React from 'react';
import { loadModules } from 'esri-loader';

import IMapView from 'esri/views/MapView';
import IFeatureLayer from 'esri/layers/FeatureLayer';
import IMapImageLayer from 'esri/layers/MapImageLayer';
import ITimeExtent from "esri/TimeExtent";

interface Props {
    url: string;
    timeExtent?: number[];
    visible?: boolean;
    mapView?: IMapView;
}

const SmokeLayer:React.FC<Props> = ({
    url,
    timeExtent,
    visible,
    mapView
})=>{

    const [ smokeLayer, setSmokeLayer ] = React.useState<IMapImageLayer>();

    const init = async()=>{

        try {
            type Modules = [
                typeof IMapImageLayer,
                typeof IFeatureLayer,
                typeof ITimeExtent
            ]; 
    
            const [
                MapImageLayer,
                FeatureLayer,
                TimeExtent,
            ] = await (loadModules([
                'esri/layers/MapImageLayer',
                'esri/layers/FeatureLayer',
                'esri/TimeExtent'
            ]) as Promise<Modules>);

            // const timeExtent = new TimeExtent({
            //     start: new Date(1589616000000),
            //     end: new Date(1589619600000)
            // });

            // console.log(timeExtent)
    
            const smokeLayer = new MapImageLayer({
                url,
                visible,
                // timeExtent,
                useViewTime: false,
                opacity: 1,
                effect: "invert() blur(5px) drop-shadow(10px, 10px, 20px, black) opacity(0.5)"
            } as any);

            mapView.map.add(smokeLayer, 0);

            setSmokeLayer(smokeLayer);
        } catch(err){
            console.error(err);
        }

    };

    const updateTimeExtent = async()=>{

        type Modules = [
            typeof ITimeExtent
        ]; 

        const [
            TimeExtent,
        ] = await (loadModules([
            'esri/TimeExtent'
        ]) as Promise<Modules>);

        const [ startTime, endTime ] = timeExtent;

        smokeLayer.timeExtent = new TimeExtent({
            start: new Date(startTime),
            end: new Date(endTime)
        });

        smokeLayer.visible = visible;
    }

    React.useEffect(()=>{
        if(mapView){
            init();
        }
    }, [mapView]);

    React.useEffect(()=>{

        if(!smokeLayer){
            return;
        }

        if(timeExtent){
            updateTimeExtent();
        }

    }, [ visible, timeExtent ]);

    return null;
};

export default SmokeLayer;

