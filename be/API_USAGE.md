# API Usage — Communities, Messages, and Search/Location/Business/Event

This document explains how to use the primary community and messaging APIs, plus the list/search features added to location/business/event endpoints. Examples use curl; replace placeholders like `<TOKEN>`, `<COMMUNITY_ID>`, `<MESSAGE_ID>`, `<LAT>`, `<LNG>`, `<RADIUS>`, `<TYPE_ID>` with real values.

Base URL (default development):

- http://localhost:8000/api/v1

Authentication

- Signup: `POST /auth/signup` (returns JWT access token valid for 3 hours)
- Signin: `POST /auth/signin` (returns JWT access token valid for 3 hours)

All protected endpoints require `Authorization: Bearer <TOKEN>` header.

Example — Signin (get token):

```bash
curl -sS -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

Store token (bash):

```bash
TOKEN=$(curl -sS -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}' | jq -r '.access_token')
```

Notes about tokens

- Tokens are JWTs and expire after 3 hours.
- The server requires a valid token for protected endpoints; expired/invalid tokens produce HTTP 401.

1) Communities

Create a community (authenticated). The creating user is automatically added as the community owner.

- Endpoint: `POST /communities/`
- Body: JSON with `name` and `decription` (note: the field name is `decription` in the API)
- Response: Community object

Example:

```bash
curl -sS -X POST http://localhost:8000/api/v1/communities/ \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hikers","decription":"Group for hikers"}'
```

List communities (supports text search, pagination):

- Endpoint: `GET /communities/`
- Query params: `q` (text search), `skip`, `limit`

Example — search:

```bash
curl -sS "http://localhost:8000/api/v1/communities/?q=hike&skip=0&limit=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

Get a community by id:

```bash
curl -sS "http://localhost:8000/api/v1/communities/<COMMUNITY_ID>" \
  -H "Authorization: Bearer ${TOKEN}"
```

Update community (owner only):

```bash
curl -sS -X PUT "http://localhost:8000/api/v1/communities/<COMMUNITY_ID>" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","decription":"Updated"}'
```

Delete community (owner only):

```bash
curl -sS -X DELETE "http://localhost:8000/api/v1/communities/<COMMUNITY_ID>" \
  -H "Authorization: Bearer ${TOKEN}"
```

Notes:
- The creating user is added as `owner` in the membership table.
- Only users with `owner` role for the community can update or delete the community.

2) Messages

Message creation requires the user to be a member of the target community. The server extracts the sender (`uid`) from the JWT — you should not send `uid` in the body.

Create a message:

- Endpoint: `POST /message/`
- Body: `{ "cid": "<COMMUNITY_ID>", "text": "Message text" }`
- Constraints: `text` must be non-empty (not whitespace-only) and <= 1000 characters.
- Anti-spam: minimal throttle prevents sending messages from the same user in the same community within 5 seconds.

Example:

```bash
curl -sS -X POST http://localhost:8000/api/v1/message/ \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"cid":"<COMMUNITY_ID>","text":"Hello all"}'
```

List messages (filters and pagination):

- Endpoint: `GET /message/`
- Query params:
  - `uid` (filter by user id)
  - `cid` (filter by community id)
  - `q` (text search on message contents — case-insensitive substring)
  - `skip`, `limit`

Example — list messages in a community containing "hello":

```bash
curl -sS "http://localhost:8000/api/v1/message/?cid=<COMMUNITY_ID>&q=hello&skip=0&limit=20" \
  -H "Authorization: Bearer ${TOKEN}"
```

Update a message (message owner or community owner):

- Endpoint: `PUT /message/{message_id}`
- Body: `{ "text": "Updated text" }` (any `cid` in the payload is ignored)

Example:

```bash
curl -sS -X PUT "http://localhost:8000/api/v1/message/<MESSAGE_ID>" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"cid":"<COMMUNITY_ID>","text":"Updated message"}'
```

Delete a message (message owner or community owner):

```bash
curl -sS -X DELETE "http://localhost:8000/api/v1/message/<MESSAGE_ID>" \
  -H "Authorization: Bearer ${TOKEN}"
```

3) Locations, Businesses, Events — listing and search

A number of list endpoints support a `q` text filter (case-insensitive regex) and optional position-based nearby filtering.

Common parameters (listing endpoints):

- `q` — text search (case-insensitive substring) applied to relevant fields (name, description, short_description, etc.)
- `position_lat` — latitude for nearby filter
- `position_lng` — longitude for nearby filter
- `radius_m` — radius in meters (default behavior varies; location defaults to 1000m if coordinates are given without radius)
- `skip` / `limit` — pagination

Examples — Locations

- Text search:
```bash
curl -sS "http://localhost:8000/api/v1/location/?q=park&skip=0&limit=20" \
  -H "Authorization: Bearer ${TOKEN}"
```

- Nearby search (latitude/longitude/radius):
```bash
curl -sS "http://localhost:8000/api/v1/location/?position_lat=<LAT>&position_lng=<LNG>&radius_m=<RADIUS>&skip=0&limit=20" \
  -H "Authorization: Bearer ${TOKEN}"
```

Examples — Businesses

- Text search:
```bash
curl -sS "http://localhost:8000/api/v1/business/?q=coffee&skip=0&limit=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

- Nearby businesses (bbox-based filter that finds businesses whose associated location is within the area):
```bash
curl -sS "http://localhost:8000/api/v1/business/?position_lat=<LAT>&position_lng=<LNG>&radius_m=<RADIUS>" \
  -H "Authorization: Bearer ${TOKEN}"
```

Examples — Events

- Events are implemented as businesses with a specific `type_id`. Use the same `q` and position params as businesses:
```bash
curl -sS "http://localhost:8000/api/v1/event/?q=music&position_lat=<LAT>&position_lng=<LNG>&radius_m=<RADIUS>" \
  -H "Authorization: Bearer ${TOKEN}"
```

Notes and recommendations

- Text search uses MongoDB regex. If you expect large datasets and need fast search, create MongoDB text indexes and switch to `$text` queries.
- Location nearby search performs an initial bounding-box filter and then (for locations) precise haversine distance checks; businesses currently use the bbox to find matching locations and filter by `l_id`.
- Ensure `connect_to_mongo()` is called (app startup handles this); tokens must be valid (JWT with `sub` claim) and are valid for 3 hours.
- Membership management (join/leave): membership is stored in `user_communities`. Creating a community adds the creator as an `owner`. If you want explicit join/leave endpoints, they can be added (e.g., `POST /communities/{cid}/join` and `/leave`).

Troubleshooting

- 401 Unauthorized: token missing, expired, or invalid.
- 403 Forbidden: action requires membership or owner role.
- 400 Bad Request: invalid ObjectId, missing/invalid fields, or text constraints (empty or >1000 chars).

If you want, I can:

- Add join/leave endpoints and a members listing endpoint.
- Generate a Postman collection or an OpenAPI/Swagger-ready example collection.
- Add tests that exercise these flows.

---

Generated on 2025-12-01 — adjust host/port as needed for your deployment.
