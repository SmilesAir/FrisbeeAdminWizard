/* eslint-disable react/prop-types */
import React, { useEffect } from "react"
import { observer } from "mobx-react"
import { observable, runInAction } from "mobx"
import "./App.css"

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
            return <button key={index} onClick={() => this.props.initData.gotoPageCallback(data.targetId)}>{data.text}</button>
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
                    <button onClick={() => this.props.initData.gotoPageCallback(landingPageId)}>Return to Start</button>
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
                    <button onClick={() => this.props.initData.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                {this.state.message}
                <button onClick={() => this.props.initData.gotoPageCallback(landingPageId)}>Return to Start</button>
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
                    <button onClick={() => this.props.initData.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                {this.getPublishedWidgets()}
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

        const landing = {
            title: "What do you want to do?",
            options: [
                { targetId: 2, text: "Create/Edit Event Details"},
                { targetId: 3, text: "Enter/Edit Results"},
                { targetId: 4, text: "Update Player Details"},
                { targetId: 2, text: "Publish/Edit Rankings"}
            ],
            gotoPageCallback: (id) => this.onGotoPage(id)
        }

        const publishRankingsLanding = {
            title: "Rankings and Ratings Options",
            options: [
                { targetId: 3, text: "Publish Rankings and Ratings for Open and Women"},
                { targetId: 4, text: "Hide a published version of Ranking/Rating"}
            ],
            gotoPageCallback: (id) => this.onGotoPage(id)
        }

        const publishConfirm = {
            title: "Rankings and Ratings",
            gotoPageCallback: (id) => this.onGotoPage(id)
        }

        const publishHide = {
            title: "Manage Rankings and Ratings",
            gotoPageCallback: (id) => this.onGotoPage(id)
        }

        this.pages = {
            [landingPageId]: <Page initData={landing}/>,
            2: <Page initData={publishRankingsLanding}/>,
            3: <PublishRankingsConfirmPage initData={publishConfirm}/>,
            4: <PublishRankingsHidePage initData={publishHide}/>
        }

        Common.downloadPlayerAndEventData()
    }

    onGotoPage(pageId) {
        this.setState({ currentPageId: pageId })
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
