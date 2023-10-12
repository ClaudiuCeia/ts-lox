import { Token } from "./Token.ts";
import { RuntimeError } from "./Interpreter.ts";
import { LoxClass } from "./LoxClass.ts";

export class LoxInstance {
  private readonly fields = new Map<string, unknown>();

  constructor(readonly klass: LoxClass) {}

  public get(name: Token): unknown {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    const method = this.klass.findMethod(name.lexeme);
    if (method !== null) {
      return method.bind(this);
    }

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  public set(name: Token, value: unknown): void {
    this.fields.set(name.lexeme, value);
  }

  public toString(): string {
    return `${this.klass.name} instance`;
  }
}
