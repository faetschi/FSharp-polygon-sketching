import { Component, HostListener, signal } from '@angular/core';
import { CanvasComponent } from './components/canvas/canvas.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { Point as Point, Polyline, CanvasState } from './types/types';
import { CanvasRendererService } from '../services/canvas-renderer.service';

@Component({
  selector: 'app-root',
  imports: [CanvasComponent, ToolbarComponent],
  providers: [CanvasRendererService],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  polylines: CanvasState = [];

  private history: CanvasState[] = [[]];
  private currentStep = 0;

  private shouldStartNewPath = true;
  isPathActive = signal(false);

  getActivePoint(): Point | null {
    if (!this.isPathActive() || this.polylines.length === 0) {
      return null;
    }
    const currentPolyline = this.polylines[this.polylines.length - 1];
    if (currentPolyline.points.length === 0) {
      return null;
    }
    return currentPolyline.points[currentPolyline.points.length - 1];
  }

  onPointAdded(point: Point) {
    const newPolylines: CanvasState = JSON.parse(
      JSON.stringify(this.polylines)
    );

    if (this.shouldStartNewPath) {
      const newPolyline: Polyline = {
        points: [point],
        color: '#ef4444',
        isClosed: false,
      };

      newPolylines.push(newPolyline);
      this.shouldStartNewPath = false;
      this.isPathActive.set(true);
    } else {
      if (newPolylines.length > 0) {
        const currentPolyline = newPolylines[newPolylines.length - 1];
        currentPolyline.points.push(point);
      } else {
        newPolylines.push({
          points: [point],
          color: '#ef4444',
          isClosed: false,
        });
      }
    }

    this.updateHistory(newPolylines);
  }

  onFinishPath() {
    if (this.polylines.length === 0 || !this.isPathActive()) return;

    const newPolylines: CanvasState = JSON.parse(
      JSON.stringify(this.polylines)
    );
    const lastPolyline = newPolylines[newPolylines.length - 1];

    // Close Polyongon by adding the starting point to the end
    if (lastPolyline.points.length > 0) {
      const startPoint = { ...lastPolyline.points[0] };
      // Check if the last click was not exactly the same (double click artifact)
      const endPoint = lastPolyline.points[lastPolyline.points.length - 1];

      if (startPoint.x !== endPoint.x || startPoint.y !== endPoint.y) {
        lastPolyline.points.push(startPoint);
      }
    }
    lastPolyline.color = '#22c55e';
    lastPolyline.isClosed = true;

    this.shouldStartNewPath = true;
    this.isPathActive.set(false);

    this.updateHistory(newPolylines);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // ingore button clicks
    if (target.closest('button')) {
      return;
    }

    if (!this.shouldStartNewPath) {
      this.shouldStartNewPath = true;
      this.isPathActive.set(false);
    }
  }

  //#region  --- History Logic ---
  private updateHistory(newState: CanvasState) {
    if (this.currentStep < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentStep + 1);
    }
    this.history.push(newState);
    this.currentStep++;
    this.polylines = newState;
  }

  undo() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.polylines = JSON.parse(
        JSON.stringify(this.history[this.currentStep])
      );
      this.shouldStartNewPath = true;
      this.isPathActive.set(false);
    }
  }

  redo() {
    if (this.currentStep < this.history.length - 1) {
      this.currentStep++;
      this.polylines = JSON.parse(
        JSON.stringify(this.history[this.currentStep])
      );
      this.shouldStartNewPath = true;
      this.isPathActive.set(false);
    }
  }

  clearCanvas() {
    this.updateHistory([]);
    this.shouldStartNewPath = true;
    this.isPathActive.set(false);
  }

  canUndo(): boolean {
    return this.currentStep > 0;
  }

  canRedo(): boolean {
    return this.currentStep < this.history.length - 1;
  }
  //#endregion
}
