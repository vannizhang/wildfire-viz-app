import React from 'react';
import {loadModules} from 'esri-loader';

import InfoWindow from '../InfoWindow';
import FireflySymbols from './FireflySymbolsLookup';
import CustomDynamicLayer from './CustomDynamicLayer';
import config from '../../core/config';
import { urlFns } from 'helper-toolkit-ts';

const CONTAINER_ID = 'mapViewDiv';
const WEB_MAP_ID = 'ba6c28836375471d8d6233d521f5ef26';
// const LAYER_ID_ACTIVE_FIRES = 'activeFires';

class Map extends React.PureComponent {

    constructor(props){
        super(props);

        // console.log('props of Map Component', props);

        this.state = {
            infoWindowPostion: {
                x: 0,
                y: 0
            }
        }

        this.mapView = null;
        this.activeFiresLayer = null;
        this.smokeForecastLayer = null;

        // this.state = {
        //     isSmokeLayerVisible: false
        // }
    };

    initMap(){

        loadModules([
            "esri/views/MapView",
            "esri/WebMap"
        ]).then(([
            MapView, WebMap,
        ])=>{

            const initMapExt = this.parsePredefineExtent();

            this.mapView = new MapView({
                map: new WebMap({
                    portalItem: { 
                        id: WEB_MAP_ID
                    }
                }),
                extent: initMapExt,
                container: CONTAINER_ID,
                padding: {
                    right: this.props.rightPadding || 0
                }
            });

            this.initLayers();

            this.mapView.when(()=>{
                this.mapViewOnReadyHandler();
                this.initWatchUtils();
            }).catch((err)=>{
                console.error(err)
            });

        }).catch(err=>{
            console.error(err);
        })
    };

    parsePredefineExtent(){
        const searchParams = urlFns.parseQuery();
        const data = searchParams.ext ? searchParams.ext.split(',') : null;

        if(!data || data.length !== 4){
            return undefined;
        }

        return {
            xmin: +data[0],
            ymin: +data[1],
            xmax: +data[2],
            ymax: +data[3],
            spatialReference: { latestWkid: 3857, wkid: 102100 }
        };
    }

    initLayers(){

        loadModules([
            "esri/layers/GraphicsLayer"
        ]).then(([
            GraphicsLayer
        ])=>{

            this.activeFiresLayer = new GraphicsLayer();

            this.mapView.map.addMany([this.activeFiresLayer]);

        }).catch(err=>{
            console.error(err);
        })
    }

    mapViewOnReadyHandler(){
        // console.log('mapview is ready...');
        this.showFires();

        this.initSmokeForecastLayer();

        this.mapView.on('click', async(evt)=>{
            // console.log('map on click', evt);
            const queryExtent = await this.getQueryExtent(evt.x, evt.y);
            // console.log('queryExtent', queryExtent.toJSON());
            this.props.onClick(queryExtent.toJSON());
        });

        // this.addCustomMapServiceLayer();
    };

    async initSmokeForecastLayer(){

        const time = this.props.smokeForecastTime.toString();

        this.smokeForecastLayer = await new CustomDynamicLayer({
            layerParams: {
                id: 'smokeForecastLayer',
                opacity: .7,
                visible: this.props.isSmokeForecastLayerVisible,
                cssFilter: "invert(100%) blur(5px) saturate(.4)"
            },
            mapUrl: config.smoke_layer.url + '/export',
            mapParameters: {
                layers: '0',
                time
            }
        });

        this.mapView.map.add(this.smokeForecastLayer, 0);

    };

    initWatchUtils(){

        loadModules([
            "esri/core/watchUtils"
        ]).then(([
            watchUtils
        ])=>{
            const view = this.mapView;
            
            watchUtils.whenTrue(view, "stationary", ()=>{

                if(view.extent && this.props.onExtentChange) {
                    // console.log('new map ext', view.extent.toJSON());
                    this.props.onExtentChange({
                        extent: view.extent.toJSON(),
                        zoom: view.zoom
                    });
                }
            });

            watchUtils.watch(view, "center", (evt)=>{
                // console.log('view center is on updating', evt);
                this.updateInfoWindowPosition();
            });

        }).catch(err=>{
            console.error(err);
        })
    }

    showFires(){
        
        loadModules([
            "esri/Graphic"
        ]).then(([
            Graphic,
        ])=>{

            this.props.activeFires.forEach(feature=>{

                const activeFireFeature = {
                    geometry: {
                        type: 'point',
                        longitude: feature.attributes.LONGITUDE,
                        latitude: feature.attributes.LATITUDE
                    },
                    attributes: feature.attributes,
                };

                const graphicForActiveFire = new Graphic({
                    ...activeFireFeature,
                    symbol: FireflySymbols['default'][feature.classBreak]
                });

                const graphicForBackground = new Graphic({
                    ...activeFireFeature,
                    symbol: FireflySymbols['background'][feature.classBreak]
                });

                this.activeFiresLayer.addMany([graphicForBackground, graphicForActiveFire]);

                this.mapView.map.reorder(this.activeFiresLayer, this.mapView.map.layers.length);
            });

        }).catch(err=>{
            console.error(err);
        });

        // console.log('show active fires on map...', this.props.activeFires);
    };

    filterActiveFires(){
        // console.log(this.props);

        this.activeFiresLayer.graphics.forEach(graphic=>{

            // if props.selectFireName is empty, show the feature
            // otherwise, only show feature when it's name matches the props.selectFireName
            const isMatchSelectName = !this.props.selectedFireName || this.props.selectedFireName === graphic.attributes.FIRE_NAME ? true : false;

            const isVisible = isMatchSelectName;

            graphic.visible = isVisible;
            
        });

    };

    zoomToFire(){
        // console.log('zoom to', this.props.activeFireToZoom);

        loadModules([
            "esri/geometry/Point"
        ]).then(([
            Point
        ])=>{
            const activeFireGeometry = new Point({
                x: this.props.activeFireToZoom.geometry.x,
                y: this.props.activeFireToZoom.geometry.y,
                spatialReference: {
                    "latestWkid": 3857,
                    "wkid": 102100
                }
            });
    
            this.mapView.goTo({
                target: activeFireGeometry,
                zoom: 12
            });

        }).catch(err=>{
            console.error(err);
        });


    };

    setTimeForSmokeForecastLayer(){
        if(this.smokeForecastLayer.visible){

            const startTime = new Date(this.props.smokeForecastTime);

            const endTime = startTime.setHours(startTime.getHours() + 1);

            const time = [
                this.props.smokeForecastTime.toString(),
                endTime.toString()
            ];

            this.smokeForecastLayer.mapParameters.time = time.join(',');
            this.smokeForecastLayer.refresh();
        }
    };

    componentDidMount(){
        this.initMap();
    };

    componentDidUpdate(prevProps){
        // console.log(prevProps, this.props);
        
        if(prevProps.selectedFireName !== this.props.selectedFireName){
            this.filterActiveFires();
        }

        if(prevProps.infoWindowData !== this.props.infoWindowData){
            this.updateInfoWindowPosition();
        }

        if(prevProps.activeFireToZoom !== this.props.activeFireToZoom){
            this.zoomToFire();
        }

        if(prevProps.isSmokeForecastLayerVisible !== this.props.isSmokeForecastLayerVisible){
            if(this.smokeForecastLayer){
                this.smokeForecastLayer.visible = this.props.isSmokeForecastLayerVisible;
            }
            
        }

        if(prevProps.smokeForecastTime !== this.props.smokeForecastTime){
            if(this.smokeForecastLayer){
                this.setTimeForSmokeForecastLayer();
            }
        }
    }

    componentDidCatch(error, info) {
        console.error(error, info);
    }

    updateInfoWindowPosition(){
        let x = 0;
        let y = 0;

        if(this.props.infoWindowData){
            // console.log(this.props.infoWindowData.geometry);

            const point = {
                x: this.props.infoWindowData.geometry.x,
                y: this.props.infoWindowData.geometry.y,
                spatialReference: {
                    wkid: 102100
                }
            }

            const screenPoint = this.mapView.toScreen(point);
            // console.log(screenPoint);

            x = screenPoint.x || 0;
            y = screenPoint.y || 0;
        }

        this.setState({
            infoWindowPostion: { x, y }
        });

    };

    // it's not easy to use mapPoint as input geometry when search point features,
    // so we should convert the map point into a extent then do the search
    getQueryExtent(sceenPosX=0, sceenPosY=0, tolerance=10){

        const screenPosXmin = sceenPosX - tolerance;
        const screenPosYmin = sceenPosY + tolerance;

        const screenPosXmax = sceenPosX + tolerance;
        const screenPosYmax = sceenPosY - tolerance;

        const geometryMin = this.mapView.toMap({
            x: screenPosXmin,
            y: screenPosYmin
        }); 

        const geometryMax = this.mapView.toMap({
            x: screenPosXmax,
            y: screenPosYmax
        }); 

        return new Promise((resolve, reject)=>{

            loadModules([
                "esri/geometry/Extent"
            ]).then(([
                Extent
            ])=>{
    
                const queryExtent = new Extent({
                    xmin: geometryMin.x,
                    ymin: geometryMin.y,
                    xmax: geometryMax.x,
                    ymax: geometryMax.y,
                    spatialReference: {
                        "latestWkid": 3857,
                        "wkid": 102100
                    }
                });
    
                resolve(queryExtent);
    
            }).catch(err=>{
                reject(err);
            });
        });
    };

    render(){
        return(
            <div>
                <div id={CONTAINER_ID} style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                }}></div>
                <InfoWindow 
                    position={this.state.infoWindowPostion}
                    data={this.props.infoWindowData}
                    onClose={this.props.onInfoWindowClose}
                />
            </div>


        );
    };

};

export default Map;