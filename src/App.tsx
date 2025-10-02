import { useEffect, useRef, useState } from 'react'
import './App.css'
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { exampleSetup } from "prosemirror-example-setup"


function App() {
  const editorRef = useRef(null);

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
        })
      })
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
      <button>Complete Sentence</button>
    </div>
  )
}

export default App
