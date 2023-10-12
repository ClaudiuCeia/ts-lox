import { Environment } from "./Environment.ts";
import { Interpreter, ReturnException } from "./Interpreter.ts";
import { Func } from "./Stmt.ts";

export abstract class LoxCallable {
  abstract arity: number;
  abstract call(interpreter: Interpreter, args: unknown[]): unknown;
  abstract toString(): string;
}

export class LoxFunction extends LoxCallable {
  constructor(
    private readonly declaration: Func,
    private readonly closure: Environment
  ) {
    super();
    this.declaration = declaration;
  }

  get arity(): number {
    return this.declaration.params.length;
  }

  public call(interpreter: Interpreter, args: unknown[]) {
    const environment = new Environment(this.closure);
    for (const [idx, param] of this.declaration.params.entries()) {
      environment.define(param.lexeme, args[idx]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error) {
      if (error instanceof ReturnException) {
        return error.value;
      }
    }

    return null;
  }

  public toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
