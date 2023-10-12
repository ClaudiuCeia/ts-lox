import { Environment } from "./Environment.ts";
import { Interpreter, ReturnException } from "./Interpreter.ts";
import { LoxInstance } from "./LoxInstance.ts";
import { Func } from "./generated/Stmt.ts";

export abstract class LoxCallable {
  abstract arity: number;
  abstract call(interpreter: Interpreter, args: unknown[]): unknown;
  abstract toString(): string;
}

export class LoxFunction extends LoxCallable {
  constructor(
    private readonly declaration: Func,
    private readonly closure: Environment,
    private readonly isInitializer: boolean
  ) {
    super();
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
        if (this.isInitializer) {
          return this.closure.getAt(0, "this");
        }
        return error.value;
      }
    }

    if (this.isInitializer) {
      return this.closure.getAt(0, "this");
    }

    return null;
  }

  public bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
  }

  public toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
