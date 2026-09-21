---
title: "Transformer"
published: 2026-09-21
draft: true
---

Tokens <-> words
step1: associate each word with a high-dimensional vector(embedding)
the meaning of each word and its postion are encoded


# Aim of transformer
Adjust these embeddings so that they don't merely encode an individual word, but they bake much richer contextual meaning.

# Attention
## Single Head Attention
## Query, Key, Value
$W_Q$: the weight matrix for query
$W_K$: the weight matrix for key
$W_V$: the weight matrix for value
**Query**: represents the focused 'intent' of a token, encoding what specific information it is looking for rom other tokens in the sequence
**Key**: represents a 'label' or 'description' of a token, encoding its characteristics so that it can be matched against a Query
**Value**: represents the actual content or information of a token, which will be aggregated based on the attention scores

If a Query and a Key are closely related, the attention score(dot product of Q and K pairs) will be high, and the Value will be given more weight in the output. -> Attention pattern

Attend to: A attends to B means A is important to B to understand the context ->说反了？

## Attention Pattern Normalization
Softmax is used to normalize the attention scores (a dot product column) to a probability distribution, so that the sum of all attention scores is 1.

Before apply softmax, set all lower triangle values in Attention Matrix to -inf, so that the softmax result of these cells will be 0, but the column still stay normalized.

The size of the Attention Matrix is (sequence_length, sequence_length), where sequence_length is the number of words in the sequence. -> to the square of context size

$Attention(Q, K, V) = softmax(\frac{QK^T}{\sqrt{d_k}})V$

Maksing: don't allow later words to influence earlier words



## Multi-headed Attention

self-attention: Q, K, V are all from the same sequence
cross-attention: Q is from the decoder, K and V are from the encoder # 待确认
