import { Token } from "../Token.ts";
import { Stack } from "../core/Stack.ts";
import { error } from "../main.ts";
import {
  Assign,
  Binary,
  Call,
  Expr,
  ExprVisitor,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from "./Expr.ts";
import { Interpreter } from "./Interpreter.ts";
import {
  Block,
  Expression,
  Func,
  If,
  Print,
  Return,
  Stmt,
  StmtVisitor,
  Var,
  While,
} from "./Stmt.ts";

enum FunctionType {
  NONE,
  FUNCTION,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private scopes: Stack<Map<string, boolean>> = new Stack();
  private currentFunction = FunctionType.NONE;

  constructor(private readonly interpreter: Interpreter) {}

  public resolve(stmt: Stmt): void;
  public resolve(expr: Expr): void;
  public resolve(statements: Stmt[]): void;

  public resolve(stmtsOrExpr: Stmt | Stmt[] | Expr): void {
    if (!Array.isArray(stmtsOrExpr)) {
      stmtsOrExpr.accept(this);
      return;
    }

    for (const stmt of stmtsOrExpr) {
      this.resolve(stmt);
    }
  }

  private beginScope(): void {
    this.scopes.push(new Map());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  public visitBlockStmt(stmt: Block): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  public visitVarStmt(stmt: Var): void {
    this.declare(stmt.name);
    if (stmt.initializer !== null) {
      this.resolve(stmt.initializer);
    }
    this.define(stmt.name);
  }

  public visitAssignExpr(expr: Assign): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  public visitFuncStmt(stmt: Func): void {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  public visitVariableExpr(expr: Variable): void {
    if (
      this.scopes.length > 0 &&
      this.scopes.peek().get(expr.name.lexeme) === false
    ) {
      error(expr.name, "Cannot read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }

  public visitExpressionStmt(stmt: Expression): void {
    this.resolve(stmt.expression);
  }

  public visitIfStmt(stmt: If): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch !== null) {
      this.resolve(stmt.elseBranch);
    }
  }

  public visitPrintStmt(stmt: Print): void {
    this.resolve(stmt.expression);
  }

  public visitReturnStmt(stmt: Return): void {
    if (this.currentFunction === FunctionType.NONE) {
      error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value !== null) {
      this.resolve(stmt.value);
    }
  }

  public visitWhileStmt(stmt: While): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  public visitBinaryExpr(expr: Binary): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitCallExpr(expr: Call): void {
    this.resolve(expr.callee);

    for (const arg of expr.args) {
      this.resolve(arg);
    }
  }

  public visitGroupingExpr(expr: Grouping): void {
    this.resolve(expr.expression);
  }

  public visitLiteralExpr(_expr: Literal): void {}

  public visitLogicalExpr(expr: Logical): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitUnaryExpr(expr: Unary): void {
    this.resolve(expr.right);
  }

  private resolveFunction(func: Func, fnType: FunctionType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = fnType;

    this.beginScope();

    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }

    this.resolve(func.body);
    this.endScope();

    this.currentFunction = enclosingFunction;
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.size() - 1; i >= 0; i--) {
      if (this.scopes.get(i).has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  private declare(token: Token): void {
    if (this.scopes.length === 0) {
      return;
    }

    const scope = this.scopes.peek();
    if (scope.has(token.lexeme)) {
      error(token, "Variable with this name already declared in this scope.");
    }

    scope.set(token.lexeme, false);
  }

  private define(token: Token): void {
    if (this.scopes.length === 0) {
      return;
    }

    this.scopes.peek().set(token.lexeme, true);
  }
}
