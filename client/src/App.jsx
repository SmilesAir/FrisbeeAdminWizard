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

const landingPageId = 1

const Page = observer(class Page extends React.Component {
    constructor() {
        super()
    }

    getOptions() {
        let options = this.props.initData.options.map((data, index) => {
            return <button key={index} onClick={() => this.props.initData.callbacks.gotoPageCallback(data.targetId, data.moreInitData)}>{data.text}</button>
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
                <div className="header">
                    <h2>{this.props.initData.title}</h2>
                    <button>←</button>
                    <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
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
                <div className="header">
                    <h2>{this.props.initData.title}</h2>
                    <button>←</button>
                    <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                {this.state.message}
                <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
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
            <div>
                {widgets}
            </div>
        )
    }

    render() {
        return (
            <div className="pageTop">
                <div className="header">
                    <h2>{this.props.initData.title}</h2>
                    <button>←</button>
                    <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                {this.getPublishedWidgets()}
            </div>
        )
    }
})

const CreateEventPage = observer(class CreateEventPage extends React.Component {
    constructor(props) {
        super(props)

        this.moreInitData = this.props.initData.callbacks.getMoreInitData()

        this.state = {
            eventName: "",
            eventStartDate: new Date(),
            eventEndDate: new Date(),
            isCreating: false,
            message: ""
        }
    }

    getNextButton() {
        if (this.moreInitData !== undefined) {
            return <button onClick={() => this.moreInitData.nextPageCallback()}>{this.moreInitData.nextPageText}</button>
        }

        return null
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
        this.setState({ isCreating: true })

        Common.createEvent(this.state.eventName, this.state.eventStartDate, this.state.eventEndDate).then(() => {
            this.setState({
                 isCreating: false,
                 message: "Event created succesfully"
                 })
        }).catch((error) => {
            this.setState({
                 isCreating: false,
                 message: `Error creating event: ${error}`
                 })
        })
    }

    render() {
        return (
            <div className="pageTop">
                <div className="header">
                    <h2>{this.props.initData.title}</h2>
                    <button>←</button>
                    <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                <div>
                    <label>Event Name
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
                    <button disabled={this.state.isCreating} onClick={() => this.createEvent()}>{this.state.isCreating ? "Creating..." : "Create Event"}</button>
                    <div>{this.state.message}</div>
                </div>
                {this.getNextButton()}
            </div>
        )
    }
})

const EditEventPage = observer(class EditEventPage extends React.Component {
    constructor() {
        super()

        this.state = {
            message: "Publishing Rankings and Ratings..."
        }
    }

    render() {
        return (
            <div className="pageTop">
                <div className="header">
                    <h2>{this.props.initData.title}</h2>
                    <button>←</button>
                    <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                Event Name
            </div>
        )
    }
})

const SelectEventPage = observer(class SelectEventPage extends React.Component {
    constructor() {
        super()

        this.state = {
            message: "Publishing Rankings and Ratings..."
        }
    }

    getNextButton() {
        if (this.props.initData.nextPageCallback !== undefined) {
            return <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>{this.props.initData.nextPageText}</button>
        }

        return null
    }

    render() {
        return (
            <div className="pageTop">
                <div className="header">
                    <h2>{this.props.initData.title}</h2>
                    <button>←</button>
                    <button onClick={() => this.props.initData.callbacks.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                Events
                {this.getNextButton()}
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
                { targetId: 3, text: "Enter/Edit Results" },
                { targetId: 4, text: "Update Player Details" },
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
                    targetId: 6, text: "Create New Event",
                    moreInitData: {
                        nextPageCallback: () => this.onGotoPage(landingPageId),
                        nextPageText: "Return to Start"
                    }
                },
                {
                    targetId: 8, text: "Edit Exisiting Event Details",
                    
                }
            ],
            callbacks: callbacks
        }

        const createEvent = {
            title: "Create New Event",
            callbacks: callbacks
        }

        const editEvent = {
            title: "Edit Event Details",
            callbacks: callbacks,
        }

        const selectEvent = {
            title: "Select Event",
            callbacks: callbacks
        }

        this.pages = {
            [landingPageId]: <Page initData={landing}/>,
            2: <Page initData={publishRankingsLanding}/>,
            3: <PublishRankingsConfirmPage initData={publishConfirm}/>,
            4: <PublishRankingsHidePage initData={publishHide}/>,
            5: <Page initData={createEditEventLanding}/>,
            6: <CreateEventPage initData={createEvent}/>,
            7: <EditEventPage initData={editEvent}/>,
            8: <SelectEventPage initData={selectEvent}/>,
        }

        Common.downloadPlayerAndEventData()
    }

    onGotoPage(pageId, moreInitData) {
        this.setState({
            currentPageId: pageId,
            moreInitData: moreInitData
        })
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
