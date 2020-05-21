import * as React from 'react';
import { urlFns } from 'helper-toolkit-ts';
import MapView from './MapView';

import {
    WildfireLayer,
    SmokeLayer
} from '../';

import { MapConfig, UIConfig, SearchParamKeys } from '../../AppConfig';

import {
    CenterLoaction
} from './MapView';

const { WebmapId } = MapConfig;

const MapViewContainer: React.FC = ()=>{

    const saveMapCenterLocationInUrl = (location:CenterLoaction)=>{
        const { mapCenterLocation } = SearchParamKeys;
        const { lon, lat, zoom } = location;

        urlFns.updateQueryParam({
            key: mapCenterLocation,
            value: `${lon},${lat},${zoom}`
        });
    };

    const parseMapCenterLocationFromUrl = ()=>{
        const { mapCenterLocation } = SearchParamKeys;
        const searchParams = urlFns.parseQuery();

        const values: number[] = searchParams[mapCenterLocation]
            ? searchParams[mapCenterLocation]
                .split(',')
                .map((d:string)=>+d)
            : [];

        const [ lon, lat, zoom ] = values

        return {
            lon,
            lat,
            zoom
        }

    }

    return (
        <MapView
            webmapId={WebmapId}
            padding={{ right: UIConfig.SidebarWidth }}
            initialMapCenterLocation={parseMapCenterLocationFromUrl()}
            onStationary={saveMapCenterLocationInUrl}
        >
            <SmokeLayer />
            <WildfireLayer/>
        </MapView>
    )
};

export default MapViewContainer;