import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CanvasState, Point } from '../../types/types';
import { CanvasRendererService } from '../../../services/canvas-renderer.service';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent implements AfterViewInit, OnChanges {
  @Input() width = 800;
  @Input() height = 600;
  @Input() polylines: CanvasState = [];

  @Input() activePoint: Point | null = null;

  @Output() pointClicked = new EventEmitter<Point>();
  @Output() pathFinished = new EventEmitter<void>();

  @ViewChild('drawingCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private renderer = inject(CanvasRendererService);

  private currentMousePos: Point | null = null;

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.redraw();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['polylines'] || changes['activePoint']) && this.ctx) {
      this.redraw();
    }
  }

  handleCanvasClick(event: MouseEvent) {
    event.stopPropagation();
    const point = this.getPointFromEvent(event);
    this.pointClicked.emit(point);
  }

  handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.pathFinished.emit();
  }

  handleMouseMove(event: MouseEvent) {
    if (this.activePoint) {
      this.currentMousePos = this.getPointFromEvent(event);
      this.redraw();
    }
  }

  handleMouseLeave() {
    this.currentMousePos = null;
    this.redraw();
  }

  private getPointFromEvent(event: MouseEvent): Point {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private redraw() {
    if (!this.ctx) return;

    this.renderer.clear(this.ctx, this.width, this.height);
    this.renderer.drawState(this.ctx, this.polylines);

    // Draw Preview
    if (this.activePoint && this.currentMousePos) {
      this.renderer.drawPreviewLine(
        this.ctx,
        this.activePoint,
        this.currentMousePos
      );
    }
  }
}