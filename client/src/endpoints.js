
let isDev = false
let urls = undefined

if (isDev) {
    urls = {
        GET_PLAYER_DATA: "https://tkhmiv70u9.execute-api.us-west-2.amazonaws.com/development/getAllPlayers",
        GET_EVENT_DATA: "https://xyf6qhiwi1.execute-api.us-west-2.amazonaws.com/development/getAllEvents",
        GET_RESULTS_DATA: "https://pkbxpw400j.execute-api.us-west-2.amazonaws.com/development/getAllResults",
        UPLOAD_POINTS_DATA: "https://k7p1y5ntz6.execute-api.us-west-2.amazonaws.com/development/uploadPointsData/<date>/divisionName/<divisionName>/type/<type>",
        SET_EVENT_RESULTS: "https://pkbxpw400j.execute-api.us-west-2.amazonaws.com/development/setEventResults/<eventKey>/divisionName/<divisionName>",
        GET_POINTS_MANIFEST: "https://k7p1y5ntz6.execute-api.us-west-2.amazonaws.com/development/getManifest",
        GET_POINTS_DATA: "https://k7p1y5ntz6.execute-api.us-west-2.amazonaws.com/development/downloadPointsData/<key>",
        SET_POINTS_DATA_HIDDEN: "https://k7p1y5ntz6.execute-api.us-west-2.amazonaws.com/development/setPointsDataIsHidden/<key>/isHidden/<isHidden>"
    }
} else {
    urls = {
        GET_PLAYER_DATA: "https://4wnda3jb78.execute-api.us-west-2.amazonaws.com/production/getAllPlayers",
        GET_EVENT_DATA: "https://wyach4oti8.execute-api.us-west-2.amazonaws.com/production/getAllEvents",
        GET_RESULTS_DATA: "https://v869a98rf9.execute-api.us-west-2.amazonaws.com/production/getAllResults",
        UPLOAD_POINTS_DATA: "https://kvq5a3et4b.execute-api.us-west-2.amazonaws.com/production/uploadPointsData/<date>/divisionName/<divisionName>/type/<type>",
        SET_EVENT_RESULTS: "https://v869a98rf9.execute-api.us-west-2.amazonaws.com/production/setEventResults/<eventKey>/divisionName/<divisionName>",
        GET_POINTS_MANIFEST: "https://kvq5a3et4b.execute-api.us-west-2.amazonaws.com/production/getManifest",
        GET_POINTS_DATA: "https://kvq5a3et4b.execute-api.us-west-2.amazonaws.com/production/downloadPointsData/<key>",
        SET_POINTS_DATA_HIDDEN: "https://kvq5a3et4b.execute-api.us-west-2.amazonaws.com/production/setPointsDataIsHidden/<key>/isHidden/<isHidden>"
    }
}

export default function(key, pathParams, queryParams) {
    let path = isDev ? "https://k7p1y5ntz6.execute-api.us-west-2.amazonaws.com" : "https://kvq5a3et4b.execute-api.us-west-2.amazonaws.com"
    let stageName = isDev ? "development" : "production"
    path += `/${stageName}`

    let pathReplaceData = {
        "path": path,
        "stage": stageName
    }

    Object.assign(pathReplaceData, pathParams)

    let url = urls[key]
    for (let wildName in pathReplaceData) {
        url = url.replace(`<${wildName}>`, pathReplaceData[wildName])
    }

    let firstQueryParam = true
    for (let paramName in queryParams) {
        let prefix = firstQueryParam ? "?" : "&"
        firstQueryParam = false

        url += `${prefix}${paramName}=${queryParams[paramName]}`
    }

    return url
}
