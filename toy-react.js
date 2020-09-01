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
        // 保存原始range
        const oldRange = this._range

        // 由于直接删除range 再创建新的range 会导致range插入到老的range中 就会出现每次点击少一格 所以要记录xinrange保证不会被插入到老range中
        const range = document.createRange()
        range.setStart(oldRange.startContainer, oldRange.startOffset)
        range.setEnd(oldRange.startContainer, oldRange.startOffset)
        
        this[RENDER_TO_DOM](range)

        // 由于创建新的range会被插入到老range中去，老range范围会变大 所以重新设置老的range的范围
        oldRange.setStart(range.endContainer, range.endOffset)
        oldRange.deleteContents()
    }

    setState (newState) {
        const isObject = typeof this.state !== 'object'
        if (this.state === null || isObject) {
            this.state = newState
            this.rerender()
            return
        }
        let merge = (oldState, newState) => {
            for (let key in newState) {
                if (oldState[key] === null || oldState[key] !== 'object') {
                    oldState[key] = newState[key]
                } else {
                    merge(oldState[key], newState[key])
                }
            }
        }

        merge(this.state, newState)

        this.rerender()
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
            if (name === 'className') {
                this.root.setAttribute('class', value)
            } else {
                this.root.setAttribute(name, value)
            }
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
        tar = new tagName()
    }
    
    for (const key in attributes) {
        tar.setAttribute(key, attributes[key])
    }
  
    const insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            }
            if (child === null) {
                continue
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