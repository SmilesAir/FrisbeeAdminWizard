/* eslint-disable no-alert */

import { v4 as uuidv4 } from "uuid"

import MainStore from "./mainStore.js"
import buildUrl from "./endpoints.js"
import EnumStore from "./enumStore.js"

const openRankingKFactor = 4
const womenRankingKFactor = 10
const rankingMajorBonusPoints = 100
const rankingWorldsBonusPoints = 200
const majorNameList = [ "Frisbeer", "European Freestyledisc Championships", "EFC", "AFO", "American Freestyle Championships" ]
const worldsNameList = [ "FPAW" ]

const ratingKFactor = 32
const ratingKFactorMajor = 48
const ratingKFactorWorlds = 64
const startingElo = 400
const topRankingResultsCount = 8

let Common = {}

Common.fetchEx = function(key, pathParams, queryParams, options) {
    return fetch(buildUrl(key, pathParams, queryParams), options).then((response) => {
        return response.json()
    })
}

function isValidText(str) {
    return str !== undefined && str !== null && str.length > 0
}

Common.getDisplayNameFromPlayerData = function(playerData) {
    let displayName = ""
    if (isValidText(playerData.firstName) && isValidText(playerData.lastName)) {
        displayName = playerData.firstName.toLowerCase() + "_" + playerData.lastName.toLowerCase()
    } else if (isValidText(playerData.firstName)) {
        displayName = playerData.firstName.toLowerCase()
    }else if (isValidText(playerData.lastName)) {
        displayName = playerData.lastName.toLowerCase()
    }

    return displayName.replaceAll(" ", "_")
}

Common.getFullNameFromPlayerData = function(playerData) {
    let fullName = ""
    if (isValidText(playerData.firstName) && isValidText(playerData.lastName)) {
        fullName = playerData.firstName + " " + playerData.lastName
    } else if (isValidText(playerData.firstName)) {
        fullName = playerData.firstName
    }else if (isValidText(playerData.lastName)) {
        fullName = playerData.lastName
    }

    return fullName
}

Common.isValidGuid = function(guid) {
    if (guid === undefined || guid === null || guid.length < 5) {
        return false
    }

    return true
}

function checkAliasErrors() {
    let loopErrors = findPlayerAliasLoops()
    if (loopErrors.length > 0) {
        let message = "Alias Loops Found.\nGo to Names tab to fix before continuing:\n\n"
        for (let loop of loopErrors) {
            let line = ""
            for (let player of loop) {
                line += player.key + ": " + player.firstName + " " + player.lastName + " -> "
            }
            message += line.slice(0, line.length - 4) + "\n\n"
        }

        alert(message)

        return false
    }

    return true
}

function findPlayerAliasLoops() {
    let loops = []
    for (let playerKey in MainStore.playerData) {
        let player = MainStore.playerData[playerKey]
        let path = []
        let history = {}
        let current = player
        while (current !== undefined && current.aliasKey !== undefined) {
            if (history[current.key] !== undefined) {
                loops.push(path)
                break
            }

            path.push(current)
            history[current.key] = 1
            current = MainStore.playerData[current.aliasKey]
        }
    }
    return loops
}

Common.downloadPlayerAndEventData = function() {
    Common.fetchEx("GET_PLAYER_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.playerData = data.players

        if (!checkAliasErrors()) {
            return
        }

        MainStore.cachedDisplayNames = []
        for (let id in MainStore.playerData) {
            let playerData = MainStore.playerData[id]
            MainStore.cachedDisplayNames.push(Common.getDisplayNameFromPlayerData(playerData))
        }

        ++MainStore.initCount

        console.log("playerData", data)
    }).catch((error) => {
        console.error(`Failed to download Player data: ${error}`)
    })

    Common.fetchEx("GET_EVENT_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.eventData = data.allEventSummaryData

        ++MainStore.initCount

        console.log("eventData", data)
    }).catch((error) => {
        console.error(`Failed to download Event data: ${error}`)
    })

    Common.fetchEx("GET_RESULTS_DATA", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.resultsData = data.results
        let sortedResultsData = []
        for (let resultsId in MainStore.resultsData) {
            let resultsData = MainStore.resultsData[resultsId]
            if (resultsData.eventId !== undefined) {
                sortedResultsData.push(resultsData)
            }
        }

        MainStore.sortedResultsData = sortedResultsData.sort((a, b) => {
            return a.createdAt - b.createdAt
        })

        ++MainStore.initCount

        console.log("resultsData", JSON.parse(JSON.stringify(MainStore.sortedResultsData)))
    }).catch((error) => {
        console.error(`Failed to download Results data: ${error}`)
    })

    Common.fetchEx("GET_POINTS_MANIFEST", {}, {}, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((data) => {
        MainStore.publishedManifest = data.manifest

        console.log("manifest", JSON.parse(JSON.stringify(data.manifest)))
    }).catch((error) => {
        console.error(`Failed to download Manifest data: ${error}`)
    })
}

Common.generatePoolsRankingPointsArray = function(numPlayers, numPlaces, kFactor, bonus) {
    let topScore = Math.pow(numPlayers, 1) * kFactor + (bonus || 0)
    let base = Math.pow(topScore, 1 / (numPlaces - 1))

    let pointsArray = []
    for (let i = 0; i < numPlaces; ++i) {
        pointsArray.splice(0, 0, Math.round(topScore / Math.pow(base, i) * 10) / 10)
    }

    return pointsArray
}

Common.getSortedEventData = function(startTime, endTime) {
    let sortedEventData = []
    for (let eventId in MainStore.eventData) {
        let eventData = MainStore.eventData[eventId]
        if (startTime !== undefined && endTime !== undefined) {
            let eventTime = Date.parse(eventData.startDate)
            if (eventTime < startTime || eventTime > endTime) {
                continue
            }
        }
        sortedEventData.push(eventData)
    }

    return sortedEventData.sort((a, b) => {
        return Date.parse(a.startDate) - Date.parse(b.startDate)
    })
}

Common.uploadPointsData = function(endpoint, date, divisionName, type, data) {
    Common.fetchEx(endpoint, {
        date: date,
        divisionName: divisionName,
        type: type
    }, {}, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        console.log(response)
    }).catch((error) => {
        console.error(`Failed to upload: ${error}`)
    })
}

Common.setDivisionData = function(endpoint, data) {
    Common.fetchEx(endpoint, {
        eventKey: data.eventId,
        divisionName: data.divisionName,
    }, {}, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        console.log(response)
    }).catch((error) => {
        console.error(`Failed to set division: ${error}`)
    })
}

Common.setPointsDataIsHidden = function(data, isHidden) {
    Common.fetchEx("SET_POINTS_DATA_HIDDEN", {
        key: data.key,
        isHidden: isHidden ? "1" : "0",
    }, {}, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => {
        console.log(response)
    }).catch((error) => {
        console.error(`Failed to set isHidden: ${error}`)
    })
}

Common.getOriginalPlayerData = function(playerKey) {
    let playerData = MainStore.playerData[playerKey]
    if (playerData === undefined) {
        return undefined
    }

    while (playerData.aliasKey !== undefined) {
        let originalData = MainStore.playerData[playerData.aliasKey]
        if (originalData === undefined) {
            break
        }

        playerData = originalData
    }

    return playerData
}

Common.publishRankingsAndRatings = function() {
    MainStore.rankingTypeNames[EnumStore.ERankingType.Open] = [
        "Open",
        "Open Pairs",
        "Random Open",
        "Coop",
        "Co-op",
        "Open Coop",
        "Open Co-op"
    ]
    MainStore.rankingTypeNames[EnumStore.ERankingType.Women] = [
        "Open",
        "Open Pairs",
        "Random Open",
        "Coop",
        "Co-op",
        "Open Coop",
        "Open Co-op",
        "Women",
        "Women Pairs",
        "Mixed",
        "Mixed Pairs",
    ]

    let startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 2)

    let now = new Date()
    let todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`

    let openRankings = calculateRankings(startDate, EnumStore.ERankingType.Open)
    Common.uploadPointsData("UPLOAD_POINTS_DATA", todayDate, "open", "ranking", openRankings)

    let womenRankings = calculateRankings(startDate, EnumStore.ERankingType.Women)
    Common.uploadPointsData("UPLOAD_POINTS_DATA", todayDate, "women", "ranking", womenRankings)

    let openRatings = calculateRatings()
    Common.uploadPointsData("UPLOAD_POINTS_DATA", todayDate, "open", "rating", openRatings)
}

function getSortedResultsData(startDate) {
    let sortedEventSummaries = []
    for (let eventData of Object.values(MainStore.eventData)) {
        if (startDate === undefined || Date.parse(eventData.startDate) > startDate) {
            sortedEventSummaries.push(eventData)
        }
    }

    sortedEventSummaries = sortedEventSummaries.sort((a, b) => {
        return Date.parse(a.startDate) - Date.parse(b.startDate)
    })

    let sortedResultsData = []
    for (let eventSummary of sortedEventSummaries) {
        for (let resultsData of MainStore.sortedResultsData) {
            if (resultsData.eventId === eventSummary.key && !resultsData.isHidden) {
                resultsData.startDate = eventSummary.startDate
                sortedResultsData.push(resultsData)
            }
        }
    }

    return sortedResultsData
}

function calculateRankings(startDate, rankingType) {
    let sortedResultsData = getSortedResultsData(startDate)

    let playerRankings = {}
    for (let resultsData of sortedResultsData) {
        if (MainStore.rankingTypeNames[rankingType].includes(resultsData.divisionName)) {
            addResultDataToRankings(playerRankings, rankingType, resultsData)
        }
    }

    let sortedRankingList = []
    for (let playerKey in playerRankings) {
        let rankingData = playerRankings[playerKey]
        rankingData.pointsList = rankingData.pointsList.sort((a, b) => {
            return b.points - a.points
        })
        let topRankings = rankingData.pointsList.slice(0, topRankingResultsCount)
        rankingData.points = 0
        for (let ranking of topRankings) {
            rankingData.points += ranking.points
        }
        rankingData.points = Math.round(rankingData.points)
        sortedRankingList.push(rankingData)
    }

    sortedRankingList = sortedRankingList.sort((a, b) => {
        return b.points - a.points
    })

    let place = 1
    let proccsedCount = 0
    let lastPoints = 0
    for (let rankingData of sortedRankingList) {
        if (rankingData.points !== lastPoints) {
            lastPoints = rankingData.points
            place = proccsedCount + 1
        }
        rankingData.rank = place
        ++proccsedCount
    }

    console.log(3, sortedRankingList)

    return sortedRankingList
}

function addResultDataToRankings(playerRankings, rankingType, resultsData) {
    let playerResults = []

    let roundIds = []
    for (let roundId in resultsData.resultsData) {
        if (roundId.startsWith("round")) {
            roundIds.push(roundId)
        }
    }

    // Can't handle more than 9 rounds
    roundIds = roundIds.sort((a, b) => {
        return a - b
    })

    let hashObj = {}
    let placeCount = 0
    for (let roundId of roundIds) {
        let roundData = resultsData.resultsData[roundId]
        for (let poolId in roundData) {
            if (poolId.startsWith("pool")) {
                let poolData = roundData[poolId]
                for (let teamData of poolData.teamData) {
                    for (let playerId of teamData.players) {
                        if (playerResults.find((data) => data.id === playerId) === undefined) {
                            let playerData = Common.getOriginalPlayerData(playerId)
                            if (playerData !== undefined) {
                                let result = {
                                    id: playerId,
                                    round: parseInt(roundId.replace("round", ""), 10),
                                    place: teamData.place,
                                    name: Common.getFullNameFromPlayerData(playerData) // Just for debugging
                                }
                                result.hash = result.round * 1000 + result.place
                                playerResults.push(result)

                                if (hashObj[result.hash] === undefined) {
                                    hashObj[result.hash] = result.hash
                                    ++placeCount
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    playerResults = playerResults.sort((a, b) => {
        return a.hash - b.hash
    })

    if (playerResults.length > 0) {
        let bonusPoints = 0
        for (let name of majorNameList) {
            if (resultsData.eventName.includes(name)) {
                bonusPoints = rankingMajorBonusPoints
                break
            }
        }
        for (let name of worldsNameList) {
            if (resultsData.eventName.includes(name)) {
                bonusPoints = rankingWorldsBonusPoints
                break
            }
        }

        let pointsArray = Common.generatePoolsRankingPointsArray(playerResults.length, placeCount,
            // eslint-disable-next-line eqeqeq
            rankingType == EnumStore.ERankingType.Open ? openRankingKFactor : womenRankingKFactor, bonusPoints)

        let pointsArrayIndex = pointsArray.length - 1
        let currentHash = playerResults[0].hash
        for (let player of playerResults) {
            if (currentHash !== player.hash) {
                --pointsArrayIndex
                currentHash = player.hash
            }

            let playerData = Common.getOriginalPlayerData(player.id)
            if (playerData !== undefined) {
                let rankingData = playerRankings[playerData.key]
                if (rankingData !== undefined) {
                    rankingData.pointsList.push({
                        resultsId: resultsData.key,
                        points: pointsArray[pointsArrayIndex]
                    })
                    ++rankingData.resultsCount
                // eslint-disable-next-line eqeqeq
                } else if (rankingType != EnumStore.ERankingType.Women || playerData.gender === "F") {
                    playerRankings[playerData.key] = {
                        id: playerData.key,
                        fullName: Common.getFullNameFromPlayerData(playerData),
                        pointsList: [ {
                            resultsId: resultsData.key,
                            points: pointsArray[pointsArrayIndex]
                        } ],
                        resultsCount: 1
                    }
                }
            } else {
                console.warn(`Couldn't find playerData for ${player.id}`)
            }
        }
    }
}

function calculateRatings() {
    let sortedResultsData = getSortedResultsData()

    let playerRatings = {}
    for (let resultsData of sortedResultsData) {
        calcResultsElo(playerRatings, resultsData, resultsData.startDate)
    }

    let sortedRatingData = []
    for (let playerId in playerRatings) {
        sortedRatingData.push(playerRatings[playerId])
    }

    sortedRatingData = sortedRatingData.sort((a, b) => {
        return b.rating - a.rating
    })

    console.log("output ratings", sortedRatingData)

    return sortedRatingData
}

function calcResultsElo(playerRatings, resultsData, startDate) {
    let roundIds = []
    for (let roundId in resultsData.resultsData) {
        if (roundId.startsWith("round")) {
            roundIds.push(roundId)
        }
    }

    // Can't handle more than 9 rounds
    roundIds = roundIds.sort((a, b) => {
        return a - b
    })

    let teamsData = []
    for (let roundId of roundIds) {
        let roundData = resultsData.resultsData[roundId]
        for (let poolId in roundData) {
            if (poolId.startsWith("pool")) {
                let poolData = roundData[poolId]
                for (let teamData of poolData.teamData) {
                    let hash = teamData.players.join(",")
                    if (teamsData.find((data) => data.hash === hash) === undefined) {
                        teamsData.push({
                            place: teamData.place + 1000 * parseInt(roundId.replace("round", ""), 10),
                            players: teamData.players.slice(),
                            hash: hash
                        })
                    }
                }
            }
        }
    }

    teamsData = teamsData.sort((a, b) => {
        return a.place - b.place
    })

    let kFactor = ratingKFactor
    if (worldsNameList.find((eventName) => resultsData.eventName.includes(eventName)) !== undefined) {
        kFactor = ratingKFactorMajor
    } else if (majorNameList.find((eventName) => resultsData.eventName.includes(eventName)) !== undefined) {
        kFactor = ratingKFactorWorlds
    }

    let lastHash = null
    for (let winnerIndex = 0; winnerIndex < teamsData.length; ++winnerIndex) {
        let winner = teamsData[winnerIndex]
        for (let loserIndex = winnerIndex + 1; loserIndex < teamsData.length; ++loserIndex) {
            let loser = teamsData[loserIndex]
            let isTie = winner.place === loser.place
            if (!isTie || lastHash !== loser.hash) {
                calcTeamRating(playerRatings, winner, loser, isTie ? 0 : -1, startDate, kFactor)
                lastHash = loser.hash
            }
        }
    }

    let sortedPlayerRatings = []
    for (let playerId in playerRatings) {
        sortedPlayerRatings.push(playerRatings[playerId])
    }

    sortedPlayerRatings = sortedPlayerRatings.sort((a, b) => {
        return b.rating - a.rating
    })

    for (let i = 0; i < sortedPlayerRatings.length; ++i) {
        let rank = i + 1
        let player = sortedPlayerRatings[i]
        if (player.matchCount > 100 && (player.highestRank < 0 || rank < player.highestRank)) {
            player.highestRank = rank
            player.highestRankDate = startDate
        }
    }
}

function calcTeamRating(playerRatings, team1, team2, result, startDate, kFactor) {
    let rating1 = calcTeamElo(playerRatings, team1)
    let rating2 = calcTeamElo(playerRatings, team2)

    let ratingResults = calcEloMatch(rating1, rating2, result, kFactor)
    let team1Delta = ratingResults.rating1 - rating1

    updateTeamRatings(playerRatings, team1, rating1, team1Delta, startDate)
    updateTeamRatings(playerRatings, team2, rating2, -team1Delta, startDate)
}

function updateTeamRatings(playerRatings, team, originalRating, delta, startDate) {
    for (let playerId of team.players) {
        if (!Common.isValidGuid(playerId)) {
            continue
        }

        let playerData = Common.getOriginalPlayerData(playerId)
        let originalPlayerId = playerData.key

        let ratingData = playerRatings[originalPlayerId]
        // let rating = ratingData && ratingData.rating || startingElo
        // let weight = rating / originalRating / team.players.length
        let weight = 1 / team.players.length

        if (ratingData !== undefined) {
            ratingData.rating = Math.max(1, ratingData.rating + weight * delta)
            ++ratingData.matchCount

            if (ratingData.rating > ratingData.highestRating) {
                ratingData.highestRating = ratingData.rating
                ratingData.highestRatingDate = startDate
            }
        } else {
            playerRatings[originalPlayerId] = {
                fullName: Common.getFullNameFromPlayerData(playerData),
                rating: startingElo + weight * delta,
                matchCount: 1,
                highestRating: startingElo + weight * delta,
                highestRatingDate: startDate,
                highestRank: -1,
                highestRankDate: startDate
            }
        }
    }
}

function calcTeamElo(playerRatings, team) {
    let elo = 0
    let numPlayers = 0
    for (let playerId of team.players) {
        let playerData = Common.getOriginalPlayerData(playerId)
        if (playerData !== undefined) {
            let player = playerRatings[playerData.key]
            if (player !== undefined) {
                elo += player.rating
            } else {
                elo += startingElo
            }

            ++numPlayers
        }
    }

    return elo / numPlayers

    // let ratings = []
    // for (let playerId of team.players) {
    //     let player = playerRatings[playerId]
    //     if (player !== undefined) {
    //         ratings.push(player.rating)
    //     } else {
    //         ratings.push(startingElo)
    //     }
    // }

    // ratings = ratings.sort((a, b) => b - a)
    // let count = 0
    // for (let i = 0; i < ratings.length; ++i) {
    //     let weight = i + 1
    //     elo += ratings[i] * weight
    //     count += weight
    // }

    // return elo / count
}

function calcEloMatch(rating1, rating2, result, kFactor) {
    // -1 means player1 won, 1 means player2 won, 0 means draw
    let r1 = Math.pow(10, rating1 / 400)
    let r2 = Math.pow(10, rating2 / 400)
    let e1 = r1 / (r1 + r2)
    let e2 = r2 / (r1 + r2)
    let s1 = result === 0 ? .5 : result > 0 ? 0 : 1
    let s2 = result === 0 ? .5 : result > 0 ? 1 : 0

    return {
        rating1: rating1 + kFactor * (s1 - e1),
        rating2: rating2 + kFactor * (s2 - e2)
    }
}

Common.downloadPointsData = async function(version) {
    let pointsTypes = [ "ranking-open", "ranking-women", "rating-open" ]
    for (let type of pointsTypes) {
        let filename = `${type}_${version}`
        if (MainStore.cachedPointsData[filename] !== undefined) {
            continue
        }

        await Common.fetchEx("GET_POINTS_DATA", {
            key: filename
        }, {}, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then((data) => {
            if (filename.startsWith("ranking")) {
                for (let player of data.data) {
                    player.points = Math.round(player.points)
                    for (let i = 0; i < MainStore.topRankingResultsCount && i < player.pointsList.length; ++i) {
                        let resultData = MainStore.resultsData[player.pointsList[i].resultsId]
                        player[`event${i + 1}`] = `${resultData.eventName}, ${resultData.divisionName}: ${Math.round(player.pointsList[i].points)}`
                    }
                }

                MainStore.cachedPointsData[filename] = data.data
            } else {
                let rank = 1
                for (let player of data.data) {
                    player.rating = Math.round(player.rating)
                    player.highestRating = Math.round(player.highestRating)
                    player.rank = rank++
                }

                MainStore.cachedPointsData[filename] = data.data
            }
        }).catch((error) => {
            console.error(`Failed to download Manifest data: ${error}`)
        })
    }
}

Common.createEvent = function(eventName, startDate, endDate) {
    let newEventId = uuidv4()
    return Common.fetchEx("SET_EVENT_SUMMARY", {
            eventId: newEventId
    }, {}, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            eventName: eventName,
            startDate: this.getDateString(startDate),
            endDate: this.getDateString(endDate)
        })
    })
}

export default Common
