export class Stack<T> {
  private readonly items: T[] = [];

  public get length(): number {
    return this.items.length;
  }

  public peek(): T {
    return this.items[this.items.length - 1];
  }

  public pop(): T | undefined {
    return this.items.pop();
  }

  public push(item: T): void {
    this.items.push(item);
  }

  public get(index: number): T {
    return this.items[index];
  }

  public size(): number {
    return this.items.length;
  }
}
