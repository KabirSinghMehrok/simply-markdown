import { setup, assign, fromPromise } from 'xstate';
import openRouterApiClient from './openRouterClient';

export const sentenceCompletionMachine = setup({
  actors: {
    invokeOpenRouterApi: fromPromise<string, { editorContent: string }>(
      ({ input }) => openRouterApiClient(input.editorContent)
    )
  },
  actions: {
    updateEditorContent: assign({
      editorContent: ({ event }) => event.value
    }),
    updateCompletion: assign({
      completion: ({ event }) => event.output
    }),
    updateError: assign({
      error: ({ event }) => event.error
    })
  }
}).createMachine({
  id: 'sentenceCompletion',
  initial: 'idle',
  context: {
    editorContent: '',
    completion: '',
    error: null as unknown,
  },
  states: {
    idle: {
      on: {
        TEXT_CHANGED: {
          actions: 'updateEditorContent'
        },
        COMPLETE_BUTTON_CLICKED: 'completing',
      },
    },
    completing: {
      invoke: {
        src: 'invokeOpenRouterApi',
        input: ({ context }) => ({ editorContent: context.editorContent }),
        onDone: {
          target: 'idle',
          actions: 'updateCompletion'
        },
        onError: {
          target: 'idle',
          actions: 'updateError'
        },
      },
    },
  },
});
