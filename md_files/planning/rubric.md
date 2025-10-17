##Section 1: Core Collaborative Infrastructure
#Real-Time Synchronization
Sub-100ms object sync
Sub-50ms cursor sync
Zero visible lag during rapid multi-user edits

#Conflict Resolution & State Management
Two users edit same object simultaneously → both see consistent final state
Documented strategy (last-write-wins, CRDT, OT, etc.)
No "ghost" objects or duplicates
Rapid edits (10+ changes/sec) don't corrupt state
Clear visual feedback on who last edited

#Testing Scenarios for Conflict Resolution:
Simultaneous Move: User A and User B both drag the same rectangle at the same time
Rapid Edit Storm: User A resizes object while User B changes its color while User C moves it
Delete vs Edit: User A deletes an object while User B is actively editing it
Create Collision: Two users create objects at nearly identical timestamps


#Persistence & Reconnection
User refreshes mid-edit → returns to exact state
All users disconnect → canvas persists fully
Network drop (30s+) → auto-reconnects with complete state
Operations during disconnect queue and sync on reconnect
Clear UI indicator for connection status

#Testing Scenarios for Persistence:
Mid-Operation Refresh: User drags object, refreshes browser mid-drag → object position preserved
Total Disconnect: All users close browsers, wait 2 minutes, return → full canvas state intact
Network Simulation: Throttle network to 0 for 30 seconds, restore → canvas syncs without data loss
Rapid Disconnect: User makes 5 rapid edits, immediately closes tab → edits persist for other users


##Section 2: Canvas Features & Performance
#Canvas Functionality
Smooth pan/zoom
3+ shape types
Text with formatting
Multi-select (shift-click or drag)
Layer management
Transform operations (move/resize/rotate)
Duplicate/delete

#Performance & Scalability (12 points)
Consistent performance with 500+ objects
Supports 5+ concurrent users
No degradation under load
Smooth interactions at scale


##Section 3: Advanced Figma-Inspired Features (15 points)

#Feature Tiers
#Tier 1 Features  (Choose 3 easiest to implement/lowest risk)
Color picker with recent colors/saved palettes
Undo/redo with keyboard shortcuts (Cmd+Z/Cmd+Shift+Z)
Keyboard shortcuts for common operations (Delete, Duplicate, Arrow keys to move)
Export canvas or objects as PNG/SVG
Snap-to-grid or smart guides when moving objects
Object grouping/ungrouping
Copy/paste functionality

Tier 2 Features (Choose 2 easiest to implement/lowest risk)
Component system (create reusable components/symbols)
Layers panel with drag-to-reorder and hierarchy
Alignment tools (align left/right/center, distribute evenly)
Z-index management (bring to front, send to back)
Selection tools (lasso select, select all of type)
Styles/design tokens (save and reuse colors, text styles)
Canvas frames/artboards for organizing work


Tier 3 Features (Choose 1 easiest to implement/lowest risk)
Auto-layout (flexbox-like automatic spacing and sizing)
Collaborative comments/annotations on objects
Version history with restore capability
Plugins or extensions system
Vector path editing (pen tool with bezier curves)
Advanced blend modes and opacity
Prototyping/interaction modes (clickable links between frames)


##Section 4: AI Canvas Agent
#Command Breadth & Capability
8+ distinct command types
Covers all categories: creation, manipulation, layout, complex
Commands are diverse and meaningful


##AI Command Categories (must demonstrate variety):
#Creation Commands (choose 2 easiest to implement)
"Create a red circle at position 100, 200"
"Add a text layer that says 'Hello World'"
"Make a 200x300 rectangle"

#Manipulation Commands (choose 2 easiest to implement)
"Move the blue rectangle to the center"
"Resize the circle to be twice as big"
"Rotate the text 45 degrees"

#Layout Commands (choose 1 easiest to implement)
"Arrange these shapes in a horizontal row"
"Create a grid of 3x3 squares"
"Space these elements evenly"


#Complex Commands (choose 1 easiest to implement)
"Create a login form with username and password fields"
"Build a navigation bar with 4 menu items"
"Make a card layout with title, image, and description"
Complex Command Execution (8 points)

#AI Grading Criteria:
"Create login form" produces 3+ properly arranged elements
Complex layouts execute multi-step plans correctly
Smart positioning and styling
Handles ambiguity well

#AI Performance & Reliability
Sub-2 second responses
90%+ accuracy
Natural UX with feedback
Shared state works flawlessly
Multiple users can use AI simultaneously


##Section 5: Technical Implementation
#Architecture Quality
Clean, well-organized code
Clear separation of concerns
Scalable architecture
Proper error handling
Modular components

#Authentication & Security (5 points)
Robust auth system
Secure user management
Proper session handling
Protected routes
No exposed credentials

#Section 6: Documentation & Submission Quality
Clear README
Detailed setup guide
Architecture documentation
Easy to run locally
Dependencies listed
Supports 5+ users
Fast load times
