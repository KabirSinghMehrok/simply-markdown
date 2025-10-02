import { useEffect, useRef } from 'react'
import './App.css'
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { exampleSetup } from "prosemirror-example-setup"
import { useMachine } from '@xstate/react';
import { sentenceCompletionMachine } from './sentenceCompletionMachine';


function App() {
  const editorRef = useRef<EditorView | null>(null);
  const [state, send] = useMachine(sentenceCompletionMachine);
  const editorObserverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log("XState context updated:", state.context.editorContent);
  }, [state.context.editorContent]);

  useEffect(() => {
    if (state.context.completion && editorRef.current) {
      const { state: editorState } = editorRef.current;
      const { tr } = editorState;
      const { from, to } = editorState.selection;
      tr.insertText(state.context.completion, from, to);
      editorRef.current.dispatch(tr);
    }
  }, [state.context.completion]);

  useEffect(() => {
    const editorNode = editorObserverRef.current;
    if (!editorNode) return;

    const addCompleteButton = (menubar: Element) => {
      if (menubar.querySelector('#complete-button')) return;

      const button = document.createElement('button');
      button.id = 'complete-button';
      button.type = 'button';
      button.innerHTML = 'Complete with AI';
      button.style = ""
      button.style.color = 'white';
      button.style.padding = '2px 10px';
      button.style.borderRadius = '5px';
      button.style.cursor = 'pointer';
      button.style.marginLeft = '10px';
      button.style.width = '140px'
      button.style.backgroundImage = 'linear-gradient(to right, #77A1D3 0%, #79CBCA  51%, #77A1D3  100%)';
      button.style.border = '0px';
      button.style.backgroundSize = '200% auto';
      button.style.transition = '0.5s';
      button.onmouseenter = () => {
        button.style.backgroundPosition = 'right center';
      }
      button.onmouseleave = () => {
        button.style.backgroundPosition = 'left center';
      }
      button.onclick = () => send({ type: 'COMPLETE_BUTTON_CLICKED' });
      menubar.appendChild(button);
    };

    const observer = new MutationObserver(() => {
      const menubar = editorNode.querySelector('.ProseMirror-menubar');
      if (menubar) {
        addCompleteButton(menubar);
      }
    });

    const menubar = editorNode.querySelector('.ProseMirror-menubar');
    if (menubar) {
      addCompleteButton(menubar);
    }

    observer.observe(editorNode, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const button = document.querySelector('#complete-button');
      if (button && button.parentNode) {
        button.parentNode.removeChild(button);
      }
    };
  }, [send]);

  useEffect(() => {
    const button = document.querySelector<HTMLButtonElement>('#complete-button');
    if (button) {
      button.disabled = state.matches('completing');
      button.textContent = state.matches('completing') ? 'Loading...' : 'Complete Sentence';
    }
  }, [state]);

  useEffect(() => {
    // Create a text-generation pipeline

    const initializeEditor = () => {
      const mySchema = new Schema({
        nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
        marks: schema.spec.marks
      })

      const editorElement = document.querySelector("#editor");
      const contentElement = document.querySelector("#content");

      if (!editorElement || !contentElement) {
        return;
      }

      editorRef.current = new EditorView(editorElement, {
        state: EditorState.create({
          doc: DOMParser.fromSchema(mySchema).parse(contentElement),
          plugins: exampleSetup({ schema: mySchema })
        }),
        dispatchTransaction: transaction => {
          if (!editorRef.current) return;
          const { state, transactions } = editorRef.current.state.applyTransaction(transaction);
          editorRef.current.updateState(state);

          if (transactions.some(tr => tr.docChanged)) {
            send({ type: 'TEXT_CHANGED', value: state.doc.textContent });
          }
        }
      })

      const initialContent = editorRef.current.state.doc.textContent;
      console.log("Initial content being sent from editor:", initialContent);
      send({ type: 'TEXT_CHANGED', value: initialContent });
    }

    initializeEditor();


    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
      }
    }
  }, [send])


  return (
    <div className="flex flex-col">
      <div id="content" style={{ display: 'none' }}>
        <p>Hello, this is the content</p>
      </div>
      <div id="editor" ref={editorObserverRef} />
    </div>
  )
}

export default App
