import { useEffect, useReducer } from 'react'

import { scaleLinear } from "d3"

import { Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap'

import { useQuery } from '@tanstack/react-query'

import { useDebounce } from 'use-debounce'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

import { cosineSimilarity } from './utils/cosineSimilarity'
import { embed, loadModel } from './utils/model'
import { round } from './utils/round'

import './App.css'


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
    "The quick brown fox jumped over the lazy dog",
    "The fast orange fox lept over the sluggish dog",
    "I love Monday morning meetings",
    "I love Friday afternoon meetings",
    "The Krusty Krab pizza is the best pizza",
    "Costco pizza is the best pizza",
    "Per my previous email...",
    "Did you even read my last email...",
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
    <div style={{overflowX:"hidden"}}>
      <header>
        <Container>
          <h1>In-Browser Text Embeddings with TensorFlow.js</h1>
          <p>What happens in the browser, stays in the browser.</p>

          <a href="https://github.com/harryli0088/tfjs-embedding-model" target="_blank"><FontAwesomeIcon icon={faGithub}/></a>
        </Container>
      </header>
      
      <Container>
        <br/>
        <br/>
        
        <p>This project demonstrates using a TensorFlow.js text embedding model (<a href="https://github.com/tensorflow/tfjs-models/tree/master/universal-sentence-encoder" target='_blank'>Universal Sentence Encoder</a>) directly in the browser with no external API calls. Having a TF.js model in the browser means your data stays in the browser. Normally TF.js will request the model weights and vocabulary from a Google-hosted CDN, but this project hosts those files locally.</p>
        <p>You can play around with the model by adding, editing, and removing input text strings. The cosine simliarity matrix visualizes the text embeddings similarity.</p>
        {modelIsLoading && <p>Loading model...</p>}
        {modelLoadError && <p>Loading model error: {modelLoadError.message}</p>}
      </Container>

      <div style={{padding:"1rem"}}>
        <Row>
          <Col sm={12} md={7}>
            <h4>Input Text</h4>
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
            <Button id="add-input-button" size="sm" onClick={() => inputsDispatch({type: "create"})}>Add input <FontAwesomeIcon icon={faPlus}/></Button>
            <br/>
            <br/>
          </Col>

          <Col sm={12} md={5}>
            <h4>Cosine Similarity Matrix</h4>
            {embeddingsAreLoading || (!matrix && !embeddingError) && <p>Loading embeddings...</p>}
            {embeddingError && <p>Embedding error: {embeddingError.message}</p>}
            {matrix && (
              <div>
                <div id="matrix-container">
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
                              return (
                                <td key={cellIndex} onMouseEnter={() => {
                                  highlightDispatch({type: "update",payload: [rowIndex, cellIndex]})
                                }} style={{
                                  color: rowIndex===cellIndex||cell<0.75 ? "#000" : "#fff",
                                  backgroundColor: rowIndex===cellIndex ? "#ddd" : colorScale(cell)
                                }}>{cell===1?cell:cell.toFixed(2)}</td>
                              )
                            }
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>


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
              </div>
            )}
          </Col>
        </Row>
      </div>

      <Container>
        <h4>Embeddings</h4>

        <p>These are some metrics about the embeddings tensor.</p>

        {embeddingsAreLoading && <p>Loading embeddings...</p>}
        {embeddingError && <p>Embedding error: {embeddingError.message}</p>}

        <pre>{embeddings?.toString(true)}</pre>
        <br/>
        <br/>
        <br/>
      </Container>

      <div id="footer">
        <Container>
          <br/>
          <p>This site is based off this <a href="https://github.com/tensorflow/tfjs-models/blob/master/universal-sentence-encoder/README.md" target="_blank">TensorFlow.js demo</a>.</p>
          <p><a href="https://github.com/harryli0088/tfjs-embedding-model" target="_blank">GitHub <FontAwesomeIcon icon={faGithub}/></a></p>
        </Container>
      </div>
    </div>
  )
}

export default App
