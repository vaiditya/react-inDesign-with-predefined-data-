import React, { Component } from "react";
import PropTypes from "prop-types"

export class Caret {
    /**
     * get/set caret position
     * @param {HTMLColletion} target 
     */
    constructor(target) {
        this.isContentEditable = target && target.contentEditable
        this.target = target
    }
    /**
     * get caret position
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Range}
     * @returns {number}
     */
    getPos() {
        // for contentedit field
        if (this.isContentEditable) {
            this.target.focus()
            let _range = document.getSelection().getRangeAt(0)
            let range = _range.cloneRange()
            range.selectNodeContents(this.target)
            range.setEnd(_range.endContainer, _range.endOffset)
            return range.toString().length;
        }
        // for texterea/input element
        return this.target.selectionStart
    }

    /**
     * set caret position
     * @param {number} pos - caret position
     */
    setPos(pos) {
        // for contentedit field
        if (this.isContentEditable) {
            this.target.focus()
            document.getSelection().collapse(this.target, pos)
            return
        }
        this.target.setSelectionRange(pos, pos)
    }
}

function normalizeHtml(str) {
  return str && str.replace(/&nbsp;|\u202F|\u00A0/g, ' ');
}

export default class ContentEditable extends Component {
  static propTypes = {
    html: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyUp: PropTypes.func,
    onKeyDown:  PropTypes.func,
    disabled: PropTypes.bool,
    tagName: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    innerRef: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func,
    ])
  }

  currentCaretPosition = 0;
  previousCaretPosition = 0;

  el = typeof this.props.innerRef === 'function' ? { current: null } : React.createRef();
  getEl = () => (this.props.innerRef && typeof this.props.innerRef !== 'function' ? this.props.innerRef : this.el).current;

  moveFocus = (el, position, start = true) => {
    let range = document.createRange();
    let sel = window.getSelection();
    range.setStart(el, position);
    range.collapse(start);
    sel.removeAllRanges();
    sel.addRange(range);
  }

 
  emitKeyup = (e) => {
   
    const currentPageEl = this.getEl();
    if (!currentPageEl) return;

    const selection = window.getSelection();
    console.log(selection)
    
    if(selection.anchorNode.offsetTop === undefined) {
      this.currentCaretPosition = selection.anchorNode.parentNode ? selection.anchorNode.parentNode.offsetTop + selection.anchorNode.parentNode.offsetHeight: 0
    } else {
      this.currentCaretPosition = selection.anchorNode ? selection.anchorNode.offsetTop + selection.anchorNode.offsetHeight: 0
    }
    // console.log("selection",selection)
    // console.log("this.currentCaretPosition",this.currentCaretPosition)
    if(e.keyCode === 8) {
      if(selection.anchorNode.offsetTop !== undefined && selection.anchorNode.offsetTop === 0) {
        e.preventDefault()
        const previousEditableEl = document.getElementById("editable_ucd")
        previousEditableEl.focus()
        this.moveFocus(previousEditableEl, previousEditableEl.childElementCount - 1, true)
      } else {
        if(selection.anchorNode.offsetTop === undefined) {
          console.log("parentNode: ", selection.anchorNode.parentNode.offsetTop)
          // if user have typed something and reached to the first line by erasing all the words
          if(selection.anchorOffset - 1 === 0 && selection.anchorNode.parentNode.offsetTop === 0) {
            e.preventDefault()
            const previousEditableEl = document.getElementById("editable_ucd")
            console.log("Remove node from child and append it to parent ...!")
            if(currentPageEl.childElementCount === 1) {
              currentPageEl.innerHTML = "<div><br></div>"
            } else {
              currentPageEl.removeChild(currentPageEl.firstChild)
            }
            previousEditableEl.focus()
            this.moveFocus(previousEditableEl, previousEditableEl.childElementCount, false)
          // if user have typed something and taken cursor back to start position on first line
          } else if(selection.anchorOffset - 1 === -1 && selection.anchorNode.parentNode.offsetTop === 0) {
            e.preventDefault()
            console.log("Remove text from behind the cursor and append it to the parent ...!")
            const previousEditableEl = document.getElementById("editable_ucd")
            const currentFirstChildNode = currentPageEl.firstChild
            previousEditableEl.appendChild(currentFirstChildNode)
            if(currentPageEl.childElementCount === 0) {
              currentPageEl.innerHTML = "<div><br></div>"
            }
            previousEditableEl.focus()
            this.moveFocus(previousEditableEl, previousEditableEl.childElementCount - 1, true)
          }
        } else {
          console.log("anchorNode: ", selection.anchorNode.offsetTop)
          // Not having any parent nodes : ideally first page of the document
          if(selection.anchorNode.offsetTop === 0) {
            e.preventDefault()
          }
        }
      }
    }
    if (e.keyCode===13){
    
      // e.preventDefault()
      console.log("selection.anchorNode.parentNode",selection.anchorNode.parentNode)
      console.log("selection.anchorNode",selection.anchorNode)
      console.log("selection.anchorOffset",selection.anchorOffset)

      if (selection.anchorOffset > 0 && selection.anchorOffset < selection.anchorNode.parentNode.innerText.length ){
      e.preventDefault()
        
        let originalEl=null
        let beforeElement=null
        let beforeElementText=null
        let afterElement=null
        let afterElementText=null
        let textNode=null 
        let brElement=null

        originalEl=selection.anchorNode.parentNode;

        beforeElement=originalEl.cloneNode(true)
        console.log("beforeElementText",beforeElement.innerText.substr(0,selection.anchorOffset))
        beforeElementText=beforeElement.innerText.substr(0,selection.anchorOffset)
        textNode=document.createTextNode(beforeElementText)
        beforeElement.replaceChild(textNode,beforeElement.firstChild)
        console.log("revised beforeElement",beforeElement)

        afterElement=originalEl.cloneNode(true)
        console.log("afterElementText",afterElement.innerText.substr(selection.anchorOffset))
        afterElementText=afterElement.innerText.substr(selection.anchorOffset)
        textNode=document.createTextNode(afterElementText)
        afterElement.replaceChild(textNode,afterElement.firstChild)
        console.log("revised afterElement",afterElement)

        currentPageEl.insertBefore(beforeElement,originalEl)
        currentPageEl.insertBefore(afterElement,originalEl)
        currentPageEl.removeChild(originalEl)

        this.moveFocus(textNode, 0)
        console.log("selection.anchorOffset",selection.anchorOffset)
      }else if (selection.anchorOffset === 0){
      // e.preventDefault()

        console.log("selection.anchorNode.parentNode",selection.anchorNode.parentNode)
        console.log("selection.anchorNode",selection.anchorNode)
        console.log("from start")

        originalEl=selection.anchorNode.parentNode;

        if(!originalEl.isEqualNode(currentPageEl)){
        
        e.preventDefault()
        beforeElement=originalEl.cloneNode(true)
        textNode=document.createElement("br")
        beforeElement.replaceChild(textNode,beforeElement.firstChild)

        afterElement=originalEl.cloneNode(true)
        console.log("afterElementText",afterElement.innerText.substr(selection.anchorOffset))
        afterElementText=afterElement.innerText
        textNode=document.createTextNode(afterElementText)
        afterElement.replaceChild(textNode,afterElement.firstChild)

        currentPageEl.insertBefore(beforeElement,originalEl)
        currentPageEl.insertBefore(afterElement,originalEl)
        currentPageEl.removeChild(originalEl)

        this.moveFocus(textNode, 0)
        }else{
          console.log("create empty div")
        }

      }else{
        console.log("last case")
      }

    }
  

    if(this.currentCaretPosition !== this.previousCaretPosition) {
      const currentPageElHeight = currentPageEl.clientHeight

      // Current Editable reference
      const currentEditableEl = document.getElementById(`editable_${this.props.page.id}`)
      let currentEditableElHeight = currentPageEl.lastChild ? currentPageEl.lastChild.offsetHeight + currentPageEl.lastChild.offsetTop: 0
     
      // Next Editable reference
      const nextEditableEl = document.getElementById("editable_u16b")
      const nextEditableElHeight = nextEditableEl.clientHeight
      
      let currentPageItem = []
      let nextPageItem = []

      if(currentEditableElHeight > currentPageElHeight) {
        console.log("length exceed")
        let currentEditableElLastChild = currentEditableEl.lastChild
        let nextEditableElfirstChild = nextEditableEl.firstChild

        if(this.currentCaretPosition > currentPageElHeight) {
          console.log("caret length exceed")
          if(currentEditableElLastChild.offsetHeight + currentEditableElLastChild.offsetTop > currentPageElHeight && currentEditableElLastChild.offsetTop < currentPageElHeight) {
            const currentPageItem = currentEditableElLastChild.innerText.split(" ")
            const lastEditableModifiedText = currentPageItem.pop()
            nextPageItem.unshift(lastEditableModifiedText)
            console.log("removed",lastEditableModifiedText)
            console.log("current",currentPageItem)
            
            currentEditableElLastChild.innerHTML = currentPageItem.join(" ")

            const nextPageText = nextPageItem.join("")
            
            if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
              const div = document.createElement("div");
              const textNode = document.createTextNode(nextPageText);
              div.appendChild(textNode)
              nextEditableEl.replaceChild(div, nextEditableElfirstChild)
            } else {
              const div = document.createElement("div");
              const textNode = document.createTextNode(nextPageText + nextEditableElfirstChild.innerText);
              div.appendChild(textNode)
              nextEditableEl.insertBefore(div, nextEditableElfirstChild)
              nextEditableEl.removeChild(nextEditableElfirstChild)
            }

            return this.moveFocus(textNode, nextPageText.length)
          }

          if(nextEditableElfirstChild.innerHTML === "<br>" && nextEditableEl.childElementCount === 1) {
            nextEditableEl.replaceChild(currentEditableElLastChild, nextEditableElfirstChild)
            nextEditableEl.focus()
          } else {
            nextEditableEl.insertBefore(currentEditableElLastChild, nextEditableElfirstChild)
            nextEditableEl.focus()
          } 

        } else {
          console.log("Move content to the next page")
          nextEditableEl.insertBefore(currentEditableElLastChild, nextEditableElfirstChild)
        }
      }
    }

    this.previousCaretPosition = this.currentCaretPosition
  }

  render() {
    const { tagName ='div', html = "", innerRef, page, style, ...props } = this.props;

    return React.createElement(
      tagName,
      {
        ...props,
        ref: typeof innerRef === 'function' ? (current) => {
          innerRef(current)
          this.el.current = current
        } : innerRef || this.el,
        onClick: this.emitKeyup,
        onInput: this.emitKeyup,
        onKeyDown: this.emitKeyup,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: { __html:this.props.page.prev_page===null? '<div id=1 style="color:red;">abc</div><div id=2 style="color:green;">adasdasd</div>': html },
        style
      },
    this.props.children);
  }
}
