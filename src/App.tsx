import { useEffect, useReducer, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { embed, loadModel } from './utils/model'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'
import { Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons'
import { round } from './utils/round'
import { cosineSimilarity } from './utils/cosineSimilarity'
import { scaleLinear } from "d3"

type InputsActionType = {
  type: "create",
} | {
  type: "update",
  payload: {
    index: number,
    value: string,
  }
} | {
  type: "delete",
  payload: number,
}

function inputsReducer(state:string[], action:InputsActionType) {
  if (action.type === "create") {
    return [...state,""]
  }
  else if(action.type === "update") {
    const copy = state.slice()
    copy[action.payload.index] = action.payload.value
    return copy
  }
  else if(action.type === "delete") {
    const copy = state.slice()
    copy.splice(action.payload,1)
    return copy
  }
  throw Error('Unknown action.');
}



type HighlightAction = {
  type: "reset",
  payload: number,
} | {
  type: "update",
  payload: number[],
}

function highlightReducer(state:boolean[], action:HighlightAction) {
  if (action.type === "reset") {
    return new Array(action.payload)
  }
  else if(action.type === "update") {
    const copy = state.map(() => false)
    action.payload.forEach((idx) => copy[idx] = true)
    return copy
  }
  throw Error('Unknown action.');
}

const colorScale = scaleLinear([0,0.75,1],["rgb(255,255,255)","rgb(52, 152, 219)","rgb(40, 116, 166)"])

function App() {
  const { data: model, isLoading: modelIsLoading, error: modelLoadError } = useQuery({
    queryKey: [],
    queryFn: async () => {
      return await loadModel()
    },
    refetchInterval: Infinity,
    refetchOnWindowFocus: false,
  })

  const [inputs, inputsDispatch] = useReducer(inputsReducer,[
    "Why don't we take Bikini Bottom and push it somewhere else",
    "Why don't we take Bikini Bottom and push it over there",
    "Again from its brumal sleep, Wakens the ferine strain",
    "dfadfdfs",
    "potato potato",
    "The Krusty Krab pizza is the best pizza",
    "Costco pizza is the best pizza"
  ]);
  const [debouncedInputs] = useDebounce(inputs, 750);

  const { data: {embeddings, matrix}, isLoading: embeddingsAreLoading, error: embeddingError } = useQuery({
    queryKey: [modelIsLoading, debouncedInputs],
    queryFn: async () => {
      if(model) {
        const embeddings = await embed(model, debouncedInputs)

        const embeddingsArr = await embeddings.array()
        if(embeddingsArr) {
          const matrix = embeddingsArr.map((vector1) => {
            return embeddingsArr.map((vector2) => {
              return round(
                cosineSimilarity(vector1, vector2)
              )
            })
          })
          return {
            embeddings,
            matrix,
          }
        }
        else {
          return {
            embeddings,
            matrix: null,
          }
        }
      }
      return {
        embeddings: null,
        matrix: null,
      }
    },
    initialData: {embeddings: null, matrix: null},
    refetchInterval: Infinity,
    refetchOnWindowFocus: false,
  })

  const [highlight, highlightDispatch] = useReducer(highlightReducer,[]);
  useEffect(() => {
    highlightDispatch({type: "reset", payload: inputs.length})
  },[inputs])


  return (
    <div>
      <Container>
        <br/>
        <br/>
        <br/>
        <h1>Tensorflow.js Embedding Model</h1>
        <p>This project demonstrates using a Tensorflow.js text embedding model (<a href="https://github.com/tensorflow/tfjs-models/tree/master/universal-sentence-encoder" target='_blank'>Universal Sentence Encoder</a>) directly in the browser with no external API calls.</p>
        {modelIsLoading && <p>Loading model...</p>}
        {modelLoadError && <p>Loading model error: {modelLoadError.message}</p>}
      </Container>

      <Row style={{padding:"1rem"}}>
        <Col sm={12} md={7}>
          <h4>
            Input Text

            <Button size="sm" onClick={() => inputsDispatch({type: "create"})} style={{float:"right"}}>Add input <FontAwesomeIcon icon={faPlus}/></Button>
          </h4>
          <br/>
          <div style={{margin:"-0.5rem"}}>
            {inputs.map((value,index) => (
              <div key={index} className={`input-row ${highlight[index]?"highlight":""}`}>
                <p><b>{index+1}</b></p>
                <InputGroup size='sm'>
                  <Form.Control

                    onChange={(e) => {
                      inputsDispatch({
                        type: "update",
                        payload: {
                          index,
                          value: e.target.value,
                        }
                      })
                    }}
                    placeholder='Type your text here...'
                    value={value}
                  />
                  <Button variant='outline-secondary' onClick={() => inputsDispatch({
                    type: "delete",
                    payload: index,
                  })}><FontAwesomeIcon icon={faTimes}/></Button>
                </InputGroup>
              </div>
            ))}
          </div>
          <br/>
        </Col>

        <Col sm={12} md={5}>
          {matrix && (
            <>
              <h5>Cosine Similarity Matrix</h5>

              <table onMouseLeave={() => highlightDispatch({type: "reset", payload: inputs.length})}>
                <thead>
                  <tr>
                    <th onMouseEnter={() => highlightDispatch({type: "reset", payload: inputs.length})}/>
                    {matrix.map((_,colIndex) => {
                      return <th key={colIndex} onMouseEnter={() => {
                        highlightDispatch({type: "update",payload: [colIndex]})
                      }}>{colIndex + 1}</th>
                    })}
                  </tr>
                </thead>

                <tbody>
                  {matrix?.map((row, rowIndex) => {
                    return (
                      <tr key={rowIndex}>
                        <th onMouseEnter={() => {
                          highlightDispatch({type: "update",payload: [rowIndex]})
                        }}>{rowIndex + 1}</th>
                        {row.map((cell, cellIndex) => {
                          console.log(cell, colorScale(cell))
                          return (
                            <td key={cellIndex} onMouseEnter={() => {
                              highlightDispatch({type: "update",payload: [rowIndex, cellIndex]})
                            }} style={{
                              color: rowIndex===cellIndex||cell<0.75 ? "#000" : "#fff",
                              backgroundColor: rowIndex===cellIndex ? "#ddd" : colorScale(cell)
                            }}>{cell}</td>
                          )
                        }
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
          <br/>

          <p style={{marginBottom: 0}}><b>Color Scale:</b></p>
          <div id="legend">
            <b>0</b>
            &nbsp;
            <div id="legend-bar"/>
            &nbsp;
            <b>1</b>
          </div>
          <br/>
          <br/>
        </Col>
      </Row>

      <Container>
        <h5>Embeddings</h5>

        {embeddingsAreLoading && <p>Loading embeddings...</p>}
        {embeddingError && <p>Embedding error: {embeddingError.message}</p>}

        {/* {embeddings?.shape && <p>Tensor Shape: [{embeddings.shape[0]}, {embeddings.shape[1]}]</p>} */}
        <pre>{embeddings?.toString(true)}</pre>
        <br/>
        <br/>
        <br/>
      </Container>
    </div>
  )
}

export default App
