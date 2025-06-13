/* eslint-disable react/prop-types */
import React, { useEffect } from "react"
import { observer } from "mobx-react"
import { observable, runInAction } from "mobx"
import "./App.css"

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
            return <button key={index} onClick={() => this.props.gotoPageCallback(data.targetId)}>{data.text}</button>
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
                    <button onClick={() => this.props.gotoPageCallback(landingPageId)}>Return to Start</button>
                </div>
                {this.getOptions()}
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
                { targetId: 5, text: "Publish/Edit Rankings"}
            ]
        }

        const page2 = {
            title: "Page 2",
            options: [
                { targetId: 1, text: "Goto Page 1"},
                { targetId: 3, text: "Goto Page 3"}
            ]
        }

        const page3 = {
            title: "Page 3",
            options: [
                { targetId: 1, text: "Goto Page 1"},
                { targetId: 2, text: "Goto Page 2"}
            ]
        }

        this.pages = {
            [landingPageId]: <Page initData={landing} gotoPageCallback={(id) => this.onGotoPage(id)}/>,
            2: <Page initData={page2} gotoPageCallback={(id) => this.onGotoPage(id)}/>,
            3: <Page initData={page3} gotoPageCallback={(id) => this.onGotoPage(id)}/>
        }
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
