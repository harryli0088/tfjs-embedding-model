# Tensorflow.js Embedding Model

This project experiments with using a TF.js text embedding model in the browser.

Demo site: https://harryli0088.github.io/tfjs-embedding-model/

[![screenshot](public/screenshot.png)](https://harryli0088.github.io/tfjs-embedding-model/)

## Getting Started

1. Install the packages
```
npm i
```

2. Download the model data
```
wget -O public/model/model.json "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/model.json?tfjs-format=file"
wget -O public/model/vocab.json https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/vocab.json

wget -O public/model/group1-shard1of7 "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/group1-shard1of7?tfjs-format=file"
wget -O public/model/group1-shard2of7 "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/group1-shard2of7?tfjs-format=file"
wget -O public/model/group1-shard3of7 "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/group1-shard3of7?tfjs-format=file"
wget -O public/model/group1-shard4of7 "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/group1-shard4of7?tfjs-format=file"
wget -O public/model/group1-shard5of7 "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/group1-shard5of7?tfjs-format=file"
wget -O public/model/group1-shard6of7 "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/group1-shard6of7?tfjs-format=file"
wget -O public/model/group1-shard7of7 "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/group1-shard7of7?tfjs-format=file"

```

3. Run the development server
```
npm run dev
```