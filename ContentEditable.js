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
  prevElement=null;

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
              currentPageEl.innerHTML = "<span><br></span>"
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
              currentPageEl.innerHTML = "<span><br></span>"
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
      let caretPos=selection.anchorNode.parentNode.clientHeight+selection.anchorNode.parentNode.offsetTop
      e.preventDefault()
      console.log("selection.anchorNode.parentNode",selection.anchorNode.parentNode)
      console.log("selection.anchorNode.clientHeight",selection.anchorNode.parentNode.clientHeight+selection.anchorNode.parentNode.offsetTop)
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
        let brElementContainer=null

        if(!selection.anchorNode.isEqualNode(currentPageEl)){
        originalEl=selection.anchorNode.parentNode;

        beforeElement=originalEl.cloneNode(true)
        console.log("originalEl",selection.anchorNode.parentNode)
        // console.log("beforeElementText",beforeElement.innerText.substr(0,selection.anchorOffset))
        beforeElementText=beforeElement.innerText.substr(0,selection.anchorOffset)
        textNode=document.createTextNode(beforeElementText)
        beforeElement.replaceChild(textNode,beforeElement.firstChild)
        // console.log("revised beforeElement",beforeElement)

        afterElement=originalEl.cloneNode(true)
        // console.log("afterElementText",afterElement.innerText.substr(selection.anchorOffset))
        afterElementText=afterElement.innerText.substr(selection.anchorOffset)
        textNode=document.createTextNode(afterElementText)
        afterElement.replaceChild(textNode,afterElement.firstChild)
        // console.log("revised afterElement",afterElement)

        brElementContainer=originalEl.cloneNode(true)
        brElement=document.createElement("br")
        brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

        currentPageEl.insertBefore(beforeElement,originalEl)
        currentPageEl.insertBefore(brElementContainer,originalEl)
        currentPageEl.insertBefore(afterElement,originalEl)
        currentPageEl.removeChild(originalEl)

        this.moveFocus(textNode, 0)
        }else{
          // console.log("******************************")
          // console.log("selection.anchorOffset",selection.anchorNode)
          // console.log("prevElement",this.prevElement)
          // brElementContainer=this.prevElement.cloneNode(true)
          // brElement=document.createElement("br")
          // brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

          // selection.anchorNode.insertBefore(brElementContainer,this.prevElement)
          


        }
        // console.log("selection.anchorOffset",selection.anchorOffset)
      }else if (selection.anchorOffset === 0){
        // console.log("enter pressed")
      e.preventDefault()

        // console.log("selection.anchorNode.parentNode",selection.anchorNode.parentNode)
        // console.log("selection.anchorNode",selection.anchorNode)
        // console.log("from start")

        originalEl=selection.anchorNode.parentNode;
        // console.log("originalEl",originalEl)
        if(!originalEl.isEqualNode(currentPageEl)){
        
        e.preventDefault()
        brElementContainer=originalEl.cloneNode(true)
        brElement=document.createElement("br")
        brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

        afterElement=originalEl.cloneNode(true)
        // console.log("afterElementText",afterElement.innerText.substr(selection.anchorOffset))
        afterElementText=afterElement.innerText
        textNode=document.createTextNode(afterElementText)
        afterElement.replaceChild(textNode,afterElement.firstChild)

        currentPageEl.insertBefore(brElementContainer,originalEl)
        currentPageEl.insertBefore(afterElement,originalEl)
        currentPageEl.removeChild(originalEl)

        this.moveFocus(textNode, 0)
        }else{
          console.log("selection.anchorOffset11111",selection.anchorNode)
          // console.log("create empty span")

          originalEl=selection.anchorNode;
          console.log("selection.anchorOffset11111",originalEl)

          brElementContainer=originalEl.cloneNode(true)
          brElement=document.createElement("br")
          brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

          currentPageEl.insertBefore(brElementContainer,originalEl)
        }

      }else{
        console.log("last case")
        e.preventDefault()
        originalEl=selection.anchorNode.parentNode;
        this.prevElement=originalEl;
        beforeElement=originalEl.cloneNode(true)
        // console.log("beforeElementText",beforeElement.innerText.substr(0,selection.anchorOffset))
        beforeElementText=beforeElement.innerText
        textNode=document.createTextNode(beforeElementText)
        beforeElement.replaceChild(textNode,beforeElement.firstChild)

        brElementContainer=originalEl.cloneNode(true)
        brElement=document.createElement("br")
        brElementContainer.replaceChild(brElement,brElementContainer.firstChild)

        currentPageEl.insertBefore(beforeElement,originalEl)
        currentPageEl.insertBefore(brElementContainer,originalEl)
        currentPageEl.removeChild(originalEl)
      }
      if(caretPos>=currentPageEl.clientHeight && currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop > currentPageEl.clientHeight){
        const nextEditableEl = document.getElementById("editable_u16b")
        nextEditableEl.focus()
      }
    }
  

    if(this.currentCaretPosition !== this.previousCaretPosition) {
      currentPageEl = this.getEl();
      console.log("currentEditableElHeight",currentPageEl)
      console.log("currentEditableElHeight",currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop)
      const currentPageElHeight = currentPageEl.clientHeight

      // Current Editable reference
      const currentEditableEl = document.getElementById(`editable_${this.props.page.id}`)
      let currentEditableElHeight = currentPageEl.lastChild ? currentPageEl.lastElementChild.offsetHeight + currentPageEl.lastElementChild.offsetTop: 0
     
      // Next Editable reference
      const nextEditableEl = document.getElementById("editable_u16b")
      const nextEditableElHeight = nextEditableEl.clientHeight
      
      let currentPageItem = []
      let nextPageItem = []
      
      if(currentEditableElHeight > currentPageElHeight) {
        
        let currentEditableElLastChild = currentEditableEl.lastElementChild
        let nextEditableElfirstChild = nextEditableEl.firstElementChild
        console.log("currentEditableElLastChild",currentEditableElLastChild)
        // console.log("nextEditableElfirstChild",nextEditableElfirstChild)

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
              const span = document.createElement("span");
              const textNode = document.createTextNode(nextPageText);
              span.appendChild(textNode)
              nextEditableEl.replaceChild(span, nextEditableElfirstChild)
            } else {
              const span = document.createElement("span");
              const textNode = document.createTextNode(nextPageText + nextEditableElfirstChild.innerText);
              span.appendChild(textNode)
              nextEditableEl.insertBefore(span, nextEditableElfirstChild)
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
    const { tagName ='span', html = "", innerRef, page, style, ...props } = this.props;

    return React.createElement(
      tagName,
      {
        ...props,
        ref: typeof innerRef === 'function' ? (current) => {
          innerRef(current)
          this.el.current = current
        } : innerRef || this.el,
        // onClick: this.emitKeyup,
        onInput: this.emitKeyup,
        onKeyDown: this.emitKeyup,
        contentEditable: !this.props.disabled,
        dangerouslySetInnerHTML: { __html:this.props.page.prev_page===null? ` <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>What is Lorem Ipsum?</span> 
  <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>Lorem Ipsum is simply dummy text of the printing and 
    typesetting industry. Lorem Ipsum has been the industry’s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type 
    specimen book. It has survived not only five centuries, but also the leap into </span> 
    <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>electronic</span> 
    <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '> typesetting, remaining essentially unchanged. 
      It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including version</span> 
      <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '>s</span> 
      <span style='font-weight: normal; color:rgb(0, 0, 0); font-family:Montserrat; line-height: 14.4pt; font-size: 12pt; '> of Lorem Ipsum.</span>
    `: html },
        style
      },
    this.props.children);
  }
}
