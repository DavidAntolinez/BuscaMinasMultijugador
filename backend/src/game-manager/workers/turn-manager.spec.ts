import { TurnManager } from './turn-manager';

describe('TurnManager', () => {
  let turnManager: TurnManager;

  beforeEach(() => {
    turnManager = new TurnManager();
  });

  it('should create shuffled turn order containing all players', () => {
    const order = turnManager.setupOrder(['p1', 'p2', 'p3']);

    expect(order).toHaveLength(3);
    expect(order.sort()).toEqual(['p1', 'p2', 'p3']);
    expect(order).toContain(turnManager.getCurrentPlayerId());
  });

  it('should advance turn cyclically', () => {
    const order = turnManager.setupOrder(['p1', 'p2']);

    expect(turnManager.getCurrentPlayerId()).toBe(order[0]);

    const firstAdvance = turnManager.advanceTurn();
    expect(firstAdvance.previousPlayerId).toBe(order[0]);
    expect(firstAdvance.nextPlayerId).toBe(order[1]);

    const secondAdvance = turnManager.advanceTurn();
    expect(secondAdvance.nextPlayerId).toBe(order[0]);
  });

  it('should calculate remaining time', () => {
    const startedAt = new Date(Date.now() - 30_000);
    const remaining = turnManager.getRemainingMs(startedAt);

    expect(remaining).toBeGreaterThan(80_000);
    expect(remaining).toBeLessThanOrEqual(TurnManager.TURN_DURATION_MS);
  });

  it('should clear timer without throwing', () => {
    turnManager.startTimer(() => undefined);
    expect(() => turnManager.clearTimer()).not.toThrow();
  });
});
