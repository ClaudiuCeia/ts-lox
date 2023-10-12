// Path: src/ast/generate.ts
// Automatically generated. Do not edit manually.
import { Token } from "../Token.ts";

export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}
export interface ExprVisitor<R> {
  visitAssignExpr(expr: Assign): R;
  visitBinaryExpr(expr: Binary): R;
  visitCallExpr(expr: Call): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitLogicalExpr(expr: Logical): R;
  visitUnaryExpr(expr: Unary): R;
  visitVariableExpr(expr: Variable): R;
}
export class Assign extends Expr {
    readonly name: Token;
    readonly value: Expr;

    constructor(name: Token, value: Expr) {
      super();
      this.name = name;
      this.value = value;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitAssignExpr(this);
    }
  }

export class Binary extends Expr {
    readonly left: Expr;
    readonly operator: Token;
    readonly right: Expr;

    constructor(left: Expr, operator: Token, right: Expr) {
      super();
      this.left = left;
      this.operator = operator;
      this.right = right;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitBinaryExpr(this);
    }
  }

export class Call extends Expr {
    readonly callee: Expr;
    readonly paren: Token;
    readonly args: Expr[];

    constructor(callee: Expr, paren: Token, args: Expr[]) {
      super();
      this.callee = callee;
      this.paren = paren;
      this.args = args;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitCallExpr(this);
    }
  }

export class Grouping extends Expr {
    readonly expression: Expr;

    constructor(expression: Expr) {
      super();
      this.expression = expression;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitGroupingExpr(this);
    }
  }

export class Literal extends Expr {
    readonly value: unknown;

    constructor(value: unknown) {
      super();
      this.value = value;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitLiteralExpr(this);
    }
  }

export class Logical extends Expr {
    readonly left: Expr;
    readonly operator: Token;
    readonly right: Expr;

    constructor(left: Expr, operator: Token, right: Expr) {
      super();
      this.left = left;
      this.operator = operator;
      this.right = right;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitLogicalExpr(this);
    }
  }

export class Unary extends Expr {
    readonly operator: Token;
    readonly right: Expr;

    constructor(operator: Token, right: Expr) {
      super();
      this.operator = operator;
      this.right = right;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitUnaryExpr(this);
    }
  }

export class Variable extends Expr {
    readonly name: Token;

    constructor(name: Token) {
      super();
      this.name = name;
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
      return visitor.visitVariableExpr(this);
    }
  }

