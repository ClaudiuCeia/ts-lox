/* import { Binary, Expr, Grouping, Literal, Unary, ExprVisitor, Assign, Variable, Logical, Call } from "./Expr.ts";

export class AstPrinter implements ExprVisitor<string> {
  public print(expr: Expr): string {
    return expr.accept(this);
  }

  public visitCallExpr(expr: Call): string {
    return this.parenthesize("call", expr.callee, ...expr.args);
  }

  public visitLogicalExpr(expr: Logical): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  public visitAssignExpr(expr: Assign): string {
    return this.parenthesize(`= ${expr.name.lexeme}`, expr.value);
  }

  public visitVariableExpr(expr: Variable): string {
    return expr.name.lexeme;
  }
  
  public visitBinaryExpr(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  public visitGroupingExpr(expr: Grouping): string {
    return this.parenthesize("group", expr.expression);
  }

  public visitLiteralExpr(expr: Literal): string {
    if (expr.value === null) {
      return "nil";
    }

    return expr.value!.toString();
  }

  public visitUnaryExpr(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    let result = `(${name}`;
    for (const expr of exprs) {
      result += ` ${expr.accept(this)}`;
    }
    result += ")";
    return result;
  }
}
 */