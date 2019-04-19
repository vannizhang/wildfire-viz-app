'use strict';

import {loadModules} from 'esri-loader';

class CustomDynamicLayer {

    constructor({
        mapUrl = '',
        mapParameters = {},
        layerParams = {}
    }={}){

        // all values in map paramters need to be in type of string
        Object.keys(mapParameters).forEach(key=>{
            if(typeof mapParameters[key] !== 'string'){
                console.error(`error when init CustomDynamicLayer >>> type of map parameter: "${key}" is not string`);
                return;
            }
        })

        // reference: https://stackoverflow.com/questions/43431550/async-await-class-constructor
        return (async()=>{
            this.layer = await this.init({ mapUrl, mapParameters, layerParams });
            return this.layer;
        })();

        // console.log(mapView, id, url, mapParams);
    }

    init({
        mapUrl = '',
        mapParameters = {},
        layerParams = {}
    }={}){

        // map params contain info to export the dynamic layer as image
        mapParameters = Object.assign({
            format: 'png32',
            layers: "0",
            size: "{width},{height}",
            bbox: "{xmin},{ymin},{xmax},{ymax}",
            transparent: "true",
            f: 'image'
        }, mapParameters);

        // layer params is the object contains all info to make the layer, including the mapUrl and mapParamaters
        layerParams = Object.assign(layerParams, {
            mapUrl,
            mapParameters
        });

        return new Promise((resolve, reject)=>{

            loadModules([
                "esri/layers/BaseDynamicLayer",
                "esri/request"
            ]).then(([
                BaseDynamicLayer,
                esriRequest
            ])=>{
    
                const CustomMapServiceLayer = BaseDynamicLayer.createSubclass({
    
                    properties: {
                        mapUrl: null,
                        mapParameters: null,
                        cssFilter: null
                    },
    
                    // Override the getImageUrl() method to generate URL
                    // to an image for a given extent, width, and height.
                    getImageUrl: function(extent, width, height){
                        const urlVariables = this._prepareQuery(
                            this.mapParameters,
                            extent,
                            width,
                            height
                        );
                        const queryString = this._joinUrlVariables(urlVariables);
                        return this.mapUrl + "?" + queryString;
                    },

                    // // Fetches images for given extent and size
                    fetchImage: function (extent, width, height){
                        const url = this.getImageUrl(extent, width, height);
                    
                        // request for the image  based on the generated url
                        return esriRequest(url, {
                            responseType: "image"
                        })
                        .then(function(response) {
                            const image = response.data;
                        
                            // create a canvas with teal fill
                            const canvas = document.createElement("canvas");
                            const context = canvas.getContext("2d");
                            canvas.width = width;
                            canvas.height = height;
                        
                            // // Apply destination-atop operation to the image returned from the server
                            if(this.cssFilter){
                                context.filter = this.cssFilter;
                            }
                            // context.fillRect(0, 0, width, height);
                            context.globalCompositeOperation = "normal";
                            context.drawImage(image, 0, 0, width, height);
                        
                            return canvas;
                        }.bind(this));
                    },

    
                    // Prepare query parameters for the URL to an image to be generated
                    _prepareQuery: function(queryParameters, extent, width, height) {
                        const wkid = extent.spatialReference.isWebMercator ? 3857 : extent.spatialReference.wkid;
    
                        const replacers = {
                            width: width,
                            height: height,
                            wkid: wkid,
                            xmin: extent.xmin,
                            xmax: extent.xmax,
                            ymin: extent.ymin,
                            ymax: extent.ymax
                        };
    
                        const urlVariables = this._replace({}, queryParameters, replacers);
                        return urlVariables;
                    },
    
                    // replace the url variables with the application provided values
                    _replace: function(urlVariables, queryParameters, replacers) {
    
                        Object.keys(queryParameters).forEach(function(key) {
    
                            urlVariables[key] = Object.keys(replacers).reduce(function( previous, replacerKey){
                                return previous.replace("{" + replacerKey + "}", replacers[replacerKey] );
                            }, queryParameters[key]);
                        });
    
                        return urlVariables;
                    },
    
                    // join the url parameters
                    _joinUrlVariables: function(urlVariables) {
                        return Object.keys(urlVariables).reduce(function(previous, key){
                            return ( previous + (previous ? "&" : "") + key + "=" + urlVariables[key] );
                        }, "");
                    }
                });

                const layer = new CustomMapServiceLayer(layerParams);
    
                resolve(layer);
    
            }).catch(err=>{
                console.error(err);
                reject(err);
            });
        });


    }

    setTime(time=''){
        // this.layer.time = time;
        // this.layer.refresh();
        console.log('calling set time');
    }
}

export default CustomDynamicLayer;