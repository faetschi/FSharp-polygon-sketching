# Polygon Sketching Web Application

This is a Spring Boot application for polygon sketching on an HTML5 Canvas.

## Getting Started

### Prerequisites
- JDK 17 or higher
- Maven

### Running the Application

#### Option 1: VS Code Task (Recommended)
1. Press `Ctrl+Shift+P`.
2. Type `Tasks: Run Task` and press `Enter`.
3. Select `Run Polygon Web App`.

#### Option 2: Terminal
Run the following commands:
```bash
cd java
C:\Users\Admin\.maven\maven-3.9.12\bin\mvn.cmd spring-boot:run
```
Once the application is running, open your browser and navigate to:
`http://localhost:8080`

## Features
- **Draw Polygons**: Click to add vertices, double-click to finish a polygon.
- **Undo/Redo**: Use the buttons to undo or redo your actions.
- **Clear All**: Reset the canvas.
- **Canvas-only Drawing**: Drawing is restricted to the canvas area.
