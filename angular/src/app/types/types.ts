export interface Point {
  x: number;
  y: number;
}
export interface Polyline {
  points: Point[];
  isClosed: boolean;
  color: string;
}

export type CanvasState = Polyline[];
