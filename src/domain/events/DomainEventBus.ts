import { DomainEvent, DomainEventHandler } from './DomainEvent';

export class DomainEventBus {
  private static instance: DomainEventBus | null = null;
  private handlers: Map<string, Set<DomainEventHandler>> = new Map();
  private eventHistory: DomainEvent[] = [];
  private maxHistorySize = 50;

  private constructor() {}

  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  /**
   * Đăng ký lắng nghe sự kiện domain
   * @returns Hàm hủy đăng ký (unsubscribe)
   */
  public subscribe<T = any>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as DomainEventHandler);

    return () => {
      this.unsubscribe(eventType, handler as DomainEventHandler);
    };
  }

  /**
   * Hủy đăng ký handler
   */
  public unsubscribe(eventType: string, handler: DomainEventHandler): void {
    const set = this.handlers.get(eventType);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Phát sự kiện tới tất cả các subscriber đã đăng ký
   */
  public publish<T = any>(event: DomainEvent<T>): void {
    // Lưu lịch sử để phục vụ audit/debug
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.pop();
    }

    const set = this.handlers.get(event.eventType);
    if (!set || set.size === 0) return;

    // Kích hoạt tất cả các handler đồng bộ an toàn
    for (const handler of Array.from(set)) {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`[DomainEventBus] Lỗi async trong handler sự kiện ${event.eventType}:`, err);
          });
        }
      } catch (err) {
        console.error(`[DomainEventBus] Lỗi đồng bộ trong handler sự kiện ${event.eventType}:`, err);
      }
    }
  }

  /**
   * Tạo nhanh và phát sự kiện
   */
  public emit<T = any>(eventType: string, payload: T): DomainEvent<T> {
    const event: DomainEvent<T> = {
      eventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      eventType,
      payload
    };
    this.publish(event);
    return event;
  }

  /**
   * Xóa toàn bộ handlers và history (dùng trong unit test)
   */
  public clear(): void {
    this.handlers.clear();
    this.eventHistory = [];
  }

  /**
   * Lấy lịch sử sự kiện gần nhất
   */
  public getHistory(): readonly DomainEvent[] {
    return [...this.eventHistory];
  }
}

export const domainEventBus = DomainEventBus.getInstance();
