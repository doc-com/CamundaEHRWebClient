import React, { Component } from 'react'
import axios from 'axios'
import SanitizedHTML from 'react-sanitized-html'
import each from 'async/each';

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

    handleChange = e => {
        const { value, name } = e.target
        this.setState({
            [name]: value
        })
    }

    handleSubmit = e => {
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

        each(data.keys(), (name, next) => {
            var selection = document.getElementsByName(name)[0]
            let selectionClassName = selection.className.split(" ")
            let selectionFilter = selectionClassName.filter(name => name.includes("DV")).toString()
            if (selection.className === "DV_MULTIMEDIA") {
                let fileSelected = selection.files
                if (fileSelected.length > 0) {
                    let file = fileSelected[0]
                    let fileReader = new FileReader()
                    fileReader.onload = function () {
                        results[name] = {
                            type: selectionFilter,
                            value: {
                                data: fileReader.result.replace("data:image/png;base64,", ""),
                                type: file.type,
                                size: file.size
                            }
                        }
                        next()
                    }
                    fileReader.readAsDataURL(file);
                } else {
                    results[name] = { "type": selectionFilter, "value": "" }
                    next()
                }
            } else if (selection.className === "DV_CODED_TEXT form-control") {
                let value = selection.value
                let textValue = selection.options[selection.selectedIndex].innerText
                results[name] = { "type": selectionFilter, "value": { "code": value, "textValue": textValue } }
                next()
            } else {
                results[name] = { "type": selectionFilter, "value": selection.value }
                next()
            }
        }, (err) => {
            if (window.confirm("Estas seguro de enviar el formulario?")) {
                dat.completeTask(results)
            }
        })
    }

    completeTask(results) {
        const meta = {
            "system_id": "DOC.COM",
            "committer_name": "Dr. Vergas",
            "composer_id": "c8915ebf-0bee-4980-a7d7-5f204c4e1f01",
            "composer_name": "DOC COMPOSER",
            "composition_setting_value": "COMPOSITION SETTING VALUE",
            "composition_setting_code": "COMPOSITION SETTING CODE"
        }
        let value = { meta, data: results }
        const processVariables = new Variables()
        processVariables.setTyped("answers", {
            value: JSON.stringify(value),
            type: "Json",
            valueInfo: {
                transient: true
            }
        })
        dat.state.taskService.complete(dat.state.task, processVariables)
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
                            <form onSubmit={this.handleSubmit} className="card-body">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="token"
                                        className="form-control"
                                        value={token}
                                        onChange={this.handleChange}
                                        placeholder="Auth Token"
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="templateId"
                                        className="form-control"
                                        value={templateId}
                                        onChange={this.handleChange}
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