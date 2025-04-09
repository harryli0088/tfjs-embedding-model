import '@tensorflow/tfjs'
import * as use from '@tensorflow-models/universal-sentence-encoder';

export type ModelType = use.UniversalSentenceEncoder

export async function loadModel():Promise<ModelType> {
  return await use.load({
    modelUrl: import.meta.env.BASE_URL + 'model/model.json',
    vocabUrl: import.meta.env.BASE_URL + 'model/vocab.json',
  });
}

export async function embed(model:ModelType,inputs:string[]|string) {
  return await model.embed(inputs);
}