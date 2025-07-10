import { observable } from "mobx"

export default observable({
    playerData: {},
    eventData: {},
    resultsData: {},
    sortedResultsData: [],
    initCount: 0,
    isRatingCalcEnabled: true,
    rankingTypeNames: [],
    publishedManifest: {}
})
