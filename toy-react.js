export class Component {
    constructor () {
        this.props = Object.create(null)
        this.children = []
        this._root = null
    }

    setAttribute (name, value) {
        this.props[name] = value
    }

    appendChild(component) {
        this.children.push(component)
    }

    get root () {
        if (!this._root) {
            this._root = this.render().root
        }
        return this._root
    }
}

class ElementWrapper {
    constructor (type) {
        this.root = document.createElement(type)
    }

    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }

    appendChild(component) {
        this.root.appendChild(component.root)
    }
}

class TextWrapper {
    constructor (content) {
        this.root = document.createTextNode(content)
    }
}

export function render (component, parentEle) {
    debugger
    parentEle.appendChild(component.root)
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