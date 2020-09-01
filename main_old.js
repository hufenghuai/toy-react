import {  createElement, render, Component } from './toy-react'
class MyComponent extends Component {

  constructor () {
    super()
    this.state = {
      name: 'name',
      value: 'value'
    }
  }

  render () {
    return <div>
      <h1>hfh</h1>
      <button onclick={() => {this.setState({name: this.state.name + this.state.value})}}>add</button>
      <span>{this.state.name}</span>
      <span>{this.state.value}</span>
      {this.children}
    </div>
  }
}

render(<MyComponent class="c" id="a">
  <div>aasdasd</div>
  <div></div>
  <div></div>
</MyComponent>, document.body)