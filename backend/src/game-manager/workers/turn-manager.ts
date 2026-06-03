export class TurnManager {
  static readonly TURN_DURATION_MS = 120_000;

  private turnOrder: string[] = [];
  private currentIndex = 0;
  private timer: NodeJS.Timeout | null = null;

  setupOrder(playerIds: string[]): string[] {
    this.turnOrder = this.shuffle([...playerIds]);
    this.currentIndex = 0;
    return [...this.turnOrder];
  }

  getCurrentPlayerId(): string | null {
    return this.turnOrder[this.currentIndex] ?? null;
  }

  getTurnOrder(): string[] {
    return [...this.turnOrder];
  }

  advanceTurn(): {
    previousPlayerId: string | null;
    nextPlayerId: string | null;
  } {
    const previousPlayerId = this.getCurrentPlayerId();

    if (this.turnOrder.length === 0) {
      return { previousPlayerId, nextPlayerId: null };
    }

    this.currentIndex = (this.currentIndex + 1) % this.turnOrder.length;

    return {
      previousPlayerId,
      nextPlayerId: this.getCurrentPlayerId(),
    };
  }

  startTimer(onTimeout: () => void): void {
    this.clearTimer();
    this.timer = setTimeout(onTimeout, TurnManager.TURN_DURATION_MS);
  }

  clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getRemainingMs(startedAt: Date | null): number | null {
    if (!startedAt) {
      return null;
    }

    const elapsed = Date.now() - startedAt.getTime();
    return Math.max(0, TurnManager.TURN_DURATION_MS - elapsed);
  }

  private shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }
}
