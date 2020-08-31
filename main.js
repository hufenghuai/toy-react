import {  createElement, render, Component } from './toy-react'
class MyComponent extends Component {
  render () {
    return <div>
      <h1>hfh</h1>
      {this.children}
    </div>
  }
}

render(<MyComponent class="c" id="a">
  <div>aasdasd</div>
  <div></div>
  <div></div>
</MyComponent>, document.body)