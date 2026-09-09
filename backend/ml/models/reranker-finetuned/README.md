---
tags:
- sentence-transformers
- cross-encoder
- reranker
- generated_from_trainer
- dataset_size:648
- loss:BinaryCrossEntropyLoss
base_model: cross-encoder/ms-marco-MiniLM-L6-v2
pipeline_tag: text-ranking
library_name: sentence-transformers
metrics:
- accuracy
- accuracy_threshold
- f1
- f1_threshold
- precision
- recall
- average_precision
model-index:
- name: CrossEncoder based on cross-encoder/ms-marco-MiniLM-L6-v2
  results:
  - task:
      type: cross-encoder-binary-classification
      name: Cross Encoder Binary Classification
    dataset:
      name: val
      type: val
    metrics:
    - type: accuracy
      value: 0.9166666666666666
      name: Accuracy
    - type: accuracy_threshold
      value: 1.5791289806365967
      name: Accuracy Threshold
    - type: f1
      value: 0.7450980392156864
      name: F1
    - type: f1_threshold
      value: -0.06405091285705566
      name: F1 Threshold
    - type: precision
      value: 0.6551724137931034
      name: Precision
    - type: recall
      value: 0.8636363636363636
      name: Recall
    - type: average_precision
      value: 0.8150707023627065
      name: Average Precision
---

# CrossEncoder based on cross-encoder/ms-marco-MiniLM-L6-v2

This is a [Cross Encoder](https://www.sbert.net/docs/cross_encoder/usage/usage.html) model finetuned from [cross-encoder/ms-marco-MiniLM-L6-v2](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2) using the [sentence-transformers](https://www.SBERT.net) library. It computes scores for pairs of texts, which can be used for text reranking and semantic search.

## Model Details

### Model Description
- **Model Type:** Cross Encoder
- **Base model:** [cross-encoder/ms-marco-MiniLM-L6-v2](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2) <!-- at revision 233902d25c440f23af6f7d6e94d2946bac0bee0a -->
- **Maximum Sequence Length:** 512 tokens
- **Number of Output Labels:** 1 label
- **Supported Modality:** Text
<!-- - **Training Dataset:** Unknown -->
<!-- - **Language:** Unknown -->
<!-- - **License:** Unknown -->

### Model Sources

- **Documentation:** [Sentence Transformers Documentation](https://sbert.net)
- **Documentation:** [Cross Encoder Documentation](https://www.sbert.net/docs/cross_encoder/usage/usage.html)
- **Repository:** [Sentence Transformers on GitHub](https://github.com/huggingface/sentence-transformers)
- **Hugging Face:** [Cross Encoders on Hugging Face](https://huggingface.co/models?library=sentence-transformers&other=cross-encoder)

### Full Model Architecture

```
CrossEncoder(
  (0): Transformer({'transformer_task': 'sequence-classification', 'modality_config': {'text': {'method': 'forward', 'method_output_name': 'logits'}}, 'module_output_name': 'scores', 'architecture': 'BertForSequenceClassification'})
)
```

## Usage

### Direct Usage (Sentence Transformers)

First install the Sentence Transformers library:

```bash
pip install -U sentence-transformers
```

Then you can load this model and run inference.
```python
from sentence_transformers import CrossEncoder

# Download from the 🤗 Hub
model = CrossEncoder("cross_encoder_model_id")
# Get scores for pairs of inputs
pairs = [
    ['how does YouTube use Kafka and CDN in its video pipeline?', 'is cached when users actually request it - Examples: Cloudflare (default), Fastly, Akamai Push CDN (eager caching): - You proactively upload content to CDN before any user requests it - Useful for: new product launch (pre-populate before traffic spike), video releases - Netflix\'s Open Connect: Netflix pushes new movies to ISP CDN nodes overnight - You manage what\'s on the CDN — more control, more operational overhead - Examples: AWS CloudFront (can push), Netflix Open Connect Cache-Control Headers (How CDN Knows What to Cache): Origin server sets these HTTP response headers: Cache-Control: public, max-age=86400 - public: can be cached by CDN (vs private: only browser cache) - max-age=86400: cache for 86400 seconds (24 hours) Cache-Control: no-cache - Don\'t cache — always go to origin (or at least revalidate) Cache-Control: s-maxage=3600 - CDN-specific override: CDN caches for 1 hour (browser may cache differently) ETag / Last-Modified: - Origin includes ETag (hash of content) with response - CDN/browser can ask: "has this changed since ETag=abc123?" - Origin returns 304 Not Modified if unchanged (no body, saves bandwidth) - This is "conditional request" / cache revalidation Cache Invalidation (Hard Problem): "There are only two hard things in computer science: cache invalidation and naming things." — Phil Karlton Problem: you cached old.jpg for 24 hours. You upload new.jpg to same URL. Users see old version for 24 hours. Solutions: 1. URL-based versioning (best practice): - image.jpg?v=123 → changes to image.jpg?v=124 on update - Or: image-abc123hash.jpg (hash in filename) - Different URL = new cache entry = immediate update - Used by: webpack, Next.js, all modern build tools 2. CDN Purge API: - Explicitly invalidate specific URLs via API call - CDN marks cached version as stale, next request fetches from origin - AWS CloudFront: create invalidation request - Cloudflare: Purge Cache API - Can be slow (propagates across all edge nodes, minutes) - Cost: AWS charges per invalidation, Cloudflare allows free bulk invalidation 3. Short TTL: - Set max-age=300 (5 minutes) for content that changes frequently - User might see 5-minute-old version — acceptable trade-off - High-traffic news sites use this for article pages 4. Surrogate keys / Cache tags: - Tag cached objects with logical identifiers - Purge all objects with a tag in one API call - Fastly and Cloudflare support this - Example: tag all product images with product_id=123 → purge all on product update CDN for Video (Adaptive Bitrate Streaming): Video is the largest CDN workload (Netflix = 1/3 of US internet traffic). Video segmented into chunks (2-4 seconds each): - Each chunk at multiple quality levels (360p, 720p, 1080p, 4K) - Player requests chunks one by one, choosing quality based on current bandwidth - CDN caches each chunk individually - Popular videos: CDN hit rate near 100% (same chunks requested by millions) - Long-tail content: cache miss rate higher (rare videos not in cache) CDN for APIs (Edge Caching): Can you cache API responses? - GET /products (list): YES — same for everyone, cache 60 seconds - GET /products/123:'],
    ['How does Discord achieve real-time message delivery?', 'DISCORD SYSTEM DESIGN Sources: Discord Engineering Blog (discord.com/blog/engineering) Overview: Discord is a real-time communication platform primarily for gaming communities, now broadly used. Core features: text channels, voice calls, video calls, and servers (communities). Key challenges: (1) deliver messages in real-time to potentially millions of server members, (2) maintain low-latency voice/video calls, (3) store trillions of messages efficiently. Scale Numbers: - 500+ million registered users - 19+ million active servers (guilds) - 4 billion messages sent per day - Peak: 8.8 million concurrent voice/video users - Some servers have 500,000+ members (e.g., official game servers) Core Features: 1. Servers (guilds) with channels (text and voice) 2. Real-time text messaging in channels 3. Direct messages (DMs) between users 4. Voice channels (persistent, join anytime) 5. Video calls 6. Screen sharing The Core Problem — Real-Time Message Delivery: When a message is sent in a server with 100,000 members, it must be delivered in real-time to all active members. This is a massive fanout problem. Solution: Gateway Servers + Presence Gateway Servers: - Each user maintains a persistent WebSocket connection to a Gateway server - Gateway servers are stateful: they know which users are connected to them - User A sends message → Gateway receives → routes to Message Service → fanout to all relevant Gateway servers → those servers push to their connected users Presence Service: - Tracks which users are online and which Gateway they\'re connected to - Stored in Redis: user_id → {gateway_id, last_seen} - Updated when user connects/disconnects - Used for: online indicators, routing messages to correct gateway Message Delivery Flow: 1. User sends message via WebSocket to Gateway 2. Gateway forwards to Message Service via internal API 3. Message Service stores in Cassandra (persistent) 4. Message Service queries: which users are in this server and currently online? 5. Dispatch Service looks up each online user\'s Gateway from Presence Service 6. Sends message to appropriate Gateways 7. Each Gateway pushes message to connected user via WebSocket Message Storage: - Cassandra (Discord\'s primary choice for messages) - Partition key: channel_id (all messages in same channel on same partition) - Clustering key: message_id (time-ordered using Snowflake IDs) - This allows efficient queries: "get last 50 messages in channel X" = single partition scan - Discord stores trillions of messages — Cassandra handles this at scale Why Cassandra? - Write-heavy: billions of messages/day, Cassandra\'s LSM-tree optimized for writes - Time-series: messages naturally ordered by time, fits Cassandra\'s clustering key model - Scale: horizontally scalable, no single point of failure - Discord\'s 2023 migration: moved some data from Cassandra to ScyllaDB (Cassandra-compatible, faster) Discord and ScyllaDB (2023): - Discord migrated message history from Cassandra to ScyllaDB - ScyllaDB: Cassandra-compatible but written in C++ (vs Java) — lower latency, better hardware utilization - Result: 99th percentile latency dropped from 40ms to 15ms - Lesson: database choice matters at extreme scale Server (Guild) Architecture: A Discord "server" is not a physical server — it\'s a collection of channels and members. Guild metadata stored in PostgreSQL:'],
    ['How does Dropbox secure user files at rest and in transit?', '- Instagram ran on sharded PostgreSQL for years — proof SQL can scale Discord (Message Sharding): - Shard key: channel_id (all messages in same channel on same Cassandra partition) - This makes "get last N messages in channel" extremely fast — single partition read Twitter (Gizzard): - Custom sharding framework on top of MySQL - Shard key: user_id for users, tweet_id for tweets - Separate shard namespaces for users and tweets Uber (Schemaless): - Custom MySQL-based sharded storage - Shard key: UUID-based entity IDs - Cell-based architecture: each "cell" is an independent shard cluster MongoDB Sharding: - Built-in sharding via "shard key" in collection definition - Config servers store metadata (which shard has which key ranges) - Mongos router: receives queries, routes to appropriate shards - Chunk migration: moves data between shards automatically when imbalanced When to Shard: - Single server maxing out storage? Shard. - Single server maxing out CPU/connections? Consider read replicas first, then shard. - Need to comply with data residency? Geographic sharding. - Most queries can use shard key? Good for sharding. Cross-shard queries common? Bad for sharding. Alternatives to Sharding: 1. Read replicas: scale read-heavy workload without sharding complexity 2. Caching: reduce DB load with Redis/Memcached 3. Vertical scaling: get bigger server (limited but often the right first step) 4. CQRS: separate read and write models, optimize each independently 5. NoSQL: many NoSQL databases (Cassandra, DynamoDB) handle sharding automatically'],
    ['What challenges arise with cross-shard queries and transactions?', '- Instagram ran on sharded PostgreSQL for years — proof SQL can scale Discord (Message Sharding): - Shard key: channel_id (all messages in same channel on same Cassandra partition) - This makes "get last N messages in channel" extremely fast — single partition read Twitter (Gizzard): - Custom sharding framework on top of MySQL - Shard key: user_id for users, tweet_id for tweets - Separate shard namespaces for users and tweets Uber (Schemaless): - Custom MySQL-based sharded storage - Shard key: UUID-based entity IDs - Cell-based architecture: each "cell" is an independent shard cluster MongoDB Sharding: - Built-in sharding via "shard key" in collection definition - Config servers store metadata (which shard has which key ranges) - Mongos router: receives queries, routes to appropriate shards - Chunk migration: moves data between shards automatically when imbalanced When to Shard: - Single server maxing out storage? Shard. - Single server maxing out CPU/connections? Consider read replicas first, then shard. - Need to comply with data residency? Geographic sharding. - Most queries can use shard key? Good for sharding. Cross-shard queries common? Bad for sharding. Alternatives to Sharding: 1. Read replicas: scale read-heavy workload without sharding complexity 2. Caching: reduce DB load with Redis/Memcached 3. Vertical scaling: get bigger server (limited but often the right first step) 4. CQRS: separate read and write models, optimize each independently 5. NoSQL: many NoSQL databases (Cassandra, DynamoDB) handle sharding automatically'],
    ['what is the difference between CP and AP systems in distributed databases?', 'DISCORD SYSTEM DESIGN Sources: Discord Engineering Blog (discord.com/blog/engineering) Overview: Discord is a real-time communication platform primarily for gaming communities, now broadly used. Core features: text channels, voice calls, video calls, and servers (communities). Key challenges: (1) deliver messages in real-time to potentially millions of server members, (2) maintain low-latency voice/video calls, (3) store trillions of messages efficiently. Scale Numbers: - 500+ million registered users - 19+ million active servers (guilds) - 4 billion messages sent per day - Peak: 8.8 million concurrent voice/video users - Some servers have 500,000+ members (e.g., official game servers) Core Features: 1. Servers (guilds) with channels (text and voice) 2. Real-time text messaging in channels 3. Direct messages (DMs) between users 4. Voice channels (persistent, join anytime) 5. Video calls 6. Screen sharing The Core Problem — Real-Time Message Delivery: When a message is sent in a server with 100,000 members, it must be delivered in real-time to all active members. This is a massive fanout problem. Solution: Gateway Servers + Presence Gateway Servers: - Each user maintains a persistent WebSocket connection to a Gateway server - Gateway servers are stateful: they know which users are connected to them - User A sends message → Gateway receives → routes to Message Service → fanout to all relevant Gateway servers → those servers push to their connected users Presence Service: - Tracks which users are online and which Gateway they\'re connected to - Stored in Redis: user_id → {gateway_id, last_seen} - Updated when user connects/disconnects - Used for: online indicators, routing messages to correct gateway Message Delivery Flow: 1. User sends message via WebSocket to Gateway 2. Gateway forwards to Message Service via internal API 3. Message Service stores in Cassandra (persistent) 4. Message Service queries: which users are in this server and currently online? 5. Dispatch Service looks up each online user\'s Gateway from Presence Service 6. Sends message to appropriate Gateways 7. Each Gateway pushes message to connected user via WebSocket Message Storage: - Cassandra (Discord\'s primary choice for messages) - Partition key: channel_id (all messages in same channel on same partition) - Clustering key: message_id (time-ordered using Snowflake IDs) - This allows efficient queries: "get last 50 messages in channel X" = single partition scan - Discord stores trillions of messages — Cassandra handles this at scale Why Cassandra? - Write-heavy: billions of messages/day, Cassandra\'s LSM-tree optimized for writes - Time-series: messages naturally ordered by time, fits Cassandra\'s clustering key model - Scale: horizontally scalable, no single point of failure - Discord\'s 2023 migration: moved some data from Cassandra to ScyllaDB (Cassandra-compatible, faster) Discord and ScyllaDB (2023): - Discord migrated message history from Cassandra to ScyllaDB - ScyllaDB: Cassandra-compatible but written in C++ (vs Java) — lower latency, better hardware utilization - Result: 99th percentile latency dropped from 40ms to 15ms - Lesson: database choice matters at extreme scale Server (Guild) Architecture: A Discord "server" is not a physical server — it\'s a collection of channels and members. Guild metadata stored in PostgreSQL:'],
]
scores = model.predict(pairs)
print(scores)
# [ -5.4869   2.9462 -10.5288  -3.0322  -8.7832]

# Or rank different texts based on similarity to a single text
ranks = model.rank(
    'how does YouTube use Kafka and CDN in its video pipeline?',
    [
        'is cached when users actually request it - Examples: Cloudflare (default), Fastly, Akamai Push CDN (eager caching): - You proactively upload content to CDN before any user requests it - Useful for: new product launch (pre-populate before traffic spike), video releases - Netflix\'s Open Connect: Netflix pushes new movies to ISP CDN nodes overnight - You manage what\'s on the CDN — more control, more operational overhead - Examples: AWS CloudFront (can push), Netflix Open Connect Cache-Control Headers (How CDN Knows What to Cache): Origin server sets these HTTP response headers: Cache-Control: public, max-age=86400 - public: can be cached by CDN (vs private: only browser cache) - max-age=86400: cache for 86400 seconds (24 hours) Cache-Control: no-cache - Don\'t cache — always go to origin (or at least revalidate) Cache-Control: s-maxage=3600 - CDN-specific override: CDN caches for 1 hour (browser may cache differently) ETag / Last-Modified: - Origin includes ETag (hash of content) with response - CDN/browser can ask: "has this changed since ETag=abc123?" - Origin returns 304 Not Modified if unchanged (no body, saves bandwidth) - This is "conditional request" / cache revalidation Cache Invalidation (Hard Problem): "There are only two hard things in computer science: cache invalidation and naming things." — Phil Karlton Problem: you cached old.jpg for 24 hours. You upload new.jpg to same URL. Users see old version for 24 hours. Solutions: 1. URL-based versioning (best practice): - image.jpg?v=123 → changes to image.jpg?v=124 on update - Or: image-abc123hash.jpg (hash in filename) - Different URL = new cache entry = immediate update - Used by: webpack, Next.js, all modern build tools 2. CDN Purge API: - Explicitly invalidate specific URLs via API call - CDN marks cached version as stale, next request fetches from origin - AWS CloudFront: create invalidation request - Cloudflare: Purge Cache API - Can be slow (propagates across all edge nodes, minutes) - Cost: AWS charges per invalidation, Cloudflare allows free bulk invalidation 3. Short TTL: - Set max-age=300 (5 minutes) for content that changes frequently - User might see 5-minute-old version — acceptable trade-off - High-traffic news sites use this for article pages 4. Surrogate keys / Cache tags: - Tag cached objects with logical identifiers - Purge all objects with a tag in one API call - Fastly and Cloudflare support this - Example: tag all product images with product_id=123 → purge all on product update CDN for Video (Adaptive Bitrate Streaming): Video is the largest CDN workload (Netflix = 1/3 of US internet traffic). Video segmented into chunks (2-4 seconds each): - Each chunk at multiple quality levels (360p, 720p, 1080p, 4K) - Player requests chunks one by one, choosing quality based on current bandwidth - CDN caches each chunk individually - Popular videos: CDN hit rate near 100% (same chunks requested by millions) - Long-tail content: cache miss rate higher (rare videos not in cache) CDN for APIs (Edge Caching): Can you cache API responses? - GET /products (list): YES — same for everyone, cache 60 seconds - GET /products/123:',
        'DISCORD SYSTEM DESIGN Sources: Discord Engineering Blog (discord.com/blog/engineering) Overview: Discord is a real-time communication platform primarily for gaming communities, now broadly used. Core features: text channels, voice calls, video calls, and servers (communities). Key challenges: (1) deliver messages in real-time to potentially millions of server members, (2) maintain low-latency voice/video calls, (3) store trillions of messages efficiently. Scale Numbers: - 500+ million registered users - 19+ million active servers (guilds) - 4 billion messages sent per day - Peak: 8.8 million concurrent voice/video users - Some servers have 500,000+ members (e.g., official game servers) Core Features: 1. Servers (guilds) with channels (text and voice) 2. Real-time text messaging in channels 3. Direct messages (DMs) between users 4. Voice channels (persistent, join anytime) 5. Video calls 6. Screen sharing The Core Problem — Real-Time Message Delivery: When a message is sent in a server with 100,000 members, it must be delivered in real-time to all active members. This is a massive fanout problem. Solution: Gateway Servers + Presence Gateway Servers: - Each user maintains a persistent WebSocket connection to a Gateway server - Gateway servers are stateful: they know which users are connected to them - User A sends message → Gateway receives → routes to Message Service → fanout to all relevant Gateway servers → those servers push to their connected users Presence Service: - Tracks which users are online and which Gateway they\'re connected to - Stored in Redis: user_id → {gateway_id, last_seen} - Updated when user connects/disconnects - Used for: online indicators, routing messages to correct gateway Message Delivery Flow: 1. User sends message via WebSocket to Gateway 2. Gateway forwards to Message Service via internal API 3. Message Service stores in Cassandra (persistent) 4. Message Service queries: which users are in this server and currently online? 5. Dispatch Service looks up each online user\'s Gateway from Presence Service 6. Sends message to appropriate Gateways 7. Each Gateway pushes message to connected user via WebSocket Message Storage: - Cassandra (Discord\'s primary choice for messages) - Partition key: channel_id (all messages in same channel on same partition) - Clustering key: message_id (time-ordered using Snowflake IDs) - This allows efficient queries: "get last 50 messages in channel X" = single partition scan - Discord stores trillions of messages — Cassandra handles this at scale Why Cassandra? - Write-heavy: billions of messages/day, Cassandra\'s LSM-tree optimized for writes - Time-series: messages naturally ordered by time, fits Cassandra\'s clustering key model - Scale: horizontally scalable, no single point of failure - Discord\'s 2023 migration: moved some data from Cassandra to ScyllaDB (Cassandra-compatible, faster) Discord and ScyllaDB (2023): - Discord migrated message history from Cassandra to ScyllaDB - ScyllaDB: Cassandra-compatible but written in C++ (vs Java) — lower latency, better hardware utilization - Result: 99th percentile latency dropped from 40ms to 15ms - Lesson: database choice matters at extreme scale Server (Guild) Architecture: A Discord "server" is not a physical server — it\'s a collection of channels and members. Guild metadata stored in PostgreSQL:',
        '- Instagram ran on sharded PostgreSQL for years — proof SQL can scale Discord (Message Sharding): - Shard key: channel_id (all messages in same channel on same Cassandra partition) - This makes "get last N messages in channel" extremely fast — single partition read Twitter (Gizzard): - Custom sharding framework on top of MySQL - Shard key: user_id for users, tweet_id for tweets - Separate shard namespaces for users and tweets Uber (Schemaless): - Custom MySQL-based sharded storage - Shard key: UUID-based entity IDs - Cell-based architecture: each "cell" is an independent shard cluster MongoDB Sharding: - Built-in sharding via "shard key" in collection definition - Config servers store metadata (which shard has which key ranges) - Mongos router: receives queries, routes to appropriate shards - Chunk migration: moves data between shards automatically when imbalanced When to Shard: - Single server maxing out storage? Shard. - Single server maxing out CPU/connections? Consider read replicas first, then shard. - Need to comply with data residency? Geographic sharding. - Most queries can use shard key? Good for sharding. Cross-shard queries common? Bad for sharding. Alternatives to Sharding: 1. Read replicas: scale read-heavy workload without sharding complexity 2. Caching: reduce DB load with Redis/Memcached 3. Vertical scaling: get bigger server (limited but often the right first step) 4. CQRS: separate read and write models, optimize each independently 5. NoSQL: many NoSQL databases (Cassandra, DynamoDB) handle sharding automatically',
        '- Instagram ran on sharded PostgreSQL for years — proof SQL can scale Discord (Message Sharding): - Shard key: channel_id (all messages in same channel on same Cassandra partition) - This makes "get last N messages in channel" extremely fast — single partition read Twitter (Gizzard): - Custom sharding framework on top of MySQL - Shard key: user_id for users, tweet_id for tweets - Separate shard namespaces for users and tweets Uber (Schemaless): - Custom MySQL-based sharded storage - Shard key: UUID-based entity IDs - Cell-based architecture: each "cell" is an independent shard cluster MongoDB Sharding: - Built-in sharding via "shard key" in collection definition - Config servers store metadata (which shard has which key ranges) - Mongos router: receives queries, routes to appropriate shards - Chunk migration: moves data between shards automatically when imbalanced When to Shard: - Single server maxing out storage? Shard. - Single server maxing out CPU/connections? Consider read replicas first, then shard. - Need to comply with data residency? Geographic sharding. - Most queries can use shard key? Good for sharding. Cross-shard queries common? Bad for sharding. Alternatives to Sharding: 1. Read replicas: scale read-heavy workload without sharding complexity 2. Caching: reduce DB load with Redis/Memcached 3. Vertical scaling: get bigger server (limited but often the right first step) 4. CQRS: separate read and write models, optimize each independently 5. NoSQL: many NoSQL databases (Cassandra, DynamoDB) handle sharding automatically',
        'DISCORD SYSTEM DESIGN Sources: Discord Engineering Blog (discord.com/blog/engineering) Overview: Discord is a real-time communication platform primarily for gaming communities, now broadly used. Core features: text channels, voice calls, video calls, and servers (communities). Key challenges: (1) deliver messages in real-time to potentially millions of server members, (2) maintain low-latency voice/video calls, (3) store trillions of messages efficiently. Scale Numbers: - 500+ million registered users - 19+ million active servers (guilds) - 4 billion messages sent per day - Peak: 8.8 million concurrent voice/video users - Some servers have 500,000+ members (e.g., official game servers) Core Features: 1. Servers (guilds) with channels (text and voice) 2. Real-time text messaging in channels 3. Direct messages (DMs) between users 4. Voice channels (persistent, join anytime) 5. Video calls 6. Screen sharing The Core Problem — Real-Time Message Delivery: When a message is sent in a server with 100,000 members, it must be delivered in real-time to all active members. This is a massive fanout problem. Solution: Gateway Servers + Presence Gateway Servers: - Each user maintains a persistent WebSocket connection to a Gateway server - Gateway servers are stateful: they know which users are connected to them - User A sends message → Gateway receives → routes to Message Service → fanout to all relevant Gateway servers → those servers push to their connected users Presence Service: - Tracks which users are online and which Gateway they\'re connected to - Stored in Redis: user_id → {gateway_id, last_seen} - Updated when user connects/disconnects - Used for: online indicators, routing messages to correct gateway Message Delivery Flow: 1. User sends message via WebSocket to Gateway 2. Gateway forwards to Message Service via internal API 3. Message Service stores in Cassandra (persistent) 4. Message Service queries: which users are in this server and currently online? 5. Dispatch Service looks up each online user\'s Gateway from Presence Service 6. Sends message to appropriate Gateways 7. Each Gateway pushes message to connected user via WebSocket Message Storage: - Cassandra (Discord\'s primary choice for messages) - Partition key: channel_id (all messages in same channel on same partition) - Clustering key: message_id (time-ordered using Snowflake IDs) - This allows efficient queries: "get last 50 messages in channel X" = single partition scan - Discord stores trillions of messages — Cassandra handles this at scale Why Cassandra? - Write-heavy: billions of messages/day, Cassandra\'s LSM-tree optimized for writes - Time-series: messages naturally ordered by time, fits Cassandra\'s clustering key model - Scale: horizontally scalable, no single point of failure - Discord\'s 2023 migration: moved some data from Cassandra to ScyllaDB (Cassandra-compatible, faster) Discord and ScyllaDB (2023): - Discord migrated message history from Cassandra to ScyllaDB - ScyllaDB: Cassandra-compatible but written in C++ (vs Java) — lower latency, better hardware utilization - Result: 99th percentile latency dropped from 40ms to 15ms - Lesson: database choice matters at extreme scale Server (Guild) Architecture: A Discord "server" is not a physical server — it\'s a collection of channels and members. Guild metadata stored in PostgreSQL:',
    ]
)
# [{'corpus_id': ..., 'score': ...}, {'corpus_id': ..., 'score': ...}, ...]
```

<!--
### Direct Usage (Transformers)

<details><summary>Click to see the direct usage in Transformers</summary>

</details>
-->

<!--
### Downstream Usage (Sentence Transformers)

You can finetune this model on your own dataset.

<details><summary>Click to expand</summary>

</details>
-->

<!--
### Out-of-Scope Use

*List how the model may foreseeably be misused and address what users ought not to do with the model.*
-->

## Evaluation

### Metrics

#### Cross Encoder Binary Classification

* Dataset: `val`
* Evaluated with [<code>CEBinaryClassificationEvaluator</code>](https://sbert.net/docs/package_reference/cross_encoder/evaluation.html#sentence_transformers.cross_encoder.evaluation.CEBinaryClassificationEvaluator)

| Metric                | Value      |
|:----------------------|:-----------|
| accuracy              | 0.9167     |
| accuracy_threshold    | 1.5791     |
| f1                    | 0.7451     |
| f1_threshold          | -0.0641    |
| precision             | 0.6552     |
| recall                | 0.8636     |
| **average_precision** | **0.8151** |

<!--
## Bias, Risks and Limitations

*What are the known or foreseeable issues stemming from this model? You could also flag here known failure cases or weaknesses of the model.*
-->

<!--
### Recommendations

*What are recommendations with respect to the foreseeable issues? For example, filtering explicit content.*
-->

## Training Details

### Training Dataset

#### Unnamed Dataset

* Size: 648 training samples
* Columns: <code>sentence_0</code>, <code>sentence_1</code>, and <code>label</code>
* Approximate statistics based on the first 100 samples:
  |          | sentence_0                                                                        | sentence_1                                                                           | label                                           |
  |:---------|:----------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------|:------------------------------------------------|
  | type     | string                                                                            | string                                                                               | int                                             |
  | modality | text                                                                              | text                                                                                 |                                                 |
  | details  | <ul><li>min: 9 tokens</li><li>mean: 15.19 tokens</li><li>max: 24 tokens</li></ul> | <ul><li>min: 30 tokens</li><li>mean: 411.62 tokens</li><li>max: 512 tokens</li></ul> | <ul><li>0: ~85.58%</li><li>1: ~14.42%</li></ul> |
* Samples:
  | sentence_0                                                              | sentence_1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | label          |
  |:------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------|
  | <code>how does YouTube use Kafka and CDN in its video pipeline?</code>  | <code>is cached when users actually request it - Examples: Cloudflare (default), Fastly, Akamai Push CDN (eager caching): - You proactively upload content to CDN before any user requests it - Useful for: new product launch (pre-populate before traffic spike), video releases - Netflix's Open Connect: Netflix pushes new movies to ISP CDN nodes overnight - You manage what's on the CDN — more control, more operational overhead - Examples: AWS CloudFront (can push), Netflix Open Connect Cache-Control Headers (How CDN Knows What to Cache): Origin server sets these HTTP response headers: Cache-Control: public, max-age=86400 - public: can be cached by CDN (vs private: only browser cache) - max-age=86400: cache for 86400 seconds (24 hours) Cache-Control: no-cache - Don't cache — always go to origin (or at least revalidate) Cache-Control: s-maxage=3600 - CDN-specific override: CDN caches for 1 hour (browser may cache differently) ETag / Last-Modified: - Origin includes ETag (hash of content) with resp...</code> | <code>0</code> |
  | <code>How does Discord achieve real-time message delivery?</code>       | <code>DISCORD SYSTEM DESIGN Sources: Discord Engineering Blog (discord.com/blog/engineering) Overview: Discord is a real-time communication platform primarily for gaming communities, now broadly used. Core features: text channels, voice calls, video calls, and servers (communities). Key challenges: (1) deliver messages in real-time to potentially millions of server members, (2) maintain low-latency voice/video calls, (3) store trillions of messages efficiently. Scale Numbers: - 500+ million registered users - 19+ million active servers (guilds) - 4 billion messages sent per day - Peak: 8.8 million concurrent voice/video users - Some servers have 500,000+ members (e.g., official game servers) Core Features: 1. Servers (guilds) with channels (text and voice) 2. Real-time text messaging in channels 3. Direct messages (DMs) between users 4. Voice channels (persistent, join anytime) 5. Video calls 6. Screen sharing The Core Problem — Real-Time Message Delivery: When a message is sent in a server ...</code> | <code>1</code> |
  | <code>How does Dropbox secure user files at rest and in transit?</code> | <code>- Instagram ran on sharded PostgreSQL for years — proof SQL can scale Discord (Message Sharding): - Shard key: channel_id (all messages in same channel on same Cassandra partition) - This makes "get last N messages in channel" extremely fast — single partition read Twitter (Gizzard): - Custom sharding framework on top of MySQL - Shard key: user_id for users, tweet_id for tweets - Separate shard namespaces for users and tweets Uber (Schemaless): - Custom MySQL-based sharded storage - Shard key: UUID-based entity IDs - Cell-based architecture: each "cell" is an independent shard cluster MongoDB Sharding: - Built-in sharding via "shard key" in collection definition - Config servers store metadata (which shard has which key ranges) - Mongos router: receives queries, routes to appropriate shards - Chunk migration: moves data between shards automatically when imbalanced When to Shard: - Single server maxing out storage? Shard. - Single server maxing out CPU/connections? Consider read replica...</code> | <code>0</code> |
* Loss: [<code>BinaryCrossEntropyLoss</code>](https://sbert.net/docs/package_reference/cross_encoder/losses.html#binarycrossentropyloss) with these parameters:
  ```json
  {
      "activation_fn": "torch.nn.modules.linear.Identity",
      "pos_weight": null
  }
  ```

### Training Hyperparameters
#### Non-Default Hyperparameters

- `per_device_train_batch_size`: 16
- `num_train_epochs`: 4
- `per_device_eval_batch_size`: 16

#### All Hyperparameters
<details><summary>Click to expand</summary>

- `per_device_train_batch_size`: 16
- `num_train_epochs`: 4
- `max_steps`: -1
- `learning_rate`: 5e-05
- `lr_scheduler_type`: linear
- `lr_scheduler_kwargs`: None
- `warmup_steps`: 0
- `optim`: adamw_torch_fused
- `optim_args`: None
- `weight_decay`: 0.0
- `adam_beta1`: 0.9
- `adam_beta2`: 0.999
- `adam_epsilon`: 1e-08
- `optim_target_modules`: None
- `gradient_accumulation_steps`: 1
- `average_tokens_across_devices`: True
- `max_grad_norm`: 1
- `label_smoothing_factor`: 0.0
- `bf16`: False
- `fp16`: False
- `bf16_full_eval`: False
- `fp16_full_eval`: False
- `tf32`: None
- `gradient_checkpointing`: False
- `gradient_checkpointing_kwargs`: None
- `torch_compile`: False
- `torch_compile_backend`: None
- `torch_compile_mode`: None
- `use_liger_kernel`: False
- `liger_kernel_config`: None
- `use_cache`: False
- `neftune_noise_alpha`: None
- `torch_empty_cache_steps`: None
- `auto_find_batch_size`: False
- `log_on_each_node`: True
- `logging_nan_inf_filter`: True
- `include_num_input_tokens_seen`: no
- `log_level`: passive
- `log_level_replica`: warning
- `disable_tqdm`: False
- `project`: huggingface
- `trackio_space_id`: None
- `trackio_bucket_id`: None
- `trackio_static_space_id`: None
- `per_device_eval_batch_size`: 16
- `prediction_loss_only`: True
- `eval_on_start`: False
- `eval_do_concat_batches`: True
- `eval_use_gather_object`: False
- `eval_accumulation_steps`: None
- `include_for_metrics`: []
- `batch_eval_metrics`: False
- `save_only_model`: False
- `save_on_each_node`: False
- `enable_jit_checkpoint`: False
- `push_to_hub`: False
- `hub_private_repo`: None
- `hub_model_id`: None
- `hub_strategy`: every_save
- `hub_always_push`: False
- `hub_revision`: None
- `load_best_model_at_end`: False
- `ignore_data_skip`: False
- `restore_callback_states_from_checkpoint`: False
- `full_determinism`: False
- `seed`: 42
- `data_seed`: None
- `use_cpu`: False
- `accelerator_config`: {'split_batches': False, 'dispatch_batches': None, 'even_batches': True, 'use_seedable_sampler': True, 'non_blocking': False, 'gradient_accumulation_kwargs': None}
- `parallelism_config`: None
- `dataloader_drop_last`: False
- `dataloader_num_workers`: 0
- `dataloader_pin_memory`: True
- `dataloader_persistent_workers`: False
- `dataloader_prefetch_factor`: None
- `dataloader_multiprocessing_context`: None
- `dataloader_in_order`: True
- `remove_unused_columns`: True
- `label_names`: None
- `train_sampling_strategy`: random
- `length_column_name`: length
- `ddp_find_unused_parameters`: None
- `ddp_bucket_cap_mb`: None
- `ddp_broadcast_buffers`: False
- `ddp_static_graph`: None
- `ddp_backend`: None
- `ddp_timeout`: 1800
- `fsdp`: None
- `fsdp_config`: None
- `deepspeed`: None
- `debug`: []
- `skip_memory_metrics`: True
- `do_predict`: False
- `resume_from_checkpoint`: None
- `local_rank`: -1
- `prompts`: None
- `batch_sampler`: batch_sampler
- `multi_dataset_batch_sampler`: proportional
- `router_mapping`: {}
- `learning_rate_mapping`: {}
- `warmup_ratio`: None

</details>

### Training Logs
| Epoch | Step | val_average_precision |
|:-----:|:----:|:---------------------:|
| 1.0   | 41   | 0.8094                |
| 2.0   | 82   | 0.8131                |
| 3.0   | 123  | 0.8128                |
| 4.0   | 164  | 0.8151                |


### Training Time
- **Training**: 24.5 minutes

### Framework Versions
- Python: 3.11.16
- Sentence Transformers: 6.0.1
- Transformers: 5.17.0
- PyTorch: 2.14.0+cu130
- Accelerate: 1.15.0
- Datasets: 5.0.1
- Tokenizers: 0.23.2

## Additional Resources

- [Training and Finetuning Reranker Models with Sentence Transformers](https://huggingface.co/blog/train-reranker): the end-to-end guide for training or finetuning Cross Encoder (reranker) models.
- [Multimodal Embedding & Reranker Models with Sentence Transformers](https://huggingface.co/blog/multimodal-sentence-transformers): use text, image, audio, and video reranker models through the same API.
- [Training and Finetuning Multimodal Embedding & Reranker Models with Sentence Transformers](https://huggingface.co/blog/train-multimodal-sentence-transformers): training multimodal Cross Encoders.

## Citation

### BibTeX

#### Sentence Transformers
```bibtex
@inproceedings{reimers-2019-sentence-bert,
    title = "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks",
    author = "Reimers, Nils and Gurevych, Iryna",
    booktitle = "Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing",
    month = "11",
    year = "2019",
    publisher = "Association for Computational Linguistics",
    url = "https://arxiv.org/abs/1908.10084",
}
```

<!--
## Glossary

*Clearly define terms in order to be accessible across audiences.*
-->

<!--
## Model Card Authors

*Lists the people who create the model card, providing recognition and accountability for the detailed work that goes into its construction.*
-->

<!--
## Model Card Contact

*Provides a way for people who have updates to the Model Card, suggestions, or questions, to contact the Model Card authors.*
-->