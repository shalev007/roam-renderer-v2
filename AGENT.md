## 🛠️ Project Overview: Roam Renderer Renderer

The Roam Renderer is a specialized tool designed to parse a proprietary, semi-structured Markdown dialect (Roam v1.0 spec) into a cohesive, strongly-typed internal data model (`RoamTrip`). Its core purpose is to transform travel logs and notes written in the Roam format into a structured JavaScript representation that can be analyzed for metrics, duration, and costs.

### ✨ Core Concepts (`roam_spec_v1.0.md`)

1.  **The Trip**: A trip is fundamentally defined as a **chain of nodes connected by edges** (`node > edge > node > ...`).
2.  **Primitives**: Understanding the special characters is crucial:
    *   `>`: Defines an **Edge** (movement/transit mode).
    *   `|`: **Property Separator** within a single item (Node or Edge).
    *   `@`: **Timestamp**. Indicates arrival time on a Node or departure time on an Edge. *Crucial: Time differences allow for automatic calculation of duration/travel time.*
    *   `#`: **Tag** or **Location**.
        *   `#tag`: A simple tag (e.g., `#must-see`).
        *   `#loc(lat,lng)`: Precise GeoPointer location data.
    *   `$`: **Cost**. Always appears with `amount` and `currency` (e.g., `$15ils`).
    *   `?`: **Note/Link**. Free text note or a URI link (`?link:url`).

### 💾 Data Model Structure (`src/types.ts`)

The rendered data is composed of several linked interfaces:

*   **`RoamNode`**: Represents a place visited.
    *   `name`: The human-readable name of the place (or "The place").
    *   `type`: Must be `"node"`.
    *   `arrival`: The expected time of arrival (`Timestamp`).
    *   `location`: Optional geo-coordinates (`Location`).
    *   `costs`: Array of incurred costs (`Cost`).
    *   `notes`: Array of free-text notes/links (`Note`).
*   **`RoamEdge`**: Represents movement between nodes.
    *   `type`: Must be `"edge"`.
    *   `mode`: The transport method (e.g., `train`, `walk`).
    *   `departure`: The expected departure time (`Timestamp`).
    *   `costs`: Optional costs incurred during transit.
*   **`RoamTrip`**: The complete itinerary, defined as a plain array of alternating `RoamNode` and `RoamEdge` objects.

### ⚙️ Core Logic

#### 1. Parsing (`src/parser.ts`)
The `parse(input: string)` function is responsible for tokenizing the raw Markdown string and constructing the `RoamTrip` array. It processes line by line, determining if an item is a Node or an Edge based on the presence of the `>` character, and then calling helper functions to parse properties (timestamp, location, cost, etc.) separated by `|`.

#### 2. Validation (`src/validator.ts`)
The `validate(trip: RoamTrip)` function ensures the structural and temporal integrity of the parsed trip:
*   **Structure**: Must start and end with a Node.
*   **Alternation**: Must strictly alternate between `Node` and `Edge` types (`Node -> Edge -> Node -> ...`).
*   **Chronology**: All timestamps must be monotonically non-decreasing. If time moves backward, an error is thrown.
*   **Mandatory Fields**: Nodes must have a name, and edges must have a transport mode.

### 📈 Derived Data

The system also supports the calculation of derived data which is *never* written to the input file:
*   **Duration at a Place**: Calculated by `next_edge.departure @ - current_node.arrival @`.
*   **Travel Time**: Calculated by `next_node.arrival @ - current_edge.departure @`.
*   **Total Cost/Distance/Speed**: Aggregated across the whole trip.
"