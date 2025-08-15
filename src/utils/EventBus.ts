import { IEventBus, EventCallback } from '@/types/GameTypes';

/**
 * Central event bus for decoupled communication between game systems
 */
export class EventBus implements IEventBus {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Subscribe to an event
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from an event
   */
  public off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // Clean up empty event arrays
      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  public emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      // Create a copy to avoid issues if callbacks modify the array
      const callbacksCopy = [...callbacks];
      callbacksCopy.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Clear all event subscriptions
   */
  public clear(): void {
    this.events.clear();
  }

  /**
   * Get the number of subscribers for an event
   */
  public getSubscriberCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }

  /**
   * Get all registered event names
   */
  public getEventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Check if an event has any subscribers
   */
  public hasSubscribers(event: string): boolean {
    return this.getSubscriberCount(event) > 0;
  }
}

// Global event bus instance
export const eventBus = new EventBus();