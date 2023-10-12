import {
  dirname,
  fromFileUrl,
} from "https://deno.land/std@0.153.0/path/mod.ts";

if (Deno.args.length !== 1) {
  console.error(`Usage: ${Deno.mainModule} [output_dir]`);
  Deno.exit(64);
}

const outputDir = Deno.args[0];

defineAst(outputDir, "Expr", [
  "Assign   -> name: Token, value: Expr",
  "Binary   -> left: Expr, operator: Token, right: Expr",
  "Call     -> callee: Expr, paren: Token, args: Expr[]",
  "Grouping -> expression: Expr",
  "Literal  -> value: unknown",
  "Logical  -> left: Expr, operator: Token, right: Expr",
  "Unary    -> operator: Token, right: Expr",
  "Variable -> name: Token",
]);

defineAst(outputDir, "Stmt", [
  "Block      -> statements: Stmt[]",
  "Expression -> expression: Expr",
  "Func       -> name: Token, params: Token[], body: Stmt[]",
  "If         -> condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null",
  "Print      -> expression: Expr",
  "Return     -> keyword: Token, value: Expr | null",
  "Var        -> name: Token, initializer: Expr | null",
  "While      -> condition: Expr, body: Stmt",
]);

async function defineAst(
  outputDir: string,
  baseName: "Expr" | "Stmt",
  types: string[]
) {
  const root = dirname(
    fromFileUrl(import.meta.url.replace("generate.ts", "../"))
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

  writeln("// Path: src/ast/generate.ts");
  writeln(`// Automatically generated. Do not edit manually.`);

  writeln(`import { Token } from "../Token.ts";`);
  if (baseName === "Stmt") {
    writeln(`import { Expr } from "./Expr.ts";`);
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
    defineType(writeln, baseName, className, fields);
  }

  file.close();
}

function defineType(
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
