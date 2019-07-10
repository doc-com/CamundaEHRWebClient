import React, { Component } from 'react'
import axios from 'axios'
import SanitizedHTML from 'react-sanitized-html'

let dat
const { Client, logger, Variables } = require('camunda-external-task-client-js')
const config = { baseUrl: 'http://54.84.23.201:8080/engine-rest', use: logger, asyncResponseTimeout: 10000 }
const client = new Client(config)

class TemplateForm extends Component {

    state = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXh0cmFkYXRhIjp7Im9yZ2FuaXphdGlvbiI6IjEyMzQ1NiIsIm9yZ191aWQiOiJlOWQxMzI5NC1iY2U3LTQ0ZTctOTYzNS04ZTkwNmRhMGM5MTQifSwiaXNzdWVkX2F0IjoiMjAxOS0wNy0wOVQyMDoxOToyNS42NDdaIn0=.ASjtM4SYDhc+P+mUzuLg92J8i/OppIrzC1fbSQg/vjQ=',
        templateId: '56b759fc-314f-4104-9db6-914ff78260ab',
        isLoading: false,
        html: '',
        task: '',
        taskService: ''
    }

    componentDidMount() {
        this.conectToTopic()
        dat = this
    }

    conectToTopic() {
        client.subscribe('form', async function ({ task, taskService }) {
            const data = task.variables.get('htmlForm')
            dat.setState({
                html: data.html,
                task: task,
                taskService: taskService
            })
        })
    }

    changeHandler = (e) => {
        const { value, name } = e.target
        this.setState({
            [name]: value
        })
    }

    submitHandler = e => {
        console.log(this.state.isLoading)
        this.setState({
            isLoading: true
        })
        console.log(this.state.isLoading)
        console.log(this.state.token)
        console.log(this.state.templateId)
        e.preventDefault()
        const body = {
            "variables": {
                "token": {
                    "value": this.state.token,
                    "type": "String"
                },
                "templateId": {
                    "value": this.state.templateId,
                    "type": "String"
                }
                // "templateFetchUrl": {
                //     "value": "http://3.89.210.6:8090/ehr/api/v1/templates/ad00f011-f43a-4098-868b-ceb4ee8fc770",
                //     "type": "String"
                // },
                // "xmlToHtmlUrl": {
                //     "value": "http://3.95.7.24:36527/opt2bundle/ad00f011-f43a-4098-868b-ceb4ee8fc770",
                //     "type": "String"
                // },
                // "storeContributionUrl": {
                //     "value": "https://samples.openweathermap.org/data/2.5/weather?q=London,uk&appid=b6907d289e10d714a6e88b30761fae22",
                //     "type": "String"
                // }
            }
        }
        axios.post('http://54.84.23.201:8080/engine-rest/process-definition/key/consultation/start', body)
            .then(response => {
                console.log(response)
            })
            .catch(error => {
                console.log(error)
            })
    }

    handleSubmit(event) {
        event.preventDefault()
        const form = event.target
        const data = new FormData(form)
        let results = {}
        for (let name of data.keys()) {
            if (document.getElementsByName(name)[0].type === "file") {
                console.log("Hola a todos")

                document.getElementsByName(name)[0].addEventListener('change', dat.handleFileSelect(), false)

                // var f = document.getElementsByName(name)
                // var fileName = f.data.fileName

                // results[name] = document.getElementsByName(name)[0].value
                // var canvas = document.createElement('CANVAS')
                // var img = document.createElement('img')
                // img.src = document.getElementsByName(name)[0].value
                // img.onload = function() {
                //     canvas.height = img.height
                //     canvas.width = img.width
                //     var dataURL = canvas.toDataURL('image/png')
                //     alert(dataURL)
                //     canvas = null
                // }
            } else {
                results[name] = document.getElementsByName(name)[0].value
            }
        }
        // dat.completeTask(results)
    }

    handleFileSelect(event) {
        const reader = new FileReader()
        reader.onload = dat.handleFileLoad()
        reader.readAsText(event.target.files[0])
    }

    handleFileLoad(event) {
        console.log(event);
        document.getElementById('fileContent').textContent = event.target.result;
    }


    async completeTask(data) {
        console.log(JSON.stringify(data))
        const processVariables = new Variables()
        processVariables.setTyped("answers", {
            value: JSON.stringify(data),
            type: "Json",
            valueInfo: {
                transient: true
            }
        })
        await dat.state.taskService.complete(dat.state.task, processVariables)
    }

    render() {
        const { token, templateId, isLoading, html } = this.state
        console.log("Esta cargando: ", isLoading)
        return (
            <>
                {this.state.html !== '' ? (
                    <form onSubmit={this.handleSubmit}>
                        <SanitizedHTML
                            allowedTags={false}
                            allowedAttributes={false}
                            html={html} />
                        <button className="btn btn-primary mt-4 mb-4">Enviar</button>
                    </form>
                ) : (
                        <div className="card">
                            <form onSubmit={this.submitHandler} className="card-body">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="token"
                                        className="form-control"
                                        value={token}
                                        onChange={this.changeHandler}
                                        placeholder="Auth Token"
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="templateId"
                                        className="form-control"
                                        value={templateId}
                                        onChange={this.changeHandler}
                                        placeholder="Template Id"
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading && (
                                        <i
                                            className="fa fa-refresh fa-spin"
                                            style={{ marginRight: "10px" }}
                                        />
                                    )}
                                    {isLoading && <span>Descargando formulario</span>}
                                    {!isLoading && <span>Descargar formulario</span>}
                                </button>
                            </form>
                        </div>
                    )}
            </>
        )
    }

}

export default TemplateForm