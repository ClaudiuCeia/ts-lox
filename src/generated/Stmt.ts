// Path: src/generate.ts
// Automatically generated. Do not edit manually.
import { Token } from "../Token.ts";
import { Expr, Variable } from "./Expr.ts";

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}
export interface StmtVisitor<R> {
  visitBlockStmt(stmt: Block): R;
  visitClassStmt(stmt: Class): R;
  visitExpressionStmt(stmt: Expression): R;
  visitFuncStmt(stmt: Func): R;
  visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: Print): R;
  visitReturnStmt(stmt: Return): R;
  visitVarStmt(stmt: Var): R;
  visitWhileStmt(stmt: While): R;
}
export class Block extends Stmt {
    readonly statements: Stmt[];

    constructor(statements: Stmt[]) {
      super();
      this.statements = statements;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitBlockStmt(this);
    }
  }

export class Class extends Stmt {
    readonly name: Token;
    readonly superclass: Variable | null;
    readonly methods: Func[];

    constructor(name: Token, superclass: Variable | null, methods: Func[]) {
      super();
      this.name = name;
      this.superclass = superclass;
      this.methods = methods;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitClassStmt(this);
    }
  }

export class Expression extends Stmt {
    readonly expression: Expr;

    constructor(expression: Expr) {
      super();
      this.expression = expression;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitExpressionStmt(this);
    }
  }

export class Func extends Stmt {
    readonly name: Token;
    readonly params: Token[];
    readonly body: Stmt[];

    constructor(name: Token, params: Token[], body: Stmt[]) {
      super();
      this.name = name;
      this.params = params;
      this.body = body;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitFuncStmt(this);
    }
  }

export class If extends Stmt {
    readonly condition: Expr;
    readonly thenBranch: Stmt;
    readonly elseBranch: Stmt | null;

    constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
      super();
      this.condition = condition;
      this.thenBranch = thenBranch;
      this.elseBranch = elseBranch;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitIfStmt(this);
    }
  }

export class Print extends Stmt {
    readonly expression: Expr;

    constructor(expression: Expr) {
      super();
      this.expression = expression;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitPrintStmt(this);
    }
  }

export class Return extends Stmt {
    readonly keyword: Token;
    readonly value: Expr | null;

    constructor(keyword: Token, value: Expr | null) {
      super();
      this.keyword = keyword;
      this.value = value;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitReturnStmt(this);
    }
  }

export class Var extends Stmt {
    readonly name: Token;
    readonly initializer: Expr | null;

    constructor(name: Token, initializer: Expr | null) {
      super();
      this.name = name;
      this.initializer = initializer;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitVarStmt(this);
    }
  }

export class While extends Stmt {
    readonly condition: Expr;
    readonly body: Stmt;

    constructor(condition: Expr, body: Stmt) {
      super();
      this.condition = condition;
      this.body = body;
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
      return visitor.visitWhileStmt(this);
    }
  }

