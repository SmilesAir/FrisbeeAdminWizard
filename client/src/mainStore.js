import { observable } from "mobx"

export default observable({
    playerData: {},
    eventData: {},
    resultsData: {},
    sortedResultsData: [],
    isRatingCalcEnabled: true,
    rankingTypeNames: [],
    publishedManifest: {}
})
