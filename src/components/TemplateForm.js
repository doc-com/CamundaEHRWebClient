import React, { Component } from 'react'
import axios from 'axios'
import SanitizedHTML from 'react-sanitized-html'

let dat
const { Client, logger, Variables } = require('camunda-external-task-client-js')
const config = { baseUrl: 'http://54.84.23.201:8080/engine-rest', use: logger, asyncResponseTimeout: 10000 }
const client = new Client(config)

class TemplateForm extends Component {

    state = {
        token: '',
        templateId: '',
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

    changeHandler = e => {
        const { value, name } = e.target
        this.setState({
            [name]: value
        })
    }

    handlerSubmit = e => {
        e.preventDefault()
        this.setState({
            isLoading: true
        })
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
            }
        }
        axios.post('http://54.84.23.201:8080/engine-rest/process-definition/key/consultation/start', body)
            .then(response => {
                console.log(response)
            })
            .catch(error => {
                console.log(error)
                this.setState({
                    isLoading: false
                })
            })
    }

    submitForm(e) {
        e.preventDefault()
        const form = e.target
        const data = new FormData(form)
        let results = {}
        for (let name of data.keys()) {
            if (document.getElementsByName(name)[0].type === "file") {
                var filesSelected = document.getElementsByName(name)[0].files
                if (filesSelected.length > 0) {
                    var fileToLoad = filesSelected[0]
                    var fileReader = new FileReader()
                    fileReader.onload = function (fileLoadedEvent) {
                        var srcData = fileLoadedEvent.target.result.replace("data:image/png;base64,", "")
                        results[name] = srcData
                    }
                    fileReader.readAsDataURL(fileToLoad)
                } else {
                    results[name] = ""
                }
            } else {
                results[name] = document.getElementsByName(name)[0].value
            }
        }

        if (window.confirm("Estas seguro de enviar el formulario?")) {
            dat.completeTask(results)
        }
    }

    async completeTask(data) {
        const processVariables = new Variables()
        processVariables.setTyped("answers", {
            value: JSON.stringify(data),
            type: "Json",
            valueInfo: {
                transient: true
            }
        })
        await dat.state.taskService.complete(dat.state.task, processVariables)
        dat.cleanData()
    }

    cleanData() {
        dat.setState({
            token: '',
            templateId: '',
            isLoading: false,
            html: '',
            task: '',
            taskService: ''
        })
    }

    render() {
        const { token, templateId, isLoading, html } = this.state
        return (
            <>
                {this.state.html !== '' ? (
                    <form onSubmit={this.submitForm}>
                        <SanitizedHTML
                            allowedTags={false}
                            allowedAttributes={false}
                            html={html} />
                        <button className="btn btn-primary mt-4 mb-4">Enviar</button>
                    </form>
                ) : (
                        <div className="card">
                            <form onSubmit={this.handlerSubmit} className="card-body">
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