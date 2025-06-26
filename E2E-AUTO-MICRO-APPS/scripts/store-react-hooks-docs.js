#!/usr/bin/env node
/**
 * Script to store React Hooks documentation in Memory-Bank
 */

const context7Hook = require('../modules/integrations/context7-memory-hook');
const MemoryIntegration = require('../modules/memory-integration');

// The documentation content we want to store
const reactHooksDocs = `
# React Hooks Documentation

## Overview

React Hooks are functions that let you "hook into" React state and lifecycle features from function components.
Hooks allow you to reuse stateful logic without changing your component hierarchy.

## Basic Hooks

### useState

\`\`\`javascript
const [state, setState] = useState(initialState);
\`\`\`

- Returns a stateful value and a function to update it
- The update function can accept a new value or a function that returns a new value based on the previous one

### useEffect

\`\`\`javascript
useEffect(() => {
  // Side effects code
  return () => {
    // Clean up code
  };
}, [dependencies]);
\`\`\`

- Performs side effects in function components
- Runs after every render by default, or when dependencies change
- Optional cleanup function can be returned

### useContext

\`\`\`javascript
const value = useContext(MyContext);
\`\`\`

- Accepts a context object and returns the current context value
- Always re-renders when the context value changes

## Additional Hooks

### useReducer

\`\`\`javascript
const [state, dispatch] = useReducer(reducer, initialArg, init);
\`\`\`

- Alternative to useState for complex state logic
- Preferred when state transitions depend on the previous state

### useCallback

\`\`\`javascript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
\`\`\`

- Returns a memoized callback function
- Only changes if one of the dependencies has changed

### useMemo

\`\`\`javascript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
\`\`\`

- Returns a memoized value
- Only recomputes the value when one of the dependencies has changed

### useRef

\`\`\`javascript
const refContainer = useRef(initialValue);
\`\`\`

- Returns a mutable ref object
- The .current property is initialized to the passed argument
- Persists for the full lifetime of the component

### useId

\`\`\`javascript
const id = useId();
\`\`\`

- Generates a unique ID for accessibility attributes
- New in React 18

### useTransition

\`\`\`javascript
const [isPending, startTransition] = useTransition();
\`\`\`

- Marks updates as transitions to avoid blocking the UI
- New in React 18

### useDeferredValue

\`\`\`javascript
const deferredValue = useDeferredValue(value);
\`\`\`

- Defers updating a part of the UI
- New in React 18

## Rules of Hooks

1. Only call hooks at the top level
2. Only call hooks from React function components or custom hooks
3. Name custom hooks starting with "use"

## Custom Hooks

You can create your own hooks to reuse stateful logic between different components:

\`\`\`javascript
function useCustomHook(initialValue) {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    // Custom side effects
  }, [value]);
  
  return { value, setValue };
}
\`\`\`
`;

async function storeReactHooksDocs() {
  console.log('📚 Storing React Hooks documentation in Memory-Bank...');
  
  try {
    // Initialize memory integration
    const memoryIntegration = new MemoryIntegration();
    await memoryIntegration.bootstrap();
    
    // Store the documentation
    const libraryId = 'facebook/react';
    const topic = 'hooks';
    
    const stored = await context7Hook.storeDocumentation(
      libraryId,
      topic,
      reactHooksDocs,
      { source: 'manual-input' }
    );
    
    if (stored) {
      console.log('✅ Documentation successfully stored in Memory-Bank');
      
      // Verify the stored documentation
      const storedDocs = await context7Hook.retrieveDocumentation(libraryId, topic);
      
      if (storedDocs) {
        console.log('✅ Documentation successfully retrieved from Memory-Bank');
        console.log(`\nDocumentation size: ${storedDocs.content.length} characters`);
        
        // List all documentation in the system
        const allDocs = await context7Hook.listLibraryDocumentation();
        console.log(`\nAll documentation in Memory-Bank: ${allDocs.length} entries`);
        console.log(allDocs);
      } else {
        console.error('❌ Could not retrieve the stored documentation');
      }
    } else {
      console.error('❌ Failed to store documentation in Memory-Bank');
    }
  } catch (error) {
    console.error('Error storing documentation:', error);
  }
}

// Run the store function
storeReactHooksDocs().catch(console.error);
