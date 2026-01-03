import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.SwingUtilities;

// --- 1. DATA MODEL (Mutable) ---

// Simple coordinate class
class Point {
    double x, y;

    public Point(double x, double y) {
        this.x = x;
        this.y = y;
    }
}

// Equivalent to PolyLine in F#
class Polygon {
    // In Java, we use a mutable List
    List<Point> vertices = new ArrayList<>();

    public void addVertex(Point p) {
        vertices.add(p);
    }
    
    // Deep copy for Undo/Redo mechanisms
    public Polygon copy() {
        Polygon newPoly = new Polygon();
        for (Point p : this.vertices) {
            newPoly.addVertex(new Point(p.x, p.y));
        }
        return newPoly;
    }
}

// The "Model" - equivalent to type Model in F#
// BUT: It does not hold 'past' or 'future' inside itself
// In OOP, history is usually managed externally by the Controller/Application
class CanvasState {
    List<Polygon> finishedPolygons = new ArrayList<>();
    Polygon currentPolygon = null; // null represents Option.None
    Point mousePos = null;         // null represents Option.None

    // We need a way to clone the WHOLE state to save it for Undo
    public CanvasState deepCopy() {
        CanvasState newState = new CanvasState();
        
        // Copy finished polygons
        for (Polygon p : this.finishedPolygons) {
            newState.finishedPolygons.add(p.copy());
        }
        
        // Copy current polygon
        if (this.currentPolygon != null) {
            newState.currentPolygon = this.currentPolygon.copy();
        }
        
        // usually we dont need to undo mouse movement, 
        // but if we do, copy it here.
        newState.mousePos = this.mousePos; 
        
        return newState;
    }
}

// --- 2. VIEW & CONTROLLER ---

public class PolygonApp extends JFrame {

    // The Mutable State
    private CanvasState state = new CanvasState();

    // History Stacks
    private Stack<CanvasState> undoStack = new Stack<>();
    private Stack<CanvasState> redoStack = new Stack<>();

    private DrawingPanel canvas;

    public PolygonApp() {
        setTitle("Simplest Drawing (Java OOP)");
        setSize(500, 600); // Extra height for buttons
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());

        // Top Toolbar for Undo/Redo
        JPanel toolbar = new JPanel();
        JButton btnUndo = new JButton("Undo");
        JButton btnRedo = new JButton("Redo");

        btnUndo.addActionListener(e -> performUndo());
        btnRedo.addActionListener(e -> performRedo());

        toolbar.add(btnUndo);
        toolbar.add(btnRedo);
        add(toolbar, BorderLayout.NORTH);

        // The Drawing Canvas
        canvas = new DrawingPanel();
        add(canvas, BorderLayout.CENTER);

        // --- Event Listeners ---
        
        MouseAdapter mouseController = new MouseAdapter() {
            @Override
            public void mouseMoved(MouseEvent e) {
                // Equivalent to: SetCursorPos
                //  info: state for mouse moves is not saved
                state.mousePos = new Point(e.getX(), e.getY());
                canvas.repaint(); // Trigger Render
            }

            @Override
            public void mouseClicked(MouseEvent e) {
                Point p = new Point(e.getX(), e.getY());

                if (e.getClickCount() == 2) {
                    // --- Double Click: FinishPolygon ---
                    saveStateForUndo(); // Snapshot before mutation
                    
                    if (state.currentPolygon != null && !state.currentPolygon.vertices.isEmpty()) {
                        state.finishedPolygons.add(state.currentPolygon);
                        state.currentPolygon = null; // Reset to None
                    }
                    redoStack.clear(); // Clear redo on new action
                } else {
                    // --- Single Click: AddPoint ---
                    saveStateForUndo(); // Snapshot before mutation
                    
                    if (state.currentPolygon == null) {
                        state.currentPolygon = new Polygon();
                    }
                    state.currentPolygon.addVertex(p);
                    redoStack.clear();
                }
                canvas.repaint();
            }
        };

        canvas.addMouseListener(mouseController);
        canvas.addMouseMotionListener(mouseController);
    }

    // --- LOGIC: Undo/Redo Helpers ---
    
    private void saveStateForUndo() {
        // Push a DEEP COPY of the current state to the stack
        undoStack.push(state.deepCopy());
    }

    private void performUndo() {
        if (undoStack.isEmpty()) return;

        // Save current state to Redo stack
        redoStack.push(state.deepCopy());

        // Pop previous state and become it
        state = undoStack.pop();
        
        // probably want to keep the current mouse position "live" 
        // rather than reverting to where the mouse was 5mins ago
        // = might technically ignore mousePos from the restored state
        
        canvas.repaint();
    }

    private void performRedo() {
        if (redoStack.isEmpty()) return;

        // Save current to Undo
        undoStack.push(state.deepCopy());

        // Pop future state
        state = redoStack.pop();
        canvas.repaint();
    }

    // --- 3. RENDERING (View) ---
    
    private class DrawingPanel extends JPanel {
        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g;
            
            // Antialiasing for smoother lines (closer to SVG look)
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2.setStroke(new BasicStroke(2));

            // 1. Draw Finished Polygons (Green)
            g2.setColor(Color.GREEN);
            for (Polygon poly : state.finishedPolygons) {
                drawPolyLine(g2, poly.vertices);
            }

            // 2. Draw Current Polygon (Red)
            if (state.currentPolygon != null) {
                g2.setColor(Color.RED);
                
                // If we are moving the mouse, we need to simulate the preview line
                // The F# code creates a TEMPORARY list: (preview :: p)
                List<Point> pointsToDraw = new ArrayList<>(state.currentPolygon.vertices);
                
                if (state.mousePos != null) {
                    pointsToDraw.add(state.mousePos); // Add preview point to end
                }
                
                drawPolyLine(g2, pointsToDraw);
            }
        }

        // Helper to draw the lines between a list of points
        private void drawPolyLine(Graphics2D g2, List<Point> points) {
            if (points.size() < 2) return;

            for (int i = 0; i < points.size() - 1; i++) {
                Point p1 = points.get(i);
                Point p2 = points.get(i+1);
                g2.drawLine((int)p1.x, (int)p1.y, (int)p2.x, (int)p2.y);
            }
        }
    }

    // Entry Point
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            new PolygonApp().setVisible(true);
        });
    }
}