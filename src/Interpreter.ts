import { Token } from "./Token.ts";
import { TokenType } from "./TokenType.ts";
import { Lox } from "./Lox.ts";
import { Environment } from "./Environment.ts";
import {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  ExprVisitor,
  Variable,
  CommaSeparated,
  Assign,
  Logical,
  Call,
  Get,
  Set,
  This,
  Super,
} from "./generated/Expr.ts";
import { LoxClass } from "./LoxClass.ts";
import { LoxCallable, LoxFunction } from "./LoxFunction.ts";
import { LoxInstance } from "./LoxInstance.ts";
import {
  Block,
  Class,
  Expression,
  Func,
  If,
  Print,
  Return,
  Stmt,
  StmtVisitor,
  Var,
  VarList,
  While,
} from "./generated/Stmt.ts";

export class RuntimeError extends Error {
  constructor(readonly token: Token, message: string) {
    super(message);
  }
}

export class ReturnException extends Error {
  constructor(readonly value: unknown) {
    super();
  }
}

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
  public readonly globals = new Environment();
  private environment = this.globals;
  private locals = new WeakMap<Expr, number>();

  constructor() {
    this.globals.define(
      "clock",
      new (class extends LoxCallable {
        arity = 0;

        call(): number {
          return Date.now();
        }

        toString(): string {
          return "<native fn>";
        }
      })()
    );
  }

  public interpret(stmts: Stmt[]): void {
    try {
      for (const stmt of stmts) {
        this.execute(stmt);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      }
    }
  }

  private stringify(object: unknown): string {
    if (object === null) {
      return "nil";
    }

    return String(object);
  }

  private evaluate(expr: Expr): unknown {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  public resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth);
  }

  public executeBlock(statements: Stmt[], environment: Environment): void {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      }
    } finally {
      this.environment = previous;
    }
  }

  public visitClassStmt(stmt: Class): void {
    let superclass = null;
    if (stmt.superclass !== null) {
      superclass = this.evaluate(stmt.superclass);
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(
          stmt.superclass.name,
          "Superclass must be a class."
        );
      }
    }

    this.environment.define(stmt.name.lexeme, null);

    if (stmt.superclass !== null) {
      this.environment = new Environment(this.environment);
      this.environment.define("super", superclass);
    }

    const methods = new Map<string, LoxFunction>();
    for (const method of stmt.methods) {
      const func = new LoxFunction(
        method,
        this.environment,
        method.name.lexeme === "init"
      );
      methods.set(method.name.lexeme, func);
    }

    const klass = new LoxClass(stmt.name.lexeme, superclass, methods);

    if (superclass !== null) {
      this.environment = this.environment.enclosing!;
    }

    this.environment.assign(stmt.name, klass);
  }

  public visitThisExpr(expr: This): unknown {
    return this.lookUpVariable(expr.keyword, expr);
  }

  public visitReturnStmt(stmt: Return): void {
    let value = null;
    if (stmt.value !== null) {
      value = this.evaluate(stmt.value);
    }

    throw new ReturnException(value);
  }

  public visitFuncStmt(stmt: Func): void {
    const func = new LoxFunction(stmt, this.environment, false);
    this.environment.define(stmt.name.lexeme, func);
  }

  public visitGetExpr(expr: Get): unknown {
    const object = this.evaluate(expr.object);
    if (object instanceof LoxInstance) {
      return object.get(expr.name);
    }

    throw new RuntimeError(expr.name, "Only instances have properties.");
  }

  public visitSetExpr(expr: Set): unknown {
    const object = this.evaluate(expr.object);

    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, "Only instances have fields.");
    }

    const value = this.evaluate(expr.value);
    object.set(expr.name, value);
    return value;
  }

  public visitSuperExpr(expr: Super): unknown {
    const distance = this.locals.get(expr)!;

    // Ugly typecasting
    const superclass = this.environment.getAt(distance, "super") as LoxClass;
    const object = this.environment.getAt(distance - 1, "this") as LoxInstance;

    const method = superclass.findMethod(expr.method.lexeme);

    if (method === null) {
      throw new RuntimeError(
        expr.method,
        `Undefined property '${expr.method.lexeme}'.`
      );
    }

    return method.bind(object);
  }

  public visitIfStmt(stmt: If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
  }

  public visitCallExpr(expr: Call): unknown {
    const callee = this.evaluate(expr.callee);

    const args = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(
        expr.paren,
        `Can only call functions and classes.`
      );
    }

    if (args.length !== callee.arity) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${callee.arity} arguments but got ${args.length}.`
      );
    }

    return callee.call(this, args);
  }

  public visitLogicalExpr(expr: Logical): unknown {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) {
        return left;
      }
    } else {
      if (!this.isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(expr.right);
  }

  public visitWhileStmt(stmt: While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  public visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression);
  }

  public visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  public visitPrintStmt(stmt: Print): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  public visitVarStmt(stmt: Var): void {
    let value = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  public visitVarListStmt(stmt: VarList): void {
    for (const variable of stmt.list) {
      this.visitVarStmt(variable);
    }
  }

  public visitCommaSeparatedExpr(expr: CommaSeparated): unknown {
    for (const expression of expr.expressions) {
      this.evaluate(expression);
    }

    return null;
  }

  public visitAssignExpr(expr: Assign): unknown {
    const value = this.evaluate(expr.value);

    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }

  public visitVariableExpr(expr: Variable): unknown {
    return this.lookUpVariable(expr.name, expr);
  }

  private lookUpVariable(name: Token, expr: Expr): unknown {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }

  public visitLiteralExpr(expr: Literal): unknown {
    return expr.value;
  }

  public visitGroupingExpr(expr: Grouping): unknown {
    return this.evaluate(expr.expression);
  }

  public visitUnaryExpr(expr: Unary): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -Number(right);
      case TokenType.BANG:
        return !this.isTruthy(right);
    }

    // Unreachable.
    return null;
  }

  public visitBinaryExpr(expr: Binary): unknown {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) / Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }

        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings."
        );
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
    }

    throw new RuntimeError(expr.operator, "Unreachable.");
  }

  private isTruthy(object: unknown): boolean {
    if (object === null) {
      return false;
    }

    if (typeof object === "boolean") {
      return object;
    }

    return true;
  }

  private isEqual(a: unknown, b: unknown): boolean {
    if (a === null && b === null) {
      return true;
    }

    if (a === null) {
      return false;
    }

    return a === b;
  }

  private checkNumberOperand(operator: Token, operand: unknown): void {
    if (typeof operand === "number") {
      return;
    }

    throw new RuntimeError(operator, "Operand must be a number.");
  }

  private checkNumberOperands(
    operator: Token,
    left: unknown,
    right: unknown
  ): void {
    if (typeof left === "number" && typeof right === "number") {
      return;
    }

    throw new RuntimeError(operator, "Operands must be numbers.");
  }
}
