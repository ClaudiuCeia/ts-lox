import { Scanner } from "./Scanner.ts";
import { Token } from "./Token.ts";
import { TokenType } from "./TokenType.ts";

if (Deno.args.length > 1) {
  console.error(`Usage: ${Deno.mainModule} [filename]`);
  Deno.exit(64);
} else if (Deno.args.length === 1) {
  runFile(Deno.args[0]);
} else {
  runPrompt();
}

let hadError = false;
async function runFile(path: string): Promise<void> {
  const data = await Deno.readFile(path);
  run(new TextDecoder("utf-8").decode(data));

  if (hadError) {
    Deno.exit(65);
  }
}

async function runPrompt(): Promise<void> {
  const buf = new Uint8Array(1024);
  while (true) {
    await Deno.stdout.write(new TextEncoder().encode(">  "));
    const n = await Deno.stdin.read(buf);
    if (!n) {
      break;
    }

    const line = new TextDecoder().decode(buf.subarray(0, n)).trim();
    run(line);
    hadError = false;
  }
}

// deno-lint-ignore require-await
async function run(source: string): Promise<void> {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  for (const token of tokens) {
    console.log(token.toString());
  }
}

export function error(line: number, message: string): void;
export function error(token: Token, message: string): void;
export function error(tokenOrString: Token | number, message: string): void {
  if (typeof tokenOrString === "number") {
    report(tokenOrString, "", message);
    return;
  }

  if (tokenOrString.type === TokenType.EOF) {
    report(tokenOrString.line, " at end", message);
  } else {
    report(tokenOrString.line, ` at '${tokenOrString.lexeme}'`, message);
  }
}

function report(line: number, where: string, message: string): void {
  console.error(`[line ${line}] Error${where}: ${message}`);
  hadError = true;
}
