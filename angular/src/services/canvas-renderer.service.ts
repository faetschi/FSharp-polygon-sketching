import { Injectable } from "@angular/core";
import { Point, Polyline, CanvasState } from "../app/types/types";

Injectable({
  providedIn: 'root',
});
export class CanvasRendererService {
  clear(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
  }

  drawState(ctx: CanvasRenderingContext2D, polylines: CanvasState): void {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    polylines.forEach((polyline: Polyline) => {
      this.drawSinglePolyline(ctx, polyline);
    });
  }

  drawPreviewLine(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.strokeStyle = '#ef4444';
    ctx.stroke();
    ctx.restore();
  }

  private drawSinglePolyline(
    ctx: CanvasRenderingContext2D,
    polyline: Polyline
  ): void {
    const points = polyline.points;
    if (points.length === 0) 
      return;

    ctx.strokeStyle = polyline.color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    // Close polygon
    if (polyline.isClosed) {
      ctx.closePath();
    }

    ctx.stroke();

    // Draw points
    ctx.fillStyle = polyline.color;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
