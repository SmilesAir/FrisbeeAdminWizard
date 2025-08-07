/* eslint-disable react/prop-types */
import React, { useEffect } from "react"
import { observer } from "mobx-react"
import { observable, runInAction } from "mobx"
import DatePicker from "react-datepicker"
import "./App.css"
import "react-datepicker/dist/react-datepicker.css"

import MainStore from "./mainStore.js"
import Common from "./common.js"


if (import.meta.hot) {
    import.meta.hot.on(
      "vite:beforeUpdate",
      () => console.clear()
    );
}

history.pushState(null, null, window.location.href);
history.back();
window.onpopstate = () => history.forward()

const landingPageId = 1

function getHeaderWidget(props) {
    return (
        <div className="header">
            <div className="text">{props.initData.title}</div>
            <button>←</button>
            <button onClick={() => props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
        </div>
    )
}

const Page = observer(class Page extends React.Component {
    constructor() {
        super()
    }

    getOptions() {
        let options = this.props.initData.options.map((data, index) => {
            return <button className="optionButton" key={index} onClick={() => this.props.initData.callbacks.gotoPageCallback(data.targetId, data.moreInitData)}>{data.text}</button>
        })

        return (
            <div className="options">
                {options}
            </div>
        )
    }

    render() {
        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                {this.getOptions()}
            </div>
        )
    }
})

const PublishRankingsConfirmPage = observer(class PublishRankingsConfirmPage extends React.Component {
    constructor() {
        super()

        this.state = {
            message: "Publishing Rankings and Ratings..."
        }

        Common.publishRankingsAndRatings()

        setTimeout(() => {
            this.setState({ message: "Published Successful" })
        }, 1000)
    }

    render() {
        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                <div className="publishConfirmMessage">{this.state.message}</div>
            </div>
        )
    }
})

const PublishRankingsHidePage = observer(class PublishRankingsHidePage extends React.Component {
    constructor() {
        super()

        this.state = {
            publishList: []
        }
    }

    onHiddenChanged(data, e) {
        runInAction(() => {
            data.isHidden = !e.target.checked

            Common.setPointsDataIsHidden(data, !e.target.checked)
        })
    }

    getPublishedWidgets() {
        let sortedPublishings = []
        for (let publishData of Object.values(MainStore.publishedManifest)) {
            sortedPublishings.push(publishData)
        }
        sortedPublishings = sortedPublishings.sort((a, b) => {
            return Date.parse(b.date) - Date.parse(a.date)
        })
        let widgets = sortedPublishings.map((data, index) => {
            return (
                <div key={index} className="publishRankingWidget">
                    <div>{data.date}</div>
                    <div>{data.key.split("-")[0]}</div>
                    <div>{data.divisionName}</div>
                    <div>Is Visible?</div>
                    <input type="checkbox" checked={data.isHidden !== true} onChange={(e) => this.onHiddenChanged(data, e)}/>
                </div>
            )
        })

        return (
            <div className="publishedListWidget">
                {widgets}
            </div>
        )
    }

    render() {
        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                {this.getPublishedWidgets()}
            </div>
        )
    }
})

const CreateEditEventPage = observer(class CreateEditEventPage extends React.Component {
    constructor(props) {
        super(props)

        this.moreInitData = this.props.initData.callbacks.getMoreInitData()

        this.state = {
            eventName: this.moreInitData !== undefined ? this.moreInitData.eventData.eventName : "",
            eventStartDate: this.moreInitData !== undefined ? this.moreInitData.eventData.startDate : new Date(),
            eventEndDate: this.moreInitData !== undefined ? this.moreInitData.eventData.endDate : new Date(),
            isUploading: false,
            message: ""
        }
    }

    onStartDateChanged(e) {
        this.setState({ eventStartDate: new Date(e)})
    }

    onEndDateChanged(e) {
        this.setState({ eventEndDate: new Date(e)})
    }

    onEventNameChange(e) {
        this.setState({ eventName: e.target.value })
    }

    createEvent() {
        this.setState({ isUploading: true })

        Common.createEvent(this.state.eventName, this.state.eventStartDate, this.state.eventEndDate).then(() => {
            this.setState({
                 isUploading: false,
                 message: "Event created succesfully"
                 })
        }).catch((error) => {
            this.setState({
                 isUploading: false,
                 message: `Error creating event: ${error}`
                 })
        })
    }

    updateEvent() {
        this.setState({ isUploading: true })

        Common.uploadEvent(this.moreInitData.eventData.key, this.state.eventName, this.state.eventStartDate, this.state.eventEndDate).then(() => {
            this.setState({
                 isUploading: false,
                 message: "Event updated succesfully"
                 })
        }).catch((error) => {
            this.setState({
                 isUploading: false,
                 message: `Error updating event: ${error}`
                 })
        })
    }

    getUploadButton() {
        let buttonText = ""
        if (this.state.isUploading) {
            buttonText = this.props.initData.isCreate ? "Creating..." : "Updating..."
        } else {
            buttonText = this.props.initData.isCreate ? "Create Event" : "Update Event"
        }
        return <button disabled={this.state.isUploading} onClick={this.props.initData.isCreate ? () => this.createEvent() : () => this.updateEvent()}>{buttonText}</button>
    }

    render() {
        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                <div className="createEditEventWidget">
                    <label>
                        Event Name:
                        <input type="text" value={this.state.eventName} onChange={(e) => this.onEventNameChange(e)}/>
                    </label>
                    <label>
                        Start Date:
                        <DatePicker selected={this.state.eventStartDate} onChange={(e) => this.onStartDateChanged(e)}/>
                    </label>
                    <label>
                        End Date:
                        <DatePicker selected={this.state.eventEndDate} onChange={(e) => this.onEndDateChanged(e)}/>
                    </label>
                    {this.getUploadButton()}
                    <div>{this.state.message}</div>
                </div>
            </div>
        )
    }
})

const SelectEventPage = observer(class SelectEventPage extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            selectedEventData: undefined
        }

        this.moreInitData = this.props.initData.callbacks.getMoreInitData()
    }

    getNextButton() {
        if (this.moreInitData.nextPageCallback !== undefined) {
            return <button className="optionButton" disabled={this.state.selectedEventData === undefined} onClick={() => this.moreInitData.nextPageCallback({
                eventData: this.state.selectedEventData
            })}>{this.moreInitData.nextPageText}</button>
        }

        return null
    }

    selectEvent(data) {
        this.setState({ selectedEventData: data })
    }

    getEventsWidget() {
        let sortedEvents = Object.values(MainStore.eventData).sort((a, b) => {
            return Date.parse(b.startDate) - Date.parse(a.startDate)
        })
        let eventWidgets = sortedEvents.map((data, index) => {
            let style = this.state.selectedEventData === data ? {
                backgroundColor: "lightgreen"
            } : null
            return (
                <div className="eventWidget" style={style} key={index}>
                    <div>{data.eventName}: </div>
                    <div>{data.startDate}</div>
                    <div>→</div>
                    <div>{data.endDate}</div>
                    <button className="selectButton" onClick={() => this.selectEvent(data)}>Select</button>
                </div>
            )
        })

        return (
            <div className="eventListWidget">
                {eventWidgets}
            </div>
        )
    }

    render() {
        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                {this.getNextButton()}
                {this.getEventsWidget()}
            </div>
        )
    }
})

const SelectResultsRoundsPage = observer(class SelectResultsRoundsPage extends React.Component {
    constructor(props) {
        super(props)

        this.moreInitData = this.props.initData.callbacks.getMoreInitData()

        this.state = {
            rounds: [
                ["Open Pairs", false, false, false, false ],
                ["Open Coop", false, false, false, false ],
                ["Mixed Pairs", false, false, false, false ],
                ["Women Pairs", false, false, false, false ]
            ]
        }
    }

    onRoundCheckChanged(data, index, e) {
        runInAction(() => {
            data[index] = e.target.checked
            this.setState(this.state)
        })
    }

    getRoundsWidget() {
        let rows = this.state.rounds.map((data, index) => {
            return (
                <div className="round" key={index}>
                    <div className="division">{data[0]}: </div>
                    <div>
                        Finals:
                        <input type="checkbox" checked={data[1]} onChange={(e) => this.onRoundCheckChanged(data, 1, e)}/>
                    </div>
                    <div>
                        Semis:
                        <input type="checkbox" checked={data[2]} onChange={(e) => this.onRoundCheckChanged(data, 2, e)}/>
                    </div>
                    <div>
                        Quaters:
                        <input type="checkbox" checked={data[3]} onChange={(e) => this.onRoundCheckChanged(data, 3, e)}/>
                    </div>
                    <div>
                        Prelims:
                        <input type="checkbox" checked={data[4]} onChange={(e) => this.onRoundCheckChanged(data, 4, e)}/>
                    </div>
                </div>
            )
        })

        return (
            <div className="chooseRoundsWidget">
                <div className="desc">Select Rounds. Change be changed later</div>
                {rows}
            </div>
        )
    }

    getRoundCount(dataArray) {
        let roundCount = 0
        for (let i = 1; i < 5; ++i) {
            if (dataArray[i] !== true) {
                break
            }

            ++roundCount
        }

        return roundCount
    }

    getRoundStateObj() {
        return {
            pairs: this.getRoundCount(this.state.rounds[0]),
            coop: this.getRoundCount(this.state.rounds[1]),
            mixed: this.getRoundCount(this.state.rounds[2]),
            women: this.getRoundCount(this.state.rounds[3])
        }
    }

    render() {
        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                {this.getRoundsWidget()}
                <button className="optionButton" onClick={() => this.props.initData.callbacks.gotoPageCallback(11, {
                        rounds: this.getRoundStateObj(),
                        eventData: this.moreInitData.eventData
                    })}>Start Entering Results</button>
            </div>
        )
    }
})

const EditResultsPage = observer(class EditResultsPage extends React.Component {
    constructor(props) {
        super(props)

        this.moreInitData = this.props.initData.callbacks.getMoreInitData()
    }

    render() {
        let extraParams = ""
        if (this.moreInitData !== undefined) {
            if (this.moreInitData.eventData !== undefined) {
                let eventData = this.moreInitData.eventData
                extraParams += `&n=${eventData.eventName}&k=${eventData.key}&d=Open%20Pairs`
            }
            if (this.moreInitData.rounds !== undefined) {
                extraParams += `&r=${encodeURIComponent(JSON.stringify(this.moreInitData.rounds))}`
            }
        }

        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                <iframe src={"https://d508y3x9kgnlw.cloudfront.net/?v=2" + extraParams} style={{ border: "0" }} allow="clipboard-write"/>
            </div>
        )
    }
})

const EditPlayerPage = observer(class EditPlayerPage extends React.Component {
    constructor() {
        super()

        this.state = {
            message: "Publishing Rankings and Ratings..."
        }
    }

    render() {
        return (
            <div className="pageTop">
                {getHeaderWidget(this.props)}
                <iframe src="https://d2mkj2exs79ufw.cloudfront.net/?v=2" style={{ border: "0" }} allow="clipboard-write"/>
            </div>
        )
    }
})

const App = observer(class App extends React.Component {
    constructor() {
        super()

        this.state = {
            currentPageId: landingPageId
        }

        const callbacks = {
            gotoPageCallback: (id, moreInitData) => this.onGotoPage(id, moreInitData),
            getMoreInitData: () => this.getMoreInitData()
        }

        const landing = {
            title: "What do you want to do?",
            options: [
                { targetId: 5, text: "Create/Edit Event Details" },
                { targetId: 9, text: "Enter/Edit Results" },
                { targetId: 12, text: "Enter/Edit Player Details" },
                { targetId: 2, text: "Publish/Edit Rankings" }
            ],
            callbacks: callbacks
        }

        const publishRankingsLanding = {
            title: "Rankings and Ratings Options",
            options: [
                { targetId: 3, text: "Publish Rankings and Ratings for Open and Women for the last 2 years" },
                { targetId: 4, text: "Hide a published version of Ranking/Rating" }
            ],
            callbacks: callbacks
        }

        const publishConfirm = {
            title: "Rankings and Ratings",
            callbacks: callbacks
        }

        const publishHide = {
            title: "Manage Rankings and Ratings",
            callbacks: callbacks
        }

        const createEditEventLanding = {
            title: "Event Options",
            options: [
                {
                    targetId: 6, text: "Create New Event"
                },
                {
                    targetId: 8, text: "Edit Exisiting Event Details",
                    moreInitData: {
                        nextPageCallback: (moreInitData) => this.onGotoPage(7, moreInitData),
                        nextPageText: "Edit Event Details"
                    }
                }
            ],
            callbacks: callbacks
        }

        const createEvent = {
            title: "Create New Event",
            callbacks: callbacks,
            isCreate: true
        }

        const editEvent = {
            title: "Edit Event Details",
            callbacks: callbacks,
            isCreate: false
        }

        const selectEvent = {
            title: "Select Event",
            callbacks: callbacks
        }

        const resultsLanding = {
            title: "Manage Results",
            options: [
                {
                    targetId: 8, text: "Enter Event Results",
                    moreInitData: {
                        nextPageCallback: (moreInitData) => this.onGotoPage(10, moreInitData),
                        nextPageText: "Start Entering Results"
                    }
                },
                {
                    targetId: 8, text: "Edit Event Results",
                    moreInitData: {
                        nextPageCallback: (moreInitData) => this.onGotoPage(11, moreInitData),
                        nextPageText: "Start Editing Results"
                    }
                }
            ],
            callbacks: callbacks
        }

        const selectRounds = {
            title: "Select Rounds played in Event",
            callbacks: callbacks
        }

        const editResults = {
            title: "Edit Event Results",
            callbacks: callbacks
        }

        const editPlayer = {
            title: "Player Details Tool",
            callbacks: callbacks
        }

        this.pages = {
            [landingPageId]: <Page initData={landing}/>,
            2: <Page initData={publishRankingsLanding}/>,
            3: <PublishRankingsConfirmPage initData={publishConfirm}/>,
            4: <PublishRankingsHidePage initData={publishHide}/>,
            5: <Page initData={createEditEventLanding}/>,
            6: <CreateEditEventPage initData={createEvent}/>,
            7: <CreateEditEventPage initData={editEvent}/>,
            8: <SelectEventPage initData={selectEvent}/>,
            9: <Page initData={resultsLanding}/>,
            10: <SelectResultsRoundsPage initData={selectRounds}/>,
            11: <EditResultsPage initData={editResults}/>,
            12: <EditPlayerPage initData={editPlayer}/>,
        }

        Common.downloadPlayerAndEventData()
    }

    onGotoPage(pageId, moreInitData) {
        this.setState({
            currentPageId: pageId,
            moreInitData: moreInitData
        })

        if (pageId === landingPageId) {
            Common.downloadPlayerAndEventData()
        }
    }

    getMoreInitData() {
        return this.state.moreInitData
    }

    getCurrentPage() {
        return this.pages[this.state.currentPageId]
    }

    render() {
        return (
            <div className="wizardTop">
                <h2>Frisbee Admin Wizard</h2>
                {this.getCurrentPage()}
            </div>
        )
    }
})

export default App
