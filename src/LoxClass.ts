import { Interpreter } from "./Interpreter.ts";
import { LoxCallable, LoxFunction } from "./LoxFunction.ts";
import { LoxInstance } from "./LoxInstance.ts";

export class LoxClass extends LoxCallable {
  constructor(
    readonly name: string,
    readonly superclass: LoxClass | null,
    readonly methods: Map<string, LoxCallable>
  ) {
    super();
  }

  get arity(): number {
    return 0;
  }

  public call(interpreter: Interpreter, args: unknown[]): unknown {
    const instance = new LoxInstance(this);
    const initializer = this.findMethod("init");
    if (initializer !== null) {
      initializer.bind(instance).call(interpreter, args);
    }
    return instance;
  }

  public findMethod(name: string): LoxFunction | null {
    const meth = this.methods.get(name) || null;
    if (!meth) {
      if (this.superclass !== null) {
        return this.superclass.findMethod(name);
      }
      
      return null;
    }

    return meth as LoxFunction;
  }

  public toString(): string {
    return this.name;
  }
}
