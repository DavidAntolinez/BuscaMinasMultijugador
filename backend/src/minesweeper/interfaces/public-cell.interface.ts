export interface PublicCell {
  row: number;
  column: number;
  revealed: boolean;
  flagged: boolean;
  adjacentMines?: number;
  hasMine?: boolean;
}
