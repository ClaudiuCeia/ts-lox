import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.153.0/path/mod.ts";

export class GenerateAst {
  public async generate(args: string[]) {
    if (args.length !== 1) {
      console.error(`Usage: ${Deno.mainModule} [output_dir]`);
      Deno.exit(64);
    }

    const outputDir = args[0];

    await Promise.all([
      this.defineAst(outputDir, "Expr", [
        "CommaSeparated -> expressions: Expr[]",
        "Assign         -> name: Token, value: Expr",
        "Binary         -> left: Expr, operator: Token, right: Expr",
        "Call           -> callee: Expr, paren: Token, args: Expr[]",
        "Get            -> object: Expr, name: Token",
        "Grouping       -> expression: Expr",
        "Literal        -> value: unknown",
        "Logical        -> left: Expr, operator: Token, right: Expr",
        "Set            -> object: Expr, name: Token, value: Expr",
        "Super          -> keyword: Token, method: Token",
        "This           -> keyword: Token",
        "Unary          -> operator: Token, right: Expr",
        "Variable       -> name: Token",
      ]),
      this.defineAst(outputDir, "Stmt", [
        "Block      -> statements: Stmt[]",
        "Class      -> name: Token, superclass: Variable | null, methods: Func[]",
        "Expression -> expression: Expr",
        "Func       -> name: Token, params: Token[], body: Stmt[]",
        "If         -> condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null",
        "Print      -> expression: Expr",
        "Return     -> keyword: Token, value: Expr | null",
        "Var        -> name: Token, initializer: Expr | null",
        "VarList    -> list: Var[]",
        "While      -> condition: Expr, body: Stmt",
      ]),
    ]);
  }

  private async defineAst(
    outputDir: string,
    baseName: "Expr" | "Stmt",
    types: string[]
  ) {
    const root = dirname(
      fromFileUrl(import.meta.url.replace("generate.ts", ""))
    );
    const path = `${root}/${outputDir}/${baseName}.ts`;

    const file = await Deno.open(path, {
      create: true,
      write: true,
      truncate: true,
      read: true,
    });

    const writeln = (line: string) =>
      file.writeSync(new TextEncoder().encode(line + "\n"));

    writeln("// Path: src/generate.ts");
    writeln(`// Automatically generated. Do not edit manually.`);

    // Path should take into account generated file location
    writeln(`import { Token } from "../Token.ts";`);
    if (baseName === "Stmt") {
      writeln(`import { Expr, Variable } from "./Expr.ts";`);
    }

    writeln(``);
    writeln(`export abstract class ${baseName} {`);

    writeln(`  abstract accept<R>(visitor: ${baseName}Visitor<R>): R;`);

    writeln(`}`);

    writeln(`export interface ${baseName}Visitor<R> {`);
    for (const type of types) {
      const typeName = type.split("->")[0].trim();
      writeln(
        `  visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R;`
      );
    }
    writeln(`}`);

    for (const type of types) {
      const className = type.split("->")[0].trim();
      const fields = type.split("->")[1].trim();
      this.defineType(writeln, baseName, className, fields);
    }

    file.close();
  }

  private defineType(
    write: (line: string) => void,
    baseName: "Expr" | "Stmt",
    className: string,
    fieldList: string
  ) {
    write(`export class ${className} extends ${baseName} {`);
    const fields = fieldList.split(", ");
    for (const field of fields) {
      write(`    readonly ${field};`);
    }
    write(``);
    write(`    constructor(${fieldList}) {`);
    write(`      super();`);
    for (const field of fields) {
      const name = field.split(":")[0].trim();
      write(`      this.${name} = ${name};`);
    }
    write(`    }`);
    write(``);
    write(`    public accept<R>(visitor: ${baseName}Visitor<R>): R {`);
    write("      return visitor.visit" + className + baseName + "(this);");
    write("    }");

    write(`  }`);
    write(``);
  }
}
