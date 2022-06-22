import Search from "./components/Search/Search";

export const MapConfig = {
    // https://www.arcgis.com/home/item.html?id=ba6c28836375471d8d6233d521f5ef26
    'WebmapId': 'ba6c28836375471d8d6233d521f5ef26',

    // https://www.arcgis.com/home/item.html?id=d957997ccee7408287a963600a77f61f
    'WildfiresLayerUrl': 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0',

    'WildfireLayerClassificationField': 'DailyAcres',

    'SmokeLayerUrl': 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NDGD_SmokeForecast_v1/FeatureServer/0'
    // 'SmokeLayerUrl': 'https://utility.arcgis.com/usrsvcs/servers/1bb73533826544d1a2c47475c2ae5aee/rest/services/LiveFeeds/NDGD_SmokeForecast/MapServer'
};

export const UIConfig = {
    'SidebarWidth': 450,
    // color for sidebar and info window background
    'ThemeColorDarkPurple': 'rgba(26,0,17,.8)',
    // color for divider lines, timeline title backgrounds
    'ThemeColorBrightPurple': 'rgba(103, 0, 67, 0.5)',
    'ThemeColorBrightPurpleOpaque': 'rgba(103, 0, 67, 1)',
    // text color
    'ThemeColorYellow': 'rgb(209, 136, 2)'
};

export const SearchParamKeys = {
    'mapCenterLocation': '@'
}