# Architecture Documentation

## System Overview

This application implements a real-time collaborative drawing canvas using a client-server architecture with WebSocket communication.

## Data Flow Diagram

User Input → Canvas Layer → WebSocket Client → Server → All Connected Clients → Canvas Rendering
↓ ↓
Local Prediction Operation History


## WebSocket Protocol

### Message Types

#### Client → Server

1. **draw-start**
{
points: [{x, y}],
color: "#000000",
width: 3
}


2. **draw-continue**
{
points: [{x, y}, ...],
strokeId: "unique_id"
}


3. **draw-end**
{
points: [{x, y}, ...],
strokeId: "unique_id"
}


4. **cursor-move**
{
x: 100,
y: 150
}


5. **undo / redo / clear-canvas**
- No payload, triggers server-side operation

#### Server → Client

1. **init**
{
userId: "socket_id",
userColor: "#FF6B6B",
operations: [...],
users: [...]
}


2. **draw-start / draw-continue / draw-end**
- Echoes drawing events to all other clients

3. **cursor-move**
{
userId: "socket_id",
x: 100,
y: 150,
color: "#FF6B6B"
}


4. **undo / redo**
{
operationId: "op_id",
currentIndex: 42
}


## Canvas Architecture

### Layer System

Four stacked canvas layers for performance optimization:

1. **Background Layer** (z-index: 1)
   - Static grid background
   - Never redrawn during interactions

2. **Drawing Layer** (z-index: 2)
   - Committed strokes from all users
   - Redrawn only on undo/redo

3. **Active Layer** (z-index: 3)
   - Current user's in-progress stroke
   - Cleared on stroke completion

4. **Cursor Layer** (z-index: 4)
   - Remote user cursor positions
   - Updated at 60fps
   - Non-interactive (pointer-events: none)

### Drawing Optimization

**Point Batching:**
- Mouse events fire at ~100-200Hz
- Points batched every 16ms (~60fps)
- Reduces network traffic by 3-10x

**Smooth Rendering:**
- Quadratic curves between points
- Line cap: round, line join: round
- Reduces "jagged" appearance

**Local Prediction:**
- Draw immediately on active layer
- Show stroke before server confirmation
- Provides instant feedback (0ms perceived latency)

## Global Undo/Redo Strategy

### Server-Authoritative Model

The server maintains the **single source of truth**:

class DrawingState {
operations: [] // All operations in order
currentIndex: -1 // Pointer to "present"
}


**Undo Process:**
1. Client sends undo command
2. Server decrements currentIndex
3. Server broadcasts undo event
4. All clients request fresh state
5. Clients redraw from operations[0...currentIndex]

**Redo Process:**
1. Client sends redo command
2. Server increments currentIndex
3. Server sends operation to redraw
4. All clients apply operation

### Conflict Resolution

**Scenario: User A draws while User B undoes**

1. User B sends undo → server decrements index
2. User A's new stroke arrives → server adds to operations[]
3. Server increments index (new operation)
4. All clients receive state update
5. Result: B's undo succeeded, A's stroke added after

**Key principle:** Operations are immutable and ordered by server reception time.

## Performance Decisions

### 1. Event Batching
**Decision:** Batch drawing points every 16ms  
**Reason:** Reduces WebSocket messages from ~100/sec to ~60/sec  
**Trade-off:** Slight delay in remote rendering (imperceptible)

### 2. Layer Separation
**Decision:** Use 4 separate canvas layers  
**Reason:** Avoid expensive full canvas redraws  
**Trade-off:** More DOM elements, but 5-10x rendering performance

### 3. Cursor Throttling
**Decision:** Send cursor updates every 50ms (20fps)  
**Reason:** Balance between smooth presence and bandwidth  
**Trade-off:** Slightly laggy cursor movement for remote users

### 4. History Limit
**Decision:** Maximum 500 operations in memory  
**Reason:** Prevent memory leaks in long sessions  
**Trade-off:** Can't undo beyond 500 operations

### 5. Quadratic Curve Smoothing
**Decision:** Use quadraticCurveTo for stroke rendering  
**Reason:** Creates smooth, natural-looking lines  
**Trade-off:** Slightly more complex calculation

## Scaling Considerations

**Current Limitations:**
- Single server instance (no horizontal scaling)
- In-memory state (lost on server restart)
- No database persistence

**How to Scale to 1000 Concurrent Users:**

1. **Load Balancing**
   - Use sticky sessions (socket.io-redis adapter)
   - Distribute clients across multiple servers

2. **State Persistence**
   - Store operations in Redis/MongoDB
   - Implement event sourcing pattern

3. **Room Sharding**
   - Limit users per canvas (e.g., 10-20)
   - Create separate rooms/sessions

4. **CDN for Static Assets**
   - Serve client files from CDN
   - Reduce server load

5. **WebSocket Optimization**
   - Use binary protocol (msgpack instead of JSON)
   - Implement compression

## Code Organization

### Separation of Concerns

**Client:**
- `canvas.js`: Pure canvas operations, no network code
- `websocket.js`: Pure network operations, no canvas code
- `main.js`: Glue layer, event handlers

**Server:**
- `server.js`: Socket.io setup and event routing
- `drawing-state.js`: Pure business logic, no I/O
- `rooms.js`: Multi-room management

**Benefits:**
- Easy to test each module independently
- Can swap WebSocket for WebRTC without touching canvas code
- Can change canvas rendering without touching network code

## Error Handling

1. **Network Disconnection**
   - Socket.io auto-reconnects
   - Client requests full sync on reconnect

2. **Invalid Operations**
   - Server validates all incoming operations
   - Malformed data ignored (logged)

3. **Canvas Errors**
   - Try-catch around drawing operations
   - Fallback to full redraw on error

## Future Improvements

1. **Operational Transformation (OT)**
   - Handle truly concurrent operations
   - No full redraw on undo/redo

2. **CRDT-based State**
   - Conflict-free merging
   - Better offline support

3. **Database Persistence**
   - PostgreSQL for operation log
   - Redis for active sessions

4. **User Authentication**
   - JWT-based auth
   - Save personal canvases

5. **Advanced Tools**
   - Shapes (rectangle, circle, line)
   - Text tool
   - Image upload