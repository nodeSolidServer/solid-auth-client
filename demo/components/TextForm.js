// @flow
import React from 'react'

export default class TextForm extends React.Component {
  props: {
    label: string,
    onSubmit: (string) => any,
    onCancel: (Event) => any
  }

  state = {
    input: ''
  }

  updateInput = (event: Event & { target: EventTarget }) => {
    console.log(event)
    this.setState({ input: event.target.value })
  }

  handle = (handler: (input: string) => any) => (event: Event) => {
    event.preventDefault()
    handler(this.state.input)
  }

  render () {
    const onSubmit = this.handle(this.props.onSubmit)
    const onCancel = this.props.onCancel
    return (
      <form className='form-inline' onSubmit={onSubmit}>
        <div className='form-group'>
          <label>
            <span className='sr-only'>{this.props.label}</span>
            <input type='text' className='form-control' placeholder='https://solidtest.space' value={this.state.input} onChange={this.updateInput} />
          </label>
          <button type='submit' className='btn btn-primary' onClick={onSubmit}>Submit</button>
          <button type='cancel' className='btn btn-secondary' onClick={onCancel}>Cancel</button>
        </div>
      </form>
    )
  }
}
