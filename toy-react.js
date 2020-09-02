const RENDER_TO_DOM = Symbol('render to dom')

function replaceRange (range, node) {
    range.insertNode(node)
    range.setStartAfter(node)

    range.deleteContents()

    range.setStartBefore(node)
    range.setEndAfter(node)
}

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
        this._vdom = this.vdom // 是一个get 所以回去执行get vdom 在get vdom中已经做了this.render()调用了， 所以下一步不需要再调用了
        this._vdom[RENDER_TO_DOM](range)// this.render()[RENDER_TO_DOM](range)
    }

    // get vchildren () {
    //     return this.children.map(child => child.vdom)
    // }

    get vdom () {
        // component会被继承 继承的构造会实现render方法
        return this.render().vdom
    }

    // rerender () {
    //     // 保存原始range
    //     const oldRange = this._range

    //     // 由于直接删除range 再创建新的range 会导致range插入到老的range中 就会出现每次点击少一格 所以要记录xinrange保证不会被插入到老range中
    //     const range = document.createRange()
    //     range.setStart(oldRange.startContainer, oldRange.startOffset)
    //     range.setEnd(oldRange.startContainer, oldRange.startOffset)
        
    //     this[RENDER_TO_DOM](range)

    //     // 由于创建新的range会被插入到老range中去，老range范围会变大 所以重新设置老的range的范围
    //     oldRange.setStart(range.endContainer, range.endOffset)
    //     oldRange.deleteContents()
    // }

    update () {
        const isSameNode = (oldNode, newNode) => {
            if (oldNode.type !== newNode.type) {
                return false
            }

            for(let name in newNode.props) {
                if (newNode.props[name] !== oldNode.props[name]) {
                    return false
                }

                if (Object.keys(newNode.props).length > Object.keys(oldNode.props).length) {
                    return false
                }

                if (newNode.type === '#tet=xt') {
                    return false
                }
            }
            
            return true
        }

        const update = (oldVNode, newVNode) => {
            // 1.type比对 2.props比对 3.childre比对
            if (isSameNode(oldVNode, newVNode)) {
                newVNode[RENDER_TO_DOM](oldVNode._range)
                return
            }
            newVNode._range = oldVNode._range

            let newChildren = newNode.vchildren
            let oldChildren = oldVNode.vchildren

            if (!newChildren || !newChildren.length) {
                return
            }

            let tailRange = oldChildren[oldChildren.length - 1]._range

            for (let index = 0; index < newChildren.length; index++) {
                let newChild = newChildren[index]
                let oldChild = oldChildren[index]
                if (index < oldChildren.length) {
                    update(oldChild, newChild)
                } else {
                    let range = document.createRange()
                    range.setStart(tailRange.endContainer, tailRange.endOffset)
                    range.setEnd(tailRange.endContainer, tailRange.endOffset)

                    newChild[RENDER_TO_DOM](range)

                    tailRange = range
                }
            }
        }

        let vdom = this.vdom
        update(this._vdom, vdom)

        // 默认经过update之后 DOM已经更新了, 所以此时缓存_vdom为更新后的vdom
        this._vdom = vdom
    }

    setState (newState) {
        const isObject = typeof this.state !== 'object'
        if (this.state === null || isObject) {
            this.state = newState
            this.update()
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

        this.update()
    }
}

class ElementWrapper extends Component {
    constructor (type) {
        super(type)
        this.type = type
        this.root = document.createElement(type)
    }

    // setAttribute (name, value) {
    //     if (name.match(/^on([\s\S]+)$/)) {
    //         console.log(1)
    //         this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    //     } else {
    //         if (name === 'className') {
    //             this.root.setAttribute('class', value)
    //         } else {
    //             this.root.setAttribute(name, value)
    //         }
    //     }
    // }

    // appendChild(component) {
    //     let range = document.createRange()
    //     range.setStart(this.root, this.root.childNodes.length)
    //     range.setEnd(this.root, this.root.childNodes.length)
    //     component[RENDER_TO_DOM](range)
    // }

    get vdom () {

        this.vchildren = this.children.map(child => child.vdom)

        return this
        // {
        //     type: this.type,
        //     props: this.props,
        //     children: this.children.map(child => child.vdom)
        // }
    }

    [RENDER_TO_DOM] (range) {
        this._range = range

        let root = document.createElement(this.type)

        for (const name in this.props) {
            const value = this.props[name]
            if (name.match(/^on([\s\S]+)$/)) {
               root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else {
                if (name === 'className') {
                    root.setAttribute('class', value)
                } else {
                    root.setAttribute(name, value)
                }
            }
        }

        if (!this.vchildren) {
            this.vchildren = this.children.map(child => child.vdom)
        }

        for (const child of this.vchildren) {
            let childRange = document.createRange()
            childRange.setStart(root, root.childNodes.length)
            childRange.setEnd(root, root.childNodes.length)
            child[RENDER_TO_DOM](childRange)
        }

        replaceRange(range, root)
    }
}

class TextWrapper extends Component {
    constructor (content) {
        super(content)
        this.content = content
        this.type = '#text'
    }

    get vdom () {
        return this
        // {
        //     type: '#text',
        //     content: this.content
        // }
    }

    [RENDER_TO_DOM] (range) {
        this.range = range
        let root = document.createTextNode(this. content)
        replaceRange(range, root)
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