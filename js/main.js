require([
    "esri/arcgis/utils", 
    "esri/request",
    "esri/arcgis/OAuthInfo",
    "esri/arcgis/Portal",
    "esri/IdentityManager",
    "esri/geometry/Point",
    "dojo/domReady!"
], function(
    arcgisUtils, 
    esriRequest,
    OAuthInfo,
    arcgisPortal,
    esriId,
    Point
){
    $(document).ready(function () {
        // Enforce strict mode
        'use strict';

        // App Config Data
        const WEB_MAP_ID = "4b420a6ceb0e4addb021d5a8bf02f251";
        const REQUEST_URL_WILDFIRE_ACTIVITY = "https://livefeeds.arcgis.com/arcgis/rest/services/LiveFeeds/Wildfire_Activity/MapServer/0/query";
        const OAUTH_APP_ID = "nAmDF8jvzSH6EK9T";
        const AFFECTED_AREA_FIELD_NAME = 'AREA_';
                
        //initialize app
        var wildFireVizAp = new WildFireVizApp();
        wildFireVizAp.startUp();

        //attach app event handlers
        $('.affected-area-filter').on('click', '.fa', affectedAreaFilterOnClickHandler);

        function WildFireVizApp(){
            let app = this;
            this.map = null;
            this.operationalLayers = [];
            this.affectedAreaFilterData = [
                {'min': 110720, 'max': Number.POSITIVE_INFINITY, 'checked': true},
                {'min': 40906, 'max': 110720, 'checked': true},
                {'min': 11067, 'max': 40906, 'checked': true},
                {'min': 0, 'max': 40906, 'checked': true},
            ];
            
            this.startUp = function(){
                _signInToArcGISPortal(OAUTH_APP_ID);
                _initWebMapByID(WEB_MAP_ID);
            }

            this.updateAffectedAreaFilterData = function(arrayOfFilterStatus){
                this.affectedAreaFilterData.forEach(function(d,i){
                    d.checked = arrayOfFilterStatus[i]
                });
                let affectedAreaWhereClause = _getWhereClauseForAffectedArea();
                _setLayerDefinitionsForWildfireLayer(affectedAreaWhereClause);
            }

            function _initWebMapByID(webMapID){
                arcgisUtils.createMap(webMapID, "mapDiv").then(function(response) {
                    app.map = response.map;
                    app.operationalLayers = _getWebMapOperationalLayers(response);

                    _addExtentChangeEventHandlerToMap(app.map);
                    _getWildfireDataByMapExent(app.map.extent, populateArrayChartForWildfires);
                    _queryWildfireData(function(fullListOfWildfires){
                        addSearchInputOnTypeEventHandler(fullListOfWildfires);
                    })
                });
            }

            function _getWhereClauseForAffectedArea(){
                let arrOfWhereClauses = [];
                app.affectedAreaFilterData.forEach(function(d){                    
                    if(d.checked){
                        let condition1 = AFFECTED_AREA_FIELD_NAME + ' >= ' + d.min;
                        let condition2 = (d.max !== Number.POSITIVE_INFINITY) ? AFFECTED_AREA_FIELD_NAME + ' <= ' + d.max : '';
                        let whereClause = [condition1, condition2].filter(function(condition){
                            return condition !== '';
                        }).join(' AND ');
                        arrOfWhereClauses.push(whereClause);
                    }
                });
                // if all check boxes are unchecked, add a fake condition so no wildfires will be returned
                if(!arrOfWhereClauses.length){
                    arrOfWhereClauses.push(AFFECTED_AREA_FIELD_NAME + ' = -999');
                }
                return arrOfWhereClauses.join(' OR ');
            }

            function _setLayerDefinitionsForWildfireLayer(whereClause){
                let layerDefs = [];
                layerDefs[0] = whereClause;
                app.operationalLayers.forEach(function(layer){
                    layer.layerObject.setLayerDefinitions(layerDefs);
                });
                _getWildfireDataByMapExent(app.map.extent, populateArrayChartForWildfires);
            }

            function _addExtentChangeEventHandlerToMap(map){
                map.on('extent-change', evt=>{
                    _getWildfireDataByMapExent(evt.extent, populateArrayChartForWildfires);
                }); 
            }

            function _getWildfireDataByMapExent(extent, callback){
                let requestURL = REQUEST_URL_WILDFIRE_ACTIVITY;
                let extentJSON = JSON.stringify(extent.toJson());
                let whereClause = "PER_CONT < 100 AND " + _getWhereClauseForAffectedArea();

                _queryWildfireData(callback, whereClause, extentJSON);

                // var wildfireDataRequest = esriRequest({
                //     url: requestURL,
                //     content: {
                //         f: "json",
                //         outFields: "*",
                //         where: "PER_CONT < 100 AND " + whereClauseForAffectedArea,
                //         geometry: JSON.stringify(extentJSON),
                //         geometryType: "esriGeometryEnvelope",
                //         returnGeometry: true,
                //     },
                //     handleAs: "json",
                //     callbackParamName: "callback"
                // });

                // function requestSuccessHandler(response) {
                //     callback(response.features);
                // }
        
                // function requestErrorHandler(error) {
                //     console.log("Error: ", error.message);
                // }
        
                // wildfireDataRequest.then(requestSuccessHandler, requestErrorHandler);
        
            }

            function _queryWildfireData(callback, whereClause, searchExtent){
                var params = {
                    f: "json",
                    outFields: "*",
                    where: whereClause || "PER_CONT < 100",
                    returnGeometry: false
                };
                if(searchExtent){
                    params.geometry = searchExtent;
                    params.geometryType = "esriGeometryEnvelope";
                }
                var wildfireDataRequest = esriRequest({
                    url: REQUEST_URL_WILDFIRE_ACTIVITY,
                    content: params,
                    handleAs: "json",
                    callbackParamName: "callback"
                });

                function requestSuccessHandler(response) {
                    callback(response.features);
                }
        
                function requestErrorHandler(error) {
                    console.log("Error: ", error.message);
                }
        
                wildfireDataRequest.then(requestSuccessHandler, requestErrorHandler);
            }

            function _getWebMapOperationalLayers(response){
                var layers = response.itemInfo.itemData.operationalLayers.filter(function(layer){
                    return layer.layerType === 'ArcGISMapServiceLayer' && layer.visibility === true;
                });
                return layers;
            }

            function _signInToArcGISPortal(OAuthAppID){
                var info = new OAuthInfo({
                    appId: OAuthAppID,
                    popup: false
                });
                esriId.registerOAuthInfos([info]);
        
                new arcgisPortal.Portal(info.portalUrl).signIn()
                .then(function(portalUser){
                    // console.log("Signed in to the portal: ", portalUser);
                })     
                .otherwise(
                    function (error){
                        console.log("Error occurred while signing in: ", error);
                    }
                );  
            }
        }

        function populateArrayChartForWildfires(wildfireData){
            var legendGrid = $('.legend-grid');
            var legendIcons = [];
            wildfireData.sort(function(a, b) {
                return +b.attributes[AFFECTED_AREA_FIELD_NAME] - +a.attributes[AFFECTED_AREA_FIELD_NAME];
            });
            // //only show top numbers of wildfires in the list
            // var wildfireDataToPopulate = wildfireData.filter(function(d, i){
            //     return i < 60;
            // });
            wildfireData.forEach(function(d) {
                var legendClass;
                var area = d.attributes[AFFECTED_AREA_FIELD_NAME];
                if(area >= 110720){
                    legendClass = 1;
                } else if(area < 110720 && area >= 40906){
                    legendClass = 2;
                } else if(area < 40906 && area >= 11067){
                    legendClass = 3;
                } else {
                    legendClass = 4;
                }
                var legendIconStr = '<div class="legend-grid-item block trailer-half"><div class="legend-icon legend-class-' + legendClass + '"></div></div>';
                legendIcons.push(legendIconStr);
            });

            var legendGridItems = $(legendIcons.join(''));
            legendGrid.empty();
            legendGrid.append(legendGridItems);
            // console.log(wildfireDataToPopulate);

            legendGridItems.on('mouseover', function(evt){
                var itemIdx = $(this).index();
                var selectedFeature = wildfireData[itemIdx];
                var selectedFeatureGeom = new Point( {"x": selectedFeature.attributes.LONGITUDE, "y": selectedFeature.attributes.LATITUDE, "spatialReference": {"wkid": 4326 } });

                // console.log(selectedFeature);
                // // console.log(wildFireVizAp.map.infoWindow);

                var contentHtmlStr = `
                    <div class="header">${selectedFeature.attributes.FIRE_NAME}</div>
                    <div class="hzLine"></div>
                    <span>The Willow fire is estimated to be ${selectedFeature.attributes.AREA_} ACRES and ${selectedFeature.attributes.PER_CONT}% contained.</span>
                    <br><br>
                    <span>Data Source: NIFC</span><br>
                    <span>Start Date: ${selectedFeature.attributes.START_DATE}</span>
                `;

                wildFireVizAp.map.infoWindow.setTitle('');
                wildFireVizAp.map.infoWindow.setContent(contentHtmlStr);
                wildFireVizAp.map.infoWindow.show(selectedFeatureGeom);
            });

            legendGridItems.on('mouseout', function(evt){
                wildFireVizAp.map.infoWindow.hide();
            });

        }

        function addSearchInputOnTypeEventHandler(arrOfAllWildfires){
            
            var arrOfWildfireNames = arrOfAllWildfires.map(function(d){
                return d.attributes.FIRE_NAME;
            });
            
            $('.fire-name-search-input').on( "keydown", function(evt){
                let currentText = $(this).val();
                if(currentText.length >= 3){
                    console.log(currentText);
                }
            }); 

            console.log(arrOfWildfireNames);
        }

        function affectedAreaFilterOnClickHandler(evt){
            var targetCBox = $(this);
            var isTargetCBoxChecked = targetCBox.hasClass('fa-check-square-o');
            var arrOfAreaFilterStatus = [];
            if(isTargetCBoxChecked){
                targetCBox.removeClass('fa-check-square-o');
                targetCBox.addClass('fa-square-o');
            } else {
                targetCBox.addClass('fa-check-square-o');
                targetCBox.removeClass('fa-square-o');
            }

            $('.affected-area-filter').each(function(element){
                let isCBoxChecked = $(this).find('.fa').hasClass('fa-check-square-o'); 
                arrOfAreaFilterStatus.push(isCBoxChecked);
            });

            wildFireVizAp.updateAffectedAreaFilterData(arrOfAreaFilterStatus);
        }

    });

});