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
  const editorRef = useRef(null);
  const [state, send] = useMachine(sentenceCompletionMachine);

  useEffect(() => {
    console.log("XState context updated:", state.context.editorContent);
  }, [state.context.editorContent]);

  useEffect(() => {
    if (state.context.completion) {
      const { state: editorState } = editorRef.current;
      const { tr } = editorState;
      const { from, to } = editorState.selection;
      tr.insertText(state.context.completion, from, to);
      editorRef.current.dispatch(tr);
    }
  }, [state.context.completion]);

  useEffect(() => {
    // Create a text-generation pipeline

    const initializeEditor = () => {
      const mySchema = new Schema({
        nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
        marks: schema.spec.marks
      })

      editorRef.current = new EditorView(document.querySelector("#editor"), {
        state: EditorState.create({
          doc: DOMParser.fromSchema(mySchema).parse(document.querySelector("#content")),
          plugins: exampleSetup({ schema: mySchema })
        }),
        dispatchTransaction: transaction => {
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
      editorRef.current.destroy()
    }
  }, [])


  return (
    <div className="flex flex-col">
      <div id="content" style={{ display: 'none' }}>
        <p>Hello, this is the content</p>
      </div>
      <div id="editor" />
      <button
        onClick={() => send({ type: 'COMPLETE_BUTTON_CLICKED' })}
        disabled={state.matches('completing')}
      >
        {state.matches('completing') ? 'Loading...' : 'Complete Sentence'}
      </button>
    </div>
  )
}

export default App
