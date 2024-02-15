import { Token } from "./Token.ts";
import { Stack } from "./core/Stack.ts";
import { Lox } from "./Lox.ts";
import {
  Assign,
  Binary,
  Call,
  CommaSeparated,
  Expr,
  ExprVisitor,
  Get,
  Grouping,
  Literal,
  Logical,
  Set,
  Super,
  This,
  Unary,
  Variable,
} from "./generated/Expr.ts";
import { Interpreter } from "./Interpreter.ts";
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

enum FunctionType {
  NONE,
  FUNCTION,
  INITIALIZER,
  METHOD,
}

enum ClassType {
  NONE,
  CLASS,
  SUBCLASS,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private scopes: Stack<Map<string, boolean>> = new Stack();
  private currentFunction = FunctionType.NONE;
  private currentClass = ClassType.NONE;

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

  public visitClassStmt(stmt: Class): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(stmt.name);
    this.define(stmt.name);

    if (stmt.superclass !== null) {
      if (stmt.name.lexeme === stmt.superclass.name.lexeme) {
        Lox.error(stmt.superclass.name, "A class can't inherit from itself.");
      }

      this.currentClass = ClassType.SUBCLASS;
      this.resolve(stmt.superclass);

      this.beginScope();
      this.scopes.peek().set("super", true);
    }

    this.beginScope();
    this.scopes.peek().set("this", true);

    for (const method of stmt.methods) {
      const declaration =
        method.name.lexeme === "init"
          ? FunctionType.INITIALIZER
          : FunctionType.METHOD;

      this.resolveFunction(method, declaration);
    }

    if (stmt.superclass !== null) {
      this.endScope();
    }

    this.currentClass = enclosingClass;
    this.endScope();
  }

  public visitSuperExpr(expr: Super): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
    } else if (this.currentClass !== ClassType.SUBCLASS) {
      Lox.error(
        expr.keyword,
        "Can't use 'super' in a class with no superclass."
      );
    }

    this.resolveLocal(expr, expr.keyword);
  }

  public visitGetExpr(expr: Get): void {
    this.resolve(expr.object);
  }

  public visitSetExpr(expr: Set): void {
    this.resolve(expr.value);
    this.resolve(expr.object);
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

  public visitVarListStmt(stmt: VarList): void {
    for (const varStmt of stmt.list) {
      this.declare(varStmt.name);
      if (varStmt.initializer !== null) {
        this.resolve(varStmt.initializer);
      }
      this.define(varStmt.name);
    }
  }

  public visitCommaSeparatedExpr(expr: CommaSeparated): void {
    for (const expression of expr.expressions) {
      this.resolve(expression);
    }
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
      Lox.error(
        expr.name,
        "Cannot read local variable in its own initializer."
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  public visitThisExpr(expr: This): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expr.keyword, "Cannot use 'this' outside of a class.");
      return;
    }

    this.resolveLocal(expr, expr.keyword);
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
      Lox.error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value !== null) {
      if (this.currentFunction === FunctionType.INITIALIZER) {
        Lox.error(stmt.keyword, "Can't return a value from an initializer.");
      }

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
      Lox.error(
        token,
        "Variable with this name already declared in this scope."
      );
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
