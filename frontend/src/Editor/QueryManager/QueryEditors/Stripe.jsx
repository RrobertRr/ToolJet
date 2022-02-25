import React from 'react';
import 'codemirror/theme/duotone-light.css';
import DOMPurify from 'dompurify';
import Select from 'react-select';
import { openapiService } from '@/_services';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

const operationColorMapping = {
  get: 'azure',
  post: 'green',
  delete: 'red',
  put: 'yellow',
};

class Stripe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingSpec: true,
    };
  }

  componentDidMount() {
    const queryParams = {
      path: this.props.options?.params?.path ?? {},
      query: this.props.options?.params?.query ?? {},
      request: this.props.options?.params?.request ?? {},
    };
    this.setState({
      loadingSpec: true,
      options: {
        ...this.props.options,
        params: queryParams,
      },
    });

    this.fetchOpenApiSpec();
  }

  fetchOpenApiSpec = () => {
    this.setState({ loadingSpec: true });

    openapiService
      .fetchSpecFromUrl('https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json')
      .then((response) => {
        response.text().then((text) => {
          const data = JSON.parse(text);
          this.setState({ specJson: data, loadingSpec: false });
        });
      });
  };

  changeOption(option, value) {
    this.setState({
      options: {
        ...this.state.options,
        [option]: value,
      },
    });
  }

  changeOperation = (value) => {
    const { name, operation } = value;
    const path = name;

    this.setState(
      {
        options: {
          ...this.state.options,
          path,
          operation,
          selectedOperation: this.state.specJson.paths[path][operation],
        },
      },
      () => {
        this.props.optionsChanged(this.state.options);
      }
    );
  };

  changeParam = (paramType, paramName, value) => {
    const options = this.state.options;
    const newOptions = {
      ...options,
      params: {
        ...options.params,
        [paramType]: {
          ...options.params[paramType],
          [paramName]: value,
        },
      },
    };

    this.setState({
      options: newOptions,
    });

    this.props.optionsChanged(newOptions);
  };

  removeParam = (paramType, paramName) => {
    const options = this.state.options;
    const newOptions = JSON.parse(JSON.stringify(options));
    options[paramName] = undefined;

    this.setState({
      options: newOptions,
    });

    this.props.optionsChanged(newOptions);
  };

  renderOperationOption = (props) => {
    const path = props.name || props.path;
    const operation = props.operation;
    if (path && operation) {
      return (
        <div className="row">
          <div className="col-auto" style={{ width: '60px' }}>
            <span className={`badge bg-${operationColorMapping[operation]}`}>{operation}</span>
          </div>

          <div className="col">
            <span>{path}</span>
          </div>
        </div>
      );
    } else {
      return 'Select an operation';
    }
  };

  computeOperationSelectionOptions = (paths) => {
    let options = [];

    for (const path of Object.keys(paths)) {
      for (const operation of Object.keys(paths[path])) {
        options.push({
          value: `${operation},${path}`,
          name: path,
          operation: operation,
        });
      }
    }

    return options;
  };

  render() {
    const { options, specJson, loadingSpec } = this.state;
    const selectedOperation = options?.selectedOperation;

    let pathParams = [];
    let queryParams = [];
    let requestBody = [];

    if (selectedOperation) {
      if (selectedOperation.parameters) {
        pathParams = selectedOperation.parameters.filter((param) => param.in === 'path');
        queryParams = selectedOperation.parameters.filter((param) => param.in === 'query');
      }

      if (selectedOperation.requestBody) {
        const requestType = Object.keys(selectedOperation.requestBody.content)[0];
        requestBody = selectedOperation.requestBody.content[requestType];
      }
    }

    const selectStyles = {
      container: (provided) => ({
        ...provided,
        width: '50%',
        height: 32,
      }),
      control: (provided) => ({
        ...provided,
        backgroundColor: this.props.darkMode ? '#2b3547' : '#fff',
        height: '32px!important',
        minHeight: '32px!important',
      }),
      valueContainer: (provided, _state) => ({
        ...provided,
        height: 32,
        marginBottom: '4px',
      }),
      indicatorsContainer: (provided, _state) => ({
        ...provided,
        height: 32,
      }),
      indicatorSeparator: (_state) => ({
        display: 'none',
      }),
      input: (provided) => ({
        ...provided,
        color: this.props.darkMode ? '#fff' : '#232e3c',
      }),
      menu: (provided) => ({
        ...provided,
        zIndex: 2,
        backgroundColor: this.props.darkMode ? 'rgb(31,40,55)' : 'white',
      }),
      option: (provided) => ({
        ...provided,
        backgroundColor: this.props.darkMode ? '#2b3547' : '#fff',
        color: this.props.darkMode ? '#fff' : '#232e3c',
        ':hover': {
          backgroundColor: this.props.darkMode ? '#323C4B' : '#d8dce9',
        },
      }),
      placeholder: (provided) => ({
        ...provided,
        color: this.props.darkMode ? '#fff' : '#808080',
      }),
      singleValue: (provided) => ({
        ...provided,
        color: this.props.darkMode ? '#fff' : '#232e3c',
      }),
    };

    const currentValue = {
      value: this.state.options?.operation + ',' + this.props.options?.path,
      name: this.props.options?.path,
      operation: this.props.options?.operation,
    };

    return (
      <div>
        {loadingSpec && (
          <div className="p-3">
            <div className="spinner-border spinner-border-sm text-azure mx-2" role="status"></div>
            Please wait whle we load the OpenAPI specification for Stripe.
          </div>
        )}

        {options && !loadingSpec && (
          <div className="mb-3 mt-2">
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label pt-2">Operation</label>
              </div>
              <div className="col stripe-operation-options" style={{ width: '90px', marginTop: 0 }}>
                <Select
                  className="stripe-operation-select mb-2"
                  options={this.computeOperationSelectionOptions(specJson.paths)}
                  formatOptionLabel={this.renderOperationOption}
                  onChange={(value) => this.changeOperation(value)}
                  placeholder="Select an operation"
                  styles={selectStyles}
                  value={currentValue}
                />

                {selectedOperation && (
                  <small
                    style={{ margintTop: '10px' }}
                    className="my-2"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedOperation.description) }}
                  />
                )}
              </div>
            </div>

            {selectedOperation && (
              <div className="row mt-2">
                {pathParams.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-muted">PATH</h5>
                    {pathParams.map((param) => (
                      <div className="row input-group my-1" key={param.name}>
                        <div className="col-4 field field-width-268">
                          <input type="text" value={param.name} className="form-control" placeholder="key" />
                        </div>
                        <div className="col-6 field" style={{ width: '300px' }}>
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params.path[param.name]}
                            mode="text"
                            placeholder={'value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('path', param.name, value)}
                            height={'36px'}
                            width="268px"
                          />
                        </div>
                        <span
                          className="btn-sm col-2 mt-2"
                          role="button"
                          onClick={() => this.removeParam('path', param.name)}
                        >
                          <svg
                            width="12"
                            height="13"
                            viewBox="0 0 12 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                              fill="#8092AC"
                            />
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {queryParams.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-muted">QUERY</h5>
                    {queryParams.map((param) => (
                      <div className="row input-group my-1" key={param.name}>
                        <div className="col-4 field field-width-268">
                          <input type="text" value={param.name} className="form-control" placeholder="key" disabled />
                        </div>
                        <div className="col-6 field" style={{ width: '300px' }}>
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params?.query[param.name] ?? ''}
                            mode="text"
                            placeholder={'value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('query', param.name, value)}
                            height={'36px'}
                            width="268px"
                          />
                        </div>
                        <span
                          className="btn-sm col-2 mt-2"
                          role="button"
                          onClick={() => this.removeParam('query', param.name)}
                        >
                          <svg
                            width="12"
                            height="13"
                            viewBox="0 0 12 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                              fill="#8092AC"
                            />
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {requestBody.schema.properties && (
                  <div className="mt-2">
                    <h5 className="text-muted">REQUEST BODY</h5>
                    {Object.keys(requestBody.schema.properties).map((param) => (
                      <div className="row input-group my-1" key={param.name}>
                        <div className="col-4 field field-width-268">
                          <input type="text" value={param} className="form-control" placeholder="key" disabled />
                        </div>
                        <div className="col-6 field" style={{ width: '300px' }}>
                          <CodeHinter
                            currentState={this.props.currentState}
                            initialValue={this.state.options.params?.request[param] ?? ''}
                            mode="text"
                            placeholder={'value'}
                            theme={this.props.darkMode ? 'monokai' : 'duotone-light'}
                            lineNumbers={false}
                            onChange={(value) => this.changeParam('request', param, value)}
                            height={'36px'}
                            width="268px"
                          />
                        </div>
                        <span
                          className="btn-sm col-2 mt-2"
                          role="button"
                          onClick={() => this.removeParam('request', param)}
                        >
                          <svg
                            width="12"
                            height="13"
                            viewBox="0 0 12 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.99931 6.97508L11.0242 12.0014L12 11.027L6.9737 6.00069L12 0.975767L11.0256 0L5.99931 5.0263L0.974388 0L0 0.975767L5.02492 6.00069L0 11.0256L0.974388 12.0014L5.99931 6.97508Z"
                              fill="#8092AC"
                            />
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export { Stripe };
