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
      value: 1.378995656967163
      name: Accuracy Threshold
    - type: f1
      value: 0.76
      name: F1
    - type: f1_threshold
      value: 0.10910024493932724
      name: F1 Threshold
    - type: precision
      value: 0.6785714285714286
      name: Precision
    - type: recall
      value: 0.8636363636363636
      name: Recall
    - type: average_precision
      value: 0.8181498069343918
      name: Average Precision
---

# CrossEncoder based on cross-encoder/ms-marco-MiniLM-L6-v2

This is a [Cross Encoder](https://www.sbert.net/docs/cross_encoder/usage/usage.html) model finetuned from [cross-encoder/ms-marco-MiniLM-L6-v2](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2) using the [sentence-transformers](https://www.SBERT.net) library. It computes scores for pairs of texts, which can be used for text reranking and semantic search.

## Model Details

### Model Description
- **Model Type:** Cross Encoder
- **Base model:** [cross-encoder/ms-marco-MiniLM-L6-v2](https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2) <!-- at revision c5ee24cb16019beea0893ab7796b1df96625c6b8 -->
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
    ['What algorithms does Netflix use for recommendations?', 'both are reusable patterns that show up across most large-scale social feed system designs, not Pinterest-specific tricks.'],
    ['Why did Netflix choose to build Open Connect CDN?', 'is cached when users actually request it - Examples: Cloudflare (default), Fastly, Akamai Push CDN (eager caching): - You proactively upload content to CDN before any user requests it - Useful for: new product launch (pre-populate before traffic spike), video releases - Netflix\'s Open Connect: Netflix pushes new movies to ISP CDN nodes overnight - You manage what\'s on the CDN — more control, more operational overhead - Examples: AWS CloudFront (can push), Netflix Open Connect Cache-Control Headers (How CDN Knows What to Cache): Origin server sets these HTTP response headers: Cache-Control: public, max-age=86400 - public: can be cached by CDN (vs private: only browser cache) - max-age=86400: cache for 86400 seconds (24 hours) Cache-Control: no-cache - Don\'t cache — always go to origin (or at least revalidate) Cache-Control: s-maxage=3600 - CDN-specific override: CDN caches for 1 hour (browser may cache differently) ETag / Last-Modified: - Origin includes ETag (hash of content) with response - CDN/browser can ask: "has this changed since ETag=abc123?" - Origin returns 304 Not Modified if unchanged (no body, saves bandwidth) - This is "conditional request" / cache revalidation Cache Invalidation (Hard Problem): "There are only two hard things in computer science: cache invalidation and naming things." — Phil Karlton Problem: you cached old.jpg for 24 hours. You upload new.jpg to same URL. Users see old version for 24 hours. Solutions: 1. URL-based versioning (best practice): - image.jpg?v=123 → changes to image.jpg?v=124 on update - Or: image-abc123hash.jpg (hash in filename) - Different URL = new cache entry = immediate update - Used by: webpack, Next.js, all modern build tools 2. CDN Purge API: - Explicitly invalidate specific URLs via API call - CDN marks cached version as stale, next request fetches from origin - AWS CloudFront: create invalidation request - Cloudflare: Purge Cache API - Can be slow (propagates across all edge nodes, minutes) - Cost: AWS charges per invalidation, Cloudflare allows free bulk invalidation 3. Short TTL: - Set max-age=300 (5 minutes) for content that changes frequently - User might see 5-minute-old version — acceptable trade-off - High-traffic news sites use this for article pages 4. Surrogate keys / Cache tags: - Tag cached objects with logical identifiers - Purge all objects with a tag in one API call - Fastly and Cloudflare support this - Example: tag all product images with product_id=123 → purge all on product update CDN for Video (Adaptive Bitrate Streaming): Video is the largest CDN workload (Netflix = 1/3 of US internet traffic). Video segmented into chunks (2-4 seconds each): - Each chunk at multiple quality levels (360p, 720p, 1080p, 4K) - Player requests chunks one by one, choosing quality based on current bandwidth - CDN caches each chunk individually - Popular videos: CDN hit rate near 100% (same chunks requested by millions) - Long-tail content: cache miss rate higher (rare videos not in cache) CDN for APIs (Edge Caching): Can you cache API responses? - GET /products (list): YES — same for everyone, cache 60 seconds - GET /products/123:'],
    ['what is the difference between CP and AP systems in distributed databases?', 'Amazon Dynamo (Case Study) Sources: DeCandia et al., "Dynamo: Amazon\'s Highly Available Key-value Store" (SOSP 2007) Why it was built: Amazon\'s shopping cart service needed to always accept a write — even during a network partition or node failure — because a customer being unable to add to their cart is a direct lost sale. Traditional strongly-consistent databases prioritize consistency over availability during a partition; Dynamo inverted that priority for this specific use case. Core design goal: always writable. Dynamo chose availability and partition tolerance over strict consistency (the AP side of CAP) — a write should never be rejected because some replicas are temporarily unreachable. This means the system can end up with temporarily conflicting versions of the same data, which it must reconcile later rather than prevent up front. Consistent hashing for partitioning: Data is partitioned across nodes using consistent hashing (each node owns a range on a hash ring). Adding or removing a node only reshuffles the data immediately adjacent to it on the ring, not the entire dataset — critical for a system meant to scale nodes up/down without a massive rebalancing event. Sloppy quorum & hinted handoff: Normally a write requires acknowledgment from W replicas and a read from R replicas (with W + R > N giving strong-ish consistency). But if some of the "correct" replica nodes are down, Dynamo still accepts the write on a different, temporarily-substituting node ("sloppy quorum") rather than rejecting it — the substitute node holds a "hint" to hand the data back to the rightful replica once it recovers (hinted handoff). This is the core mechanism of the "always writable" guarantee. Vector clocks for conflict resolution: Because writes can be accepted by different replicas independently during a partition, the same key can end up with multiple conflicting versions. Dynamo tags each version with a vector clock (tracks which node made which update, in what order) so it can determine if one version is a strict descendant of another (safe to auto-merge) or if they\'re genuinely concurrent conflicting writes (must be reconciled — Dynamo pushes this reconciliation to the application, e.g. "merge the two shopping carts," since only the application knows how to correctly merge domain data). Read-repair & anti-entropy: When a read encounters divergent versions across replicas, the coordinator can push the resolved/latest version back to the stale replicas ("read repair") instead of waiting for a separate background process — keeps replicas converging toward consistency without blocking writes to do so. Legacy and influence: Dynamo\'s design (consistent hashing, eventual consistency, vector clocks, "AP over CP" for write availability) directly influenced Cassandra, Riak, and Amazon\'s own managed DynamoDB — this paper is one of the most cited references in distributed systems design precisely because it made an explicit, well-justified trade-off (availability over consistency) that became a standard pattern to reference when discussing CAP theorem trade-offs in interviews.'],
    ['What database does Discord use for message storage and why?', "batch only | Basic (MULTI/EXEC) Query Language | SQL (very powerful) | MQL (moderate) | CQL (limited) | Commands only Horizontal Scale | Hard (sharding) | Built-in sharding | Native (ring) | Cluster mode Consistency | Strong | Tunable | Tunable (eventual) | Strong (single) / Eventual (cluster) Best for | Relations, ACID | Documents, JSON | Time-series, wide rows | Cache, sessions, real-time Common Real-World Combinations: Most large systems use multiple databases (polyglot persistence): Uber: - MySQL (sharded): trip data, user accounts (ACID needed) - Redis: driver locations (fast geo-queries), surge pricing, caching - Kafka: event streaming for all services Instagram: - PostgreSQL: posts, comments, user profiles (started here, scaled with sharding) - Cassandra: direct messages, activity feeds (write-heavy) - Redis: feed caches, session storage - Elasticsearch: search index Netflix: - MySQL/RDS: account management, billing (ACID) - Cassandra: viewing history, user preferences (write-heavy, eventually consistent) - Redis: session tokens, recommendation cache - S3 + Iceberg: data warehouse for analytics Specific Scenarios and Recommendations: Scenario: User authentication and sessions - Session storage: Redis (fast, TTL built-in) - User credentials: PostgreSQL (ACID, rarely changes) Scenario: Product catalog (e-commerce) - MongoDB — different products have different attributes (phones have RAM, shoes have size) - Flexible schema is a major advantage here Scenario: Order processing - PostgreSQL or MySQL — ACID critical (don't double-charge, don't lose orders) - Transactions spanning order, inventory, payment must be atomic Scenario: Real-time messaging (WhatsApp, Discord) - Cassandra — write-heavy (billions of messages/day), time-series (sorted by timestamp) - Redis — presence/online status (fast read/write, TTL for offline expiry) Scenario: Social network feed - Cassandra — store pre-computed feeds (append-heavy, read by user_id + timestamp) - Redis — cache hot feeds for active users Scenario: Location tracking (Uber, food delivery) - Redis — geospatial commands (GEOADD, GEOSEARCH), updates every 4 seconds - Cassandra or PostgreSQL — historical location data for analytics Scenario: Analytics / Reporting - Apache Hive / BigQuery / Snowflake — columnar storage, optimized for analytical queries (OLAP) - Not for operational databases — for offline analysis Scenario: Content search (Airbnb listings, Twitter search) - Elasticsearch — full-text search, filters, geo-queries, fast aggregations - Not a primary database — synced from primary DB via Kafka pipeline SQL Scaling Techniques (before switching to NoSQL): 1. Read replicas: route read queries to replicas, writes to primary 2. Connection pooling: PgBouncer — reuse database connections 3. Indexing: proper indexes can make 1000x difference 4. Caching: Redis in front of PostgreSQL eliminates 80%+ of DB load 5. Vertical scaling: bigger server often solves immediate problem 6. Horizontal sharding: shard by user_id — each shard is a PostgreSQL instance Rule of Thumb: - Start with PostgreSQL — it's battle-tested, ACID, scales to hundreds of millions of rows - Add Redis for caching and fast data structures (almost always needed) - Add Elasticsearch for search (don't build search on top of SQL) - Consider Cassandra when write volume is extremely high (billions/day) - Add MongoDB if your data is truly document-shaped with variable"],
    ['When should Redis or Elasticsearch be added to a database architecture?', "batch only | Basic (MULTI/EXEC) Query Language | SQL (very powerful) | MQL (moderate) | CQL (limited) | Commands only Horizontal Scale | Hard (sharding) | Built-in sharding | Native (ring) | Cluster mode Consistency | Strong | Tunable | Tunable (eventual) | Strong (single) / Eventual (cluster) Best for | Relations, ACID | Documents, JSON | Time-series, wide rows | Cache, sessions, real-time Common Real-World Combinations: Most large systems use multiple databases (polyglot persistence): Uber: - MySQL (sharded): trip data, user accounts (ACID needed) - Redis: driver locations (fast geo-queries), surge pricing, caching - Kafka: event streaming for all services Instagram: - PostgreSQL: posts, comments, user profiles (started here, scaled with sharding) - Cassandra: direct messages, activity feeds (write-heavy) - Redis: feed caches, session storage - Elasticsearch: search index Netflix: - MySQL/RDS: account management, billing (ACID) - Cassandra: viewing history, user preferences (write-heavy, eventually consistent) - Redis: session tokens, recommendation cache - S3 + Iceberg: data warehouse for analytics Specific Scenarios and Recommendations: Scenario: User authentication and sessions - Session storage: Redis (fast, TTL built-in) - User credentials: PostgreSQL (ACID, rarely changes) Scenario: Product catalog (e-commerce) - MongoDB — different products have different attributes (phones have RAM, shoes have size) - Flexible schema is a major advantage here Scenario: Order processing - PostgreSQL or MySQL — ACID critical (don't double-charge, don't lose orders) - Transactions spanning order, inventory, payment must be atomic Scenario: Real-time messaging (WhatsApp, Discord) - Cassandra — write-heavy (billions of messages/day), time-series (sorted by timestamp) - Redis — presence/online status (fast read/write, TTL for offline expiry) Scenario: Social network feed - Cassandra — store pre-computed feeds (append-heavy, read by user_id + timestamp) - Redis — cache hot feeds for active users Scenario: Location tracking (Uber, food delivery) - Redis — geospatial commands (GEOADD, GEOSEARCH), updates every 4 seconds - Cassandra or PostgreSQL — historical location data for analytics Scenario: Analytics / Reporting - Apache Hive / BigQuery / Snowflake — columnar storage, optimized for analytical queries (OLAP) - Not for operational databases — for offline analysis Scenario: Content search (Airbnb listings, Twitter search) - Elasticsearch — full-text search, filters, geo-queries, fast aggregations - Not a primary database — synced from primary DB via Kafka pipeline SQL Scaling Techniques (before switching to NoSQL): 1. Read replicas: route read queries to replicas, writes to primary 2. Connection pooling: PgBouncer — reuse database connections 3. Indexing: proper indexes can make 1000x difference 4. Caching: Redis in front of PostgreSQL eliminates 80%+ of DB load 5. Vertical scaling: bigger server often solves immediate problem 6. Horizontal sharding: shard by user_id — each shard is a PostgreSQL instance Rule of Thumb: - Start with PostgreSQL — it's battle-tested, ACID, scales to hundreds of millions of rows - Add Redis for caching and fast data structures (almost always needed) - Add Elasticsearch for search (don't build search on top of SQL) - Consider Cassandra when write volume is extremely high (billions/day) - Add MongoDB if your data is truly document-shaped with variable"],
]
scores = model.predict(pairs)
print(scores)
# [-10.2357  -0.4939  -5.237   -0.0153  -4.2742]

# Or rank different texts based on similarity to a single text
ranks = model.rank(
    'What algorithms does Netflix use for recommendations?',
    [
        'both are reusable patterns that show up across most large-scale social feed system designs, not Pinterest-specific tricks.',
        'is cached when users actually request it - Examples: Cloudflare (default), Fastly, Akamai Push CDN (eager caching): - You proactively upload content to CDN before any user requests it - Useful for: new product launch (pre-populate before traffic spike), video releases - Netflix\'s Open Connect: Netflix pushes new movies to ISP CDN nodes overnight - You manage what\'s on the CDN — more control, more operational overhead - Examples: AWS CloudFront (can push), Netflix Open Connect Cache-Control Headers (How CDN Knows What to Cache): Origin server sets these HTTP response headers: Cache-Control: public, max-age=86400 - public: can be cached by CDN (vs private: only browser cache) - max-age=86400: cache for 86400 seconds (24 hours) Cache-Control: no-cache - Don\'t cache — always go to origin (or at least revalidate) Cache-Control: s-maxage=3600 - CDN-specific override: CDN caches for 1 hour (browser may cache differently) ETag / Last-Modified: - Origin includes ETag (hash of content) with response - CDN/browser can ask: "has this changed since ETag=abc123?" - Origin returns 304 Not Modified if unchanged (no body, saves bandwidth) - This is "conditional request" / cache revalidation Cache Invalidation (Hard Problem): "There are only two hard things in computer science: cache invalidation and naming things." — Phil Karlton Problem: you cached old.jpg for 24 hours. You upload new.jpg to same URL. Users see old version for 24 hours. Solutions: 1. URL-based versioning (best practice): - image.jpg?v=123 → changes to image.jpg?v=124 on update - Or: image-abc123hash.jpg (hash in filename) - Different URL = new cache entry = immediate update - Used by: webpack, Next.js, all modern build tools 2. CDN Purge API: - Explicitly invalidate specific URLs via API call - CDN marks cached version as stale, next request fetches from origin - AWS CloudFront: create invalidation request - Cloudflare: Purge Cache API - Can be slow (propagates across all edge nodes, minutes) - Cost: AWS charges per invalidation, Cloudflare allows free bulk invalidation 3. Short TTL: - Set max-age=300 (5 minutes) for content that changes frequently - User might see 5-minute-old version — acceptable trade-off - High-traffic news sites use this for article pages 4. Surrogate keys / Cache tags: - Tag cached objects with logical identifiers - Purge all objects with a tag in one API call - Fastly and Cloudflare support this - Example: tag all product images with product_id=123 → purge all on product update CDN for Video (Adaptive Bitrate Streaming): Video is the largest CDN workload (Netflix = 1/3 of US internet traffic). Video segmented into chunks (2-4 seconds each): - Each chunk at multiple quality levels (360p, 720p, 1080p, 4K) - Player requests chunks one by one, choosing quality based on current bandwidth - CDN caches each chunk individually - Popular videos: CDN hit rate near 100% (same chunks requested by millions) - Long-tail content: cache miss rate higher (rare videos not in cache) CDN for APIs (Edge Caching): Can you cache API responses? - GET /products (list): YES — same for everyone, cache 60 seconds - GET /products/123:',
        'Amazon Dynamo (Case Study) Sources: DeCandia et al., "Dynamo: Amazon\'s Highly Available Key-value Store" (SOSP 2007) Why it was built: Amazon\'s shopping cart service needed to always accept a write — even during a network partition or node failure — because a customer being unable to add to their cart is a direct lost sale. Traditional strongly-consistent databases prioritize consistency over availability during a partition; Dynamo inverted that priority for this specific use case. Core design goal: always writable. Dynamo chose availability and partition tolerance over strict consistency (the AP side of CAP) — a write should never be rejected because some replicas are temporarily unreachable. This means the system can end up with temporarily conflicting versions of the same data, which it must reconcile later rather than prevent up front. Consistent hashing for partitioning: Data is partitioned across nodes using consistent hashing (each node owns a range on a hash ring). Adding or removing a node only reshuffles the data immediately adjacent to it on the ring, not the entire dataset — critical for a system meant to scale nodes up/down without a massive rebalancing event. Sloppy quorum & hinted handoff: Normally a write requires acknowledgment from W replicas and a read from R replicas (with W + R > N giving strong-ish consistency). But if some of the "correct" replica nodes are down, Dynamo still accepts the write on a different, temporarily-substituting node ("sloppy quorum") rather than rejecting it — the substitute node holds a "hint" to hand the data back to the rightful replica once it recovers (hinted handoff). This is the core mechanism of the "always writable" guarantee. Vector clocks for conflict resolution: Because writes can be accepted by different replicas independently during a partition, the same key can end up with multiple conflicting versions. Dynamo tags each version with a vector clock (tracks which node made which update, in what order) so it can determine if one version is a strict descendant of another (safe to auto-merge) or if they\'re genuinely concurrent conflicting writes (must be reconciled — Dynamo pushes this reconciliation to the application, e.g. "merge the two shopping carts," since only the application knows how to correctly merge domain data). Read-repair & anti-entropy: When a read encounters divergent versions across replicas, the coordinator can push the resolved/latest version back to the stale replicas ("read repair") instead of waiting for a separate background process — keeps replicas converging toward consistency without blocking writes to do so. Legacy and influence: Dynamo\'s design (consistent hashing, eventual consistency, vector clocks, "AP over CP" for write availability) directly influenced Cassandra, Riak, and Amazon\'s own managed DynamoDB — this paper is one of the most cited references in distributed systems design precisely because it made an explicit, well-justified trade-off (availability over consistency) that became a standard pattern to reference when discussing CAP theorem trade-offs in interviews.',
        "batch only | Basic (MULTI/EXEC) Query Language | SQL (very powerful) | MQL (moderate) | CQL (limited) | Commands only Horizontal Scale | Hard (sharding) | Built-in sharding | Native (ring) | Cluster mode Consistency | Strong | Tunable | Tunable (eventual) | Strong (single) / Eventual (cluster) Best for | Relations, ACID | Documents, JSON | Time-series, wide rows | Cache, sessions, real-time Common Real-World Combinations: Most large systems use multiple databases (polyglot persistence): Uber: - MySQL (sharded): trip data, user accounts (ACID needed) - Redis: driver locations (fast geo-queries), surge pricing, caching - Kafka: event streaming for all services Instagram: - PostgreSQL: posts, comments, user profiles (started here, scaled with sharding) - Cassandra: direct messages, activity feeds (write-heavy) - Redis: feed caches, session storage - Elasticsearch: search index Netflix: - MySQL/RDS: account management, billing (ACID) - Cassandra: viewing history, user preferences (write-heavy, eventually consistent) - Redis: session tokens, recommendation cache - S3 + Iceberg: data warehouse for analytics Specific Scenarios and Recommendations: Scenario: User authentication and sessions - Session storage: Redis (fast, TTL built-in) - User credentials: PostgreSQL (ACID, rarely changes) Scenario: Product catalog (e-commerce) - MongoDB — different products have different attributes (phones have RAM, shoes have size) - Flexible schema is a major advantage here Scenario: Order processing - PostgreSQL or MySQL — ACID critical (don't double-charge, don't lose orders) - Transactions spanning order, inventory, payment must be atomic Scenario: Real-time messaging (WhatsApp, Discord) - Cassandra — write-heavy (billions of messages/day), time-series (sorted by timestamp) - Redis — presence/online status (fast read/write, TTL for offline expiry) Scenario: Social network feed - Cassandra — store pre-computed feeds (append-heavy, read by user_id + timestamp) - Redis — cache hot feeds for active users Scenario: Location tracking (Uber, food delivery) - Redis — geospatial commands (GEOADD, GEOSEARCH), updates every 4 seconds - Cassandra or PostgreSQL — historical location data for analytics Scenario: Analytics / Reporting - Apache Hive / BigQuery / Snowflake — columnar storage, optimized for analytical queries (OLAP) - Not for operational databases — for offline analysis Scenario: Content search (Airbnb listings, Twitter search) - Elasticsearch — full-text search, filters, geo-queries, fast aggregations - Not a primary database — synced from primary DB via Kafka pipeline SQL Scaling Techniques (before switching to NoSQL): 1. Read replicas: route read queries to replicas, writes to primary 2. Connection pooling: PgBouncer — reuse database connections 3. Indexing: proper indexes can make 1000x difference 4. Caching: Redis in front of PostgreSQL eliminates 80%+ of DB load 5. Vertical scaling: bigger server often solves immediate problem 6. Horizontal sharding: shard by user_id — each shard is a PostgreSQL instance Rule of Thumb: - Start with PostgreSQL — it's battle-tested, ACID, scales to hundreds of millions of rows - Add Redis for caching and fast data structures (almost always needed) - Add Elasticsearch for search (don't build search on top of SQL) - Consider Cassandra when write volume is extremely high (billions/day) - Add MongoDB if your data is truly document-shaped with variable",
        "batch only | Basic (MULTI/EXEC) Query Language | SQL (very powerful) | MQL (moderate) | CQL (limited) | Commands only Horizontal Scale | Hard (sharding) | Built-in sharding | Native (ring) | Cluster mode Consistency | Strong | Tunable | Tunable (eventual) | Strong (single) / Eventual (cluster) Best for | Relations, ACID | Documents, JSON | Time-series, wide rows | Cache, sessions, real-time Common Real-World Combinations: Most large systems use multiple databases (polyglot persistence): Uber: - MySQL (sharded): trip data, user accounts (ACID needed) - Redis: driver locations (fast geo-queries), surge pricing, caching - Kafka: event streaming for all services Instagram: - PostgreSQL: posts, comments, user profiles (started here, scaled with sharding) - Cassandra: direct messages, activity feeds (write-heavy) - Redis: feed caches, session storage - Elasticsearch: search index Netflix: - MySQL/RDS: account management, billing (ACID) - Cassandra: viewing history, user preferences (write-heavy, eventually consistent) - Redis: session tokens, recommendation cache - S3 + Iceberg: data warehouse for analytics Specific Scenarios and Recommendations: Scenario: User authentication and sessions - Session storage: Redis (fast, TTL built-in) - User credentials: PostgreSQL (ACID, rarely changes) Scenario: Product catalog (e-commerce) - MongoDB — different products have different attributes (phones have RAM, shoes have size) - Flexible schema is a major advantage here Scenario: Order processing - PostgreSQL or MySQL — ACID critical (don't double-charge, don't lose orders) - Transactions spanning order, inventory, payment must be atomic Scenario: Real-time messaging (WhatsApp, Discord) - Cassandra — write-heavy (billions of messages/day), time-series (sorted by timestamp) - Redis — presence/online status (fast read/write, TTL for offline expiry) Scenario: Social network feed - Cassandra — store pre-computed feeds (append-heavy, read by user_id + timestamp) - Redis — cache hot feeds for active users Scenario: Location tracking (Uber, food delivery) - Redis — geospatial commands (GEOADD, GEOSEARCH), updates every 4 seconds - Cassandra or PostgreSQL — historical location data for analytics Scenario: Analytics / Reporting - Apache Hive / BigQuery / Snowflake — columnar storage, optimized for analytical queries (OLAP) - Not for operational databases — for offline analysis Scenario: Content search (Airbnb listings, Twitter search) - Elasticsearch — full-text search, filters, geo-queries, fast aggregations - Not a primary database — synced from primary DB via Kafka pipeline SQL Scaling Techniques (before switching to NoSQL): 1. Read replicas: route read queries to replicas, writes to primary 2. Connection pooling: PgBouncer — reuse database connections 3. Indexing: proper indexes can make 1000x difference 4. Caching: Redis in front of PostgreSQL eliminates 80%+ of DB load 5. Vertical scaling: bigger server often solves immediate problem 6. Horizontal sharding: shard by user_id — each shard is a PostgreSQL instance Rule of Thumb: - Start with PostgreSQL — it's battle-tested, ACID, scales to hundreds of millions of rows - Add Redis for caching and fast data structures (almost always needed) - Add Elasticsearch for search (don't build search on top of SQL) - Consider Cassandra when write volume is extremely high (billions/day) - Add MongoDB if your data is truly document-shaped with variable",
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
| accuracy_threshold    | 1.379      |
| f1                    | 0.76       |
| f1_threshold          | 0.1091     |
| precision             | 0.6786     |
| recall                | 0.8636     |
| **average_precision** | **0.8181** |

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
  |          | sentence_0                                                                        | sentence_1                                                                         | label                                           |
  |:---------|:----------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------|:------------------------------------------------|
  | type     | string                                                                            | string                                                                             | int                                             |
  | modality | text                                                                              | text                                                                               |                                                 |
  | details  | <ul><li>min: 9 tokens</li><li>mean: 14.33 tokens</li><li>max: 24 tokens</li></ul> | <ul><li>min: 7 tokens</li><li>mean: 422.0 tokens</li><li>max: 512 tokens</li></ul> | <ul><li>0: ~79.81%</li><li>1: ~20.19%</li></ul> |
* Samples:
  | sentence_0                                                                              | sentence_1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | label          |
  |:----------------------------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------|
  | <code>What algorithms does Netflix use for recommendations?</code>                      | <code>both are reusable patterns that show up across most large-scale social feed system designs, not Pinterest-specific tricks.</code>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | <code>0</code> |
  | <code>Why did Netflix choose to build Open Connect CDN?</code>                          | <code>is cached when users actually request it - Examples: Cloudflare (default), Fastly, Akamai Push CDN (eager caching): - You proactively upload content to CDN before any user requests it - Useful for: new product launch (pre-populate before traffic spike), video releases - Netflix's Open Connect: Netflix pushes new movies to ISP CDN nodes overnight - You manage what's on the CDN — more control, more operational overhead - Examples: AWS CloudFront (can push), Netflix Open Connect Cache-Control Headers (How CDN Knows What to Cache): Origin server sets these HTTP response headers: Cache-Control: public, max-age=86400 - public: can be cached by CDN (vs private: only browser cache) - max-age=86400: cache for 86400 seconds (24 hours) Cache-Control: no-cache - Don't cache — always go to origin (or at least revalidate) Cache-Control: s-maxage=3600 - CDN-specific override: CDN caches for 1 hour (browser may cache differently) ETag / Last-Modified: - Origin includes ETag (hash of content) with resp...</code> | <code>0</code> |
  | <code>what is the difference between CP and AP systems in distributed databases?</code> | <code>Amazon Dynamo (Case Study) Sources: DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store" (SOSP 2007) Why it was built: Amazon's shopping cart service needed to always accept a write — even during a network partition or node failure — because a customer being unable to add to their cart is a direct lost sale. Traditional strongly-consistent databases prioritize consistency over availability during a partition; Dynamo inverted that priority for this specific use case. Core design goal: always writable. Dynamo chose availability and partition tolerance over strict consistency (the AP side of CAP) — a write should never be rejected because some replicas are temporarily unreachable. This means the system can end up with temporarily conflicting versions of the same data, which it must reconcile later rather than prevent up front. Consistent hashing for partitioning: Data is partitioned across nodes using consistent hashing (each node owns a range on a hash ring). Adding or re...</code> | <code>0</code> |
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
- `optim`: adamw_torch
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
- `warmup_ratio`: None
- `local_rank`: -1
- `prompts`: None
- `batch_sampler`: batch_sampler
- `multi_dataset_batch_sampler`: proportional
- `router_mapping`: {}
- `learning_rate_mapping`: {}

</details>

### Training Logs
| Epoch | Step | val_average_precision |
|:-----:|:----:|:---------------------:|
| 1.0   | 41   | 0.7942                |
| 2.0   | 82   | 0.8146                |
| 3.0   | 123  | 0.8155                |
| 4.0   | 164  | 0.8181                |


### Training Time
- **Training**: 58.1 seconds

### Framework Versions
- Python: 3.13.5
- Sentence Transformers: 5.6.0
- Transformers: 5.14.1
- PyTorch: 2.6.0+cu124
- Accelerate: 1.14.0
- Datasets: 5.0.0
- Tokenizers: 0.22.2

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