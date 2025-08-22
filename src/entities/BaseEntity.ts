import 'phaser';
import { IEntityState } from '@/types/GameTypes';
import { eventBus } from '@/utils/EventBus';

/**
 * Base class for all game entities with ECS-inspired architecture
 */
export abstract class BaseEntity extends Phaser.GameObjects.Container {
  protected entityState: IEntityState;
  protected components: Map<string, any> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number, id?: string) {
    super(scene, x, y);
    
    this.entityState = {
      id: id || this.generateId(),
      active: true,
      position: { x, y }
    };

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Update method called every frame
   */
  public abstract update(time: number, delta: number): void;

  /**
   * Get the entity's current state
   */
  public getEntityState(): IEntityState {
    return { ...this.entityState };
  }

  /**
   * Update the entity's position in state
   */
  public updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.entityState.position = { x, y };
  }

  /**
   * Set entity active/inactive
   */
  public setEntityActive(active: boolean): void {
    this.entityState.active = active;
    this.setVisible(active);
  }

  /**
   * Emit an event through the global event bus
   */
  protected emitEvent(event: string, data?: any): void {
    eventBus.emit(event, { entityId: this.entityState.id, ...data });
  }

  /**
   * Add a component to this entity
   */
  protected addComponent<T>(name: string, component: T): void {
    this.components.set(name, component);
  }

  /**
   * Get a component from this entity
   */
  protected getComponent<T>(name: string): T | null {
    return this.components.get(name) || null;
  }

  /**
   * Remove a component from this entity
   */
  protected removeComponent(name: string): boolean {
    return this.components.delete(name);
  }

  /**
   * Check if entity has a specific component
   */
  protected hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Generate a unique ID for the entity
   */
  private generateId(): string {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up entity resources
   */
  public destroy(fromScene?: boolean): void {
    this.components.clear();
    super.destroy(fromScene);
  }
}