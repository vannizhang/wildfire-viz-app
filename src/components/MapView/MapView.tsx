import * as React from 'react';
import { loadModules, loadCss } from 'esri-loader';

import IMapView from 'esri/views/MapView';
import IWebMap from "esri/WebMap";
import IwatchUtils from 'esri/core/watchUtils';
import IFeatureLayer from 'esri/layers/FeatureLayer'

loadCss();

export interface CenterLoaction {
    lat: number;
    lon: number;
    zoom: number;
}

interface Props {
    webmapId: string;
    padding?: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    };
    initialMapCenterLocation?: CenterLoaction;
    children?: React.ReactNode;
    onStationary: (data:CenterLoaction)=>void;
};

const MapView:React.FC<Props> = ({
    webmapId,
    padding,
    initialMapCenterLocation,
    children,
    onStationary
})=>{

    const mapDivRef = React.useRef<HTMLDivElement>();

    const [ mapView, setMapView] = React.useState<IMapView>(null);

    const initMapView = async()=>{
        
        type Modules = [typeof IMapView, typeof IWebMap];

        try {
            const [ 
                MapView, 
                WebMap 
            ] = await (loadModules([
                'esri/views/MapView',
                'esri/WebMap',
            ]) as Promise<Modules>);

            const { lat, lon, zoom } = initialMapCenterLocation || {};

            const center = lon && lat  ? [ lon, lat ] : undefined;

            const view = new MapView({
                container: mapDivRef.current,
                map: new WebMap({
                    portalItem: {
                        id: webmapId
                    }
                }),
                padding,
                center,
                zoom,
                highlightOptions: {
                    haloOpacity: 0,
                    fillOpacity: 0
                }
            });

            view.when(()=>{
                setMapView(view);
            });

        } catch(err){   
            console.error(err);
        }
    };

    const addWatchEvent = async()=>{
        type Modules = [typeof IwatchUtils];

        try {
            const [ 
                watchUtils 
            ] = await (loadModules([
                'esri/core/watchUtils'
            ]) as Promise<Modules>);

            watchUtils.whenTrue(mapView, 'stationary', ()=>{
                // console.log('mapview is stationary', mapView.center, mapView.zoom);

                if(mapView.zoom === -1){
                    return;
                }

                const centerLocation = {
                    lat: mapView.center && mapView.center.latitude 
                        ? +mapView.center.latitude.toFixed(3) 
                        : 0,
                    lon: mapView.center && mapView.center.longitude 
                        ? +mapView.center.longitude.toFixed(3) 
                        : 0,
                    zoom: mapView.zoom
                }

                onStationary(centerLocation);
            });

        } catch(err){   
            console.error(err);
        }
    };

    const addDefExpToVIIRSLayers = ()=>{
        const VIIRSLayers = mapView.map.allLayers
            .filter(d=>d.title.includes('VIIRS'));
        
        VIIRSLayers.forEach((layer:IFeatureLayer)=>{
            layer.definitionExpression = `esritimeutc >=  CURRENT_TIMESTAMP - INTERVAL '48' HOUR`
        });
    }

    React.useEffect(()=>{
        initMapView();
    }, []);

    React.useEffect(()=>{
        if(mapView){
            addWatchEvent();
            addDefExpToVIIRSLayers();
        }
    }, [ mapView ]);

    return (
        <>
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    margin: 0,
                    padding: 0,
                    width: '100%',
                    height: '100%',
                }}
                ref={mapDivRef}
            ></div>
            { 
                React.Children.map(children, (child)=>{
                    return React.cloneElement(child as React.ReactElement<any>, {
                        mapView,
                    });
                }) 
            }
        </>
    );
};

export default MapView;