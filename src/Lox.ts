import { Scanner } from "./Scanner.ts";
import { Token } from "./Token.ts";
import { TokenType } from "./TokenType.ts";
import { Interpreter, RuntimeError } from "./Interpreter.ts";
import { Parser } from "./Parser.ts";
import { Resolver } from "./Resolver.ts";

export class Lox {
  private interpreter = new Interpreter();

  private static hadError = false;
  private static hadRuntimeError = false;

  public main(args: string[]) {
    if (args.length > 1) {
      console.error(`Usage: ${Deno.mainModule} [filename]`);
      Deno.exit(64);
    } else if (args.length === 1) {
      this.runFile(args[0]);
    } else {
      this.runPrompt();
    }
  }

  public async runFile(path: string): Promise<void> {
    const data = await Deno.readFile(path);
    this.run(new TextDecoder("utf-8").decode(data));

    if (Lox.hadError) {
      Deno.exit(65);
    }

    if (Lox.hadRuntimeError) {
      Deno.exit(70);
    }
  }

  public async runPrompt(): Promise<void> {
    const buf = new Uint8Array(1024);
    while (true) {
      await Deno.stdout.write(new TextEncoder().encode(">  "));
      const n = await Deno.stdin.read(buf);
      if (!n) {
        break;
      }

      const line = new TextDecoder().decode(buf.subarray(0, n)).trim();
      this.run(line);
      Lox.hadError = false;
    }
  }

  // deno-lint-ignore require-await
  public async run(source: string): Promise<void> {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    if (Lox.hadError) {
      return;
    }

    const resolver = new Resolver(this.interpreter);
    resolver.resolve(statements);
    if (Lox.hadError) {
      return;
    }

    this.interpreter.interpret(statements);
  }

  public static error(line: number, message: string): void;
  public static error(token: Token, message: string): void;
  public static error(tokenOrString: Token | number, message: string): void {
    if (typeof tokenOrString === "number") {
      Lox.report(tokenOrString, "", message);
      return;
    }

    if (tokenOrString.type === TokenType.EOF) {
      Lox.report(tokenOrString.line, " at end", message);
    } else {
      Lox.report(tokenOrString.line, ` at '${tokenOrString.lexeme}'`, message);
    }
  }

  public static runtimeError(error: RuntimeError): void {
    console.error(`${error.message}\n[line ${error.token.line}]`);
    Lox.hadRuntimeError = true;
  }

  public static report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where}: ${message}`);
    Lox .hadError = true;
  }
}
