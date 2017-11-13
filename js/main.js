require([
    "esri/arcgis/utils", 
    "esri/request",
    "esri/arcgis/OAuthInfo",
    "esri/arcgis/Portal",
    "esri/IdentityManager",
    "esri/geometry/Point",
    "esri/geometry/Multipoint",
    "esri/SpatialReference",
    "dojo/domReady!"
], function(
    arcgisUtils, 
    esriRequest,
    OAuthInfo,
    arcgisPortal,
    esriId,
    Point,
    Multipoint,
    SpatialReference
){
    $(document).ready(function () {
        // Enforce strict mode
        'use strict';

        // App Config Data
        const WEB_MAP_ID = "4b420a6ceb0e4addb021d5a8bf02f251";
        const REQUEST_URL_WILDFIRE_ACTIVITY = "https://livefeeds.arcgis.com/arcgis/rest/services/LiveFeeds/Wildfire_Activity/MapServer/0/query";
        const OAUTH_APP_ID = "5LTx4lRbinywSMvI";
        const AFFECTED_AREA_FIELD_NAME = 'AREA_';
        const PCT_CONTAINED_FIELD_NAME = 'PER_CONT';
        const FIRE_NAME_FIELD_NAME = 'FIRE_NAME';
                
        //initialize app
        var wildFireVizApp = new WildFireVizApp();
        wildFireVizApp.startUp();

        function WildFireVizApp(){
            // let app = this;
            this.map = null;
            this.operationalLayers = [];
            this.arrOfAllWildfires = [];
            this.selectedFireName = '';
            this.affectedAreaFilterData = [
                {'min': 110720, 'max': Number.POSITIVE_INFINITY, 'checked': true},
                {'min': 40906, 'max': 110720, 'checked': true},
                {'min': 11067, 'max': 40906, 'checked': true},
                {'min': 0, 'max': 11067, 'checked': true},
            ];
            
            this.startUp = function(){
                this._signInToArcGISPortal(OAUTH_APP_ID);
                this._initWebMapByID(WEB_MAP_ID);
            }

            this._initWebMapByID = function(webMapID){
                arcgisUtils.createMap(webMapID, "mapDiv").then(response=>{
                    this.map = response.map;
                    this.operationalLayers = this._getWebMapOperationalLayers(response);

                    this._addExtentChangeEventHandlerToMap(this.map);
                    this._queryWildfireData(this._getQueryParams(null, null, true), fullListOfWildfires=>{
                        // console.log('fullListOfWildfires', fullListOfWildfires);
                        this._setArrOfAllWildfires(fullListOfWildfires);
                        this._zoomToExtentOfAllFires(fullListOfWildfires);
                        addSearchInputOnTypeEventHandler();
                    })
                });
            }

            this.searchWildfire = function(options={}, onSuccessHandler){
                let extent = options.extent || this.map.extent;
                let whereClause = options.whereClause || null;
                onSuccessHandler = onSuccessHandler || populateArrayChartForWildfires;

                let extentJSON = JSON.stringify(extent.toJson());
                let queryParams = this._getQueryParams(whereClause, extentJSON);

                this._setLayerDefinitionsForWildfireLayer(queryParams.where);
                this._queryWildfireData(queryParams, onSuccessHandler);
            }

            this.updateAffectedAreaFilterData = function(arrayOfFilterStatus){
                this.affectedAreaFilterData.forEach(function(d,i){
                    d.checked = arrayOfFilterStatus[i]
                });
                let affectedAreaWhereClause = this._getWhereClauseForAffectedArea();
                // console.log(affectedAreaWhereClause);
                this.searchWildfire();
            }

            this.setSelectedFireName = function(value=''){
                this.selectedFireName = value;
                toggleSearchBtnIcon();
            }

            this.getSelectedFireName = function(){
                return this.selectedFireName;
            }

            this._setArrOfAllWildfires = function(wildfires){
                this.arrOfAllWildfires = wildfires;
            }

            this.getArrOfAllWildfires = function(fireNameOnly=false){
                let arrOfAllWildfires = (!fireNameOnly)
                    ? this.arrOfAllWildfires
                    : this.arrOfAllWildfires.map(d=>{
                        return d.attributes[FIRE_NAME_FIELD_NAME];
                    })
                return arrOfAllWildfires;
            }

            this._zoomToExtentOfAllFires = function(fullListOfWildfires){
                let arrOfWildfirePointLocation = fullListOfWildfires.map(function(d){
                    return [d.geometry.x, d.geometry.y];
                });
                let multipointForAllWildfires = new Multipoint(new SpatialReference({wkid:102100}));
                multipointForAllWildfires.points = arrOfWildfirePointLocation;
                this.map.setExtent(multipointForAllWildfires.getExtent(), true);
            }

            this._getWhereClauseForAffectedArea = function(){this
                let arrOfWhereClauses = [];
                this.affectedAreaFilterData.forEach(function(d){                    
                    if(d.checked){
                        let condition1 = AFFECTED_AREA_FIELD_NAME + ' >= ' + d.min;
                        let condition2 = (d.max !== Number.POSITIVE_INFINITY) ? AFFECTED_AREA_FIELD_NAME + ' < ' + d.max : '';
                        let whereClause = [condition1, condition2].filter(function(condition){
                            return condition !== '';
                        }).join(' AND ');
                        arrOfWhereClauses.push(`(${whereClause})`);
                    }
                });
                // if all check boxes are unchecked, add a fake condition so no wildfires will be returned
                if(!arrOfWhereClauses.length){
                    arrOfWhereClauses.push(AFFECTED_AREA_FIELD_NAME + ' = -999');
                }
                return arrOfWhereClauses.join(' OR ');
            }

            this._getFireNameFromInput = function(){
                // let fireName = $('.fire-name-search-input').val();
                let fireName = this.getSelectedFireName();
                let whereClauseForFireName = fireName ? `${FIRE_NAME_FIELD_NAME} = '${fireName}'` : null;
                return whereClauseForFireName;
            }

            this._setLayerDefinitionsForWildfireLayer =function(whereClause){
                let layerDefs = [];
                layerDefs[0] = whereClause;
                // console.log('setLayerDef', whereClause);
                this.operationalLayers.forEach(function(layer){
                    layer.layerObject.setLayerDefinitions(layerDefs);
                });
            }

            this._addExtentChangeEventHandlerToMap = function(map){
                map.on('extent-change', evt=>{
                    this.searchWildfire({"extent": evt.extent});
                }); 
            }

            this._getQueryParams = function(whereClause, searchExtent, returnGeometry=false){
                let params = {
                    f: "json",
                    outFields: "*",
                    // where: whereClause || "PER_CONT < 100",
                    returnGeometry: returnGeometry
                };
                let arrOfWhereClause = ["PER_CONT < 100", this._getWhereClauseForAffectedArea()];
                let fireNameFromInput = this._getFireNameFromInput();
                if(fireNameFromInput){
                    arrOfWhereClause.push(fireNameFromInput);
                }
                arrOfWhereClause = arrOfWhereClause.map(function(item){
                    return '(' + item + ')';
                })
                whereClause = arrOfWhereClause.join(" AND ");
                params.where = whereClause;

                if(searchExtent){
                    params.geometry = searchExtent;
                    params.geometryType = "esriGeometryEnvelope";
                }

                // console.log(params);
                return params;
            }

            this._queryWildfireData = function(params, callback){
                let wildfireDataRequest = esriRequest({
                    url: REQUEST_URL_WILDFIRE_ACTIVITY,
                    content: params,
                    handleAs: "json",
                    callbackParamName: "callback"
                });

                function requestSuccessHandler(response) {
                    callback(response.features);
                    // addSearchInputOnTypeEventHandler(response.features);
                }
        
                function requestErrorHandler(error) {
                    console.log("Error: ", error.message);
                }
        
                wildfireDataRequest.then(requestSuccessHandler, requestErrorHandler);
            }

            this._getWebMapOperationalLayers = function(response){
                let layers = response.itemInfo.itemData.operationalLayers.filter(function(layer){
                    return layer.layerType === 'ArcGISMapServiceLayer' && layer.visibility === true;
                });
                return layers;
            }

            this._signInToArcGISPortal = function(OAuthAppID){
                let info = new OAuthInfo({
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
            // console.log('calling populateArrayChartForWildfires', wildfireData);
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
                var pctContained = d.attributes[PCT_CONTAINED_FIELD_NAME];
                if(area >= 110720){
                    legendClass = 1;
                } else if(area < 110720 && area >= 40906){
                    legendClass = 2;
                } else if(area < 40906 && area >= 11067){
                    legendClass = 3;
                } else {
                    legendClass = 4;
                }
                var legendIconStr = `
                    <div class="legend-grid-item block trailer-half">
                        <div class="legend-icon legend-class-${legendClass}">
                            <div class='bottom-pct-indicator'>
                                <div class='highlight-bar' style="width: ${pctContained}%;"></div>
                            </div>
                        </div>
                    </div>
                `;
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
                var contentHtmlStr = `
                    <span>The ${selectedFeature.attributes[FIRE_NAME_FIELD_NAME]} fire is estimated to be ${selectedFeature.attributes.AREA_} ACRES and ${selectedFeature.attributes.PER_CONT}% contained.</span>
                    <br><br>
                    <span>Data Source: NIFC</span><br>
                    <span>Start Date: ${moment(selectedFeature.attributes.START_DATE).format("MMMM Do, YYYY")}</span>
                `;

                wildFireVizApp.map.infoWindow.setTitle(selectedFeature.attributes[FIRE_NAME_FIELD_NAME]);
                wildFireVizApp.map.infoWindow.setContent(contentHtmlStr);
                wildFireVizApp.map.infoWindow.show(selectedFeatureGeom);
            });

            legendGridItems.on('mouseout', function(evt){
                wildFireVizApp.map.infoWindow.hide();
            });

            addClickHandlerToLegendGridItems(wildfireData);
        }

        function addClickHandlerToLegendGridItems(wildfireData){
            $('.legend-grid-item').on('click', function(evt){
                var itemIdx = $(this).index();
                var selectedFeature = wildfireData[itemIdx];
                var selectedFeatureGeom = new Point( {"x": selectedFeature.attributes.LONGITUDE, "y": selectedFeature.attributes.LATITUDE, "spatialReference": {"wkid": 4326 } });
                wildFireVizApp.map.centerAndZoom(selectedFeatureGeom, 10);
            });
        }

        function populateSuggestionList(arrOfSuggestedFireNames, inputTextValue){
            var suggestionListContainer = $('.suggestion-list-container');
            suggestionListContainer.empty();
            if(arrOfSuggestedFireNames.length){
                arrOfSuggestedFireNames = arrOfSuggestedFireNames.map(function(d){
                    return "<div class='suggestion-item'><span class='font-size--2'>" + d + "</span></div>"
                });
                suggestionListContainer.append(arrOfSuggestedFireNames.join(''));
                // suggestionListContainer.removeClass('hide');
                toggleSuggestionList(true);
                addClickEventHandlerToSuggestionListItems(suggestionListContainer);
            } else {
                suggestionListContainer.addClass('hide');
                if(!inputTextValue){
                    wildFireVizApp.searchWildfire();
                }
            }
        }

        function addClickEventHandlerToSuggestionListItems(suggestionListContainer){
            suggestionListContainer.find('.suggestion-item').on('click', function(evt){
                var itemText = $(this).text();
                $('.fire-name-search-input').val(itemText);
                wildFireVizApp.setSelectedFireName(itemText);
                toggleSuggestionList(false);
                // suggestionListContainer.addClass('hide');
                wildFireVizApp.searchWildfire();
            });
        }

        function addSearchInputOnTypeEventHandler(){
            $('.fire-name-search-input').unbind('keyup').on( "keyup", fireNameSearchInputOnKeyupHandler); 
            // console.log(arrOfWildfireNames);
        }

        function fireNameSearchInputOnKeyupHandler(evt){
            let arrOfWildfireNames = wildFireVizApp.getArrOfAllWildfires(true);
            let currentText = $(this).val();
            let textToSearch = new RegExp('^' + currentText + '.*$', 'i');
            let matchedNames = [];
            if(currentText.length >= 2){
                matchedNames = arrOfWildfireNames.filter(function(d, i){
                    return d.match(textToSearch);
                }).splice(0, 5);
            } 
            wildFireVizApp.setSelectedFireName(currentText);
            populateSuggestionList(matchedNames, currentText);
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

            wildFireVizApp.updateAffectedAreaFilterData(arrOfAreaFilterStatus);
        }

        function searchBtnOnClickHandler(evt){
            let searchBtn = $(this);
            let searchBtnIcon = searchBtn.find('.fa');
            let isClickToClickSearchText = searchBtnIcon.hasClass('fa-times');

            if(isClickToClickSearchText){
                $('.fire-name-search-input').val('');
                wildFireVizApp.setSelectedFireName();
                wildFireVizApp.searchWildfire();
            } 
        }

        function toggleSuggestionListBtnOnClickHandler(){
            let isSuggestionListInvisible = $('.suggestion-list-container').hasClass('hide');

            if(isSuggestionListInvisible){
                let arrOfWildfireNames = wildFireVizApp.getArrOfAllWildfires(true);
                populateSuggestionList(arrOfWildfireNames);
            } else {
                toggleSuggestionList(false);
            }
        }

        function updateToggleSuggestionListBtnIcon(){
            let isSuggestionListInvisible = $('.suggestion-list-container').hasClass('hide');
            let targetBtn = $('.toggle-suggestion-list-btn');
            let toggleSuggestionListBtnIcon = targetBtn.find('.fa');
            if(isSuggestionListInvisible){
                toggleSuggestionListBtnIcon.addClass('fa-caret-down');
                toggleSuggestionListBtnIcon.removeClass('fa-caret-up');
            } else {
                toggleSuggestionListBtnIcon.addClass('fa-caret-up');
                toggleSuggestionListBtnIcon.removeClass('fa-caret-down');
            }
        }

        function toggleSuggestionList(isVisible){
            var suggestionListContainer = $('.suggestion-list-container');
            if(isVisible){
                suggestionListContainer.removeClass('hide');
            } else {
                suggestionListContainer.addClass('hide');
            }   
            updateToggleSuggestionListBtnIcon();
        }

        function toggleSearchBtnIcon(){
            let selectedFireName = wildFireVizApp.getSelectedFireName();
            let searchBtn = $('.search-by-name-btn');
            let searchBtnIcon = searchBtn.find('.fa');
            if(selectedFireName){
                searchBtnIcon.addClass('fa-times');
                searchBtnIcon.removeClass('fa-search');
            } else {
                searchBtnIcon.removeClass('fa-times');
                searchBtnIcon.addClass('fa-search'); 
                toggleSuggestionList(false);
            }
        }

        //attach app event handlers
        $('.affected-area-filter').on('click', '.fa', affectedAreaFilterOnClickHandler);

        $('.search-by-name-btn').on('click', searchBtnOnClickHandler);

        $('.toggle-suggestion-list-btn').on('click', toggleSuggestionListBtnOnClickHandler);

    });

});