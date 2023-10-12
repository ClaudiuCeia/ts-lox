import { Token } from "./Token.ts";
import { RuntimeError } from "./Interpreter.ts";

export class Environment {
  private values = new Map<string, unknown>();

  constructor(readonly enclosing: Environment | null = null) {}

  public get(token: Token): unknown {
    if (this.values.has(token.lexeme)) {
      return this.values.get(token.lexeme);
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(token);
    }

    throw new RuntimeError(token, `Undefined variable '${token.lexeme}'.`);
  }

  public define(name: string, value: unknown): void {
    this.values.set(name, value);
  }

  public assign(token: Token, value: unknown): void {
    if (this.values.has(token.lexeme)) {
      this.values.set(token.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(token, value);
      return;
    }

    throw new RuntimeError(token, `Undefined variable '${token.lexeme}'.`);
  }

  public getAt(distance: number, name: string): unknown {
    return this.ancestor(distance).values.get(name);
  }

  public ancestor(distance: number): Environment {
    // deno-lint-ignore no-this-alias
    let environment: Environment = this;

    for (let i = 0; i < distance; i++) {
      environment = environment.enclosing!;
    }

    return environment;
  }

  public assignAt(distance: number, name: Token, value: unknown): void {
    this.ancestor(distance).values.set(name.lexeme, value);
  }
}
