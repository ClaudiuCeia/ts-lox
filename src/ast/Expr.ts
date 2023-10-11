// deno-lint-ignore-file no-explicit-any
// Path: src/ast/generate.ts
// Automatically generated. Do not edit manually.
import { Token } from "../Token.ts";

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}
export interface Visitor<R> {
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
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

    public accept<R>(visitor: Visitor<R>): R {
      return visitor.visitBinaryExpr(this);
    }
  }

export class Grouping extends Expr {
    readonly expression: Expr;

    constructor(expression: Expr) {
      super();
      this.expression = expression;
    }

    public accept<R>(visitor: Visitor<R>): R {
      return visitor.visitGroupingExpr(this);
    }
  }

export class Literal extends Expr {
    readonly value: any;

    constructor(value: any) {
      super();
      this.value = value;
    }

    public accept<R>(visitor: Visitor<R>): R {
      return visitor.visitLiteralExpr(this);
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

    public accept<R>(visitor: Visitor<R>): R {
      return visitor.visitUnaryExpr(this);
    }
  }

