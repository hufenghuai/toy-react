const RENDER_TO_DOM = Symbol('render to dom')

export class Component {
    constructor () {
        this.props = Object.create(null)
        this.children = []
        this._root = null
        this._range = null
    }

    setAttribute (name, value) {
        this.props[name] = value
    }

    appendChild(component) {
        this.children.push(component)
    }

    [RENDER_TO_DOM] (range) {
        this._range = range
        this.render()[RENDER_TO_DOM](range)
    }

    rerender () {
        this._range.deleteContents()
        this[RENDER_TO_DOM](this._range)
    }
}

class ElementWrapper {
    constructor (type) {
        this.root = document.createElement(type)
    }

    setAttribute (name, value) {
        if (name.match(/^on([\s\S]+)$/)) {
            console.log(1)
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
        } else {
            this.props[name] = value
        }
    }

    appendChild(component) {
        let range = document.createRange()
        range.setStart(this.root, this.root.childNodes.length)
        range.setEnd(this.root, this.root.childNodes.length)
        component[RENDER_TO_DOM](range)
    }

    [RENDER_TO_DOM] (range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

class TextWrapper {
    constructor (content) {
        this.root = document.createTextNode(content)
    }

    [RENDER_TO_DOM] (range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

export function render (component, parentEle) {
    let range = document.createRange()
    range.setStart(parentEle, 0)
    range.setEnd(parentEle, parentEle.childNodes.length)
    component[RENDER_TO_DOM](range)
}

export function createElement (tagName, attributes, ...children) {
    let tar
    if (typeof tagName === 'string') {
        tar = new ElementWrapper(tagName)
    } else {
        tar = new tagName
    }
  
    for (const key in attributes) {
        tar.setAttribute(key, attributes[key])
    }
  
    const insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            } 
            if (typeof child === 'object' && child instanceof Array) {
                insertChildren(child)
            } else {
                tar.appendChild(child)
            }
        }
    }

    insertChildren(children)

    return tar
}