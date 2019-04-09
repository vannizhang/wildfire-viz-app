import React from 'react';
import {loadModules} from 'esri-loader';

import InfoWindow from '../InfoWindow';
import FireflySymbols from './FireflySymbolsLookup';

const CONTAINER_ID = 'mapViewDiv';
const WEB_MAP_ID = 'ba6c28836375471d8d6233d521f5ef26';
const LAYER_ID_ACTIVE_FIRES = 'activeFires';

class Map extends React.Component {

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

            this.mapView = new MapView({
                map: new WebMap({
                    portalItem: { 
                        id: WEB_MAP_ID
                    }
                }),
                container: CONTAINER_ID,
                padding: {
                    right: this.props.rightPadding || 0
                }
            });

            this.initLayers();

            this.mapView.when(()=>{
                this.mapViewOnReadyHandler();
                this.initMapExtentOnChangeHandler();
            }).catch((err)=>{
                console.error(err)
            });

        }).catch(err=>{
            console.error(err);
        })
    };

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
    };

    initMapExtentOnChangeHandler(){

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

    }

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
                />
            </div>


        );
    };

};

export default Map;