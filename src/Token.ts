import { TokenType } from "./TokenType.ts";

export class Token {
  constructor(
    readonly type: TokenType,
    readonly lexeme: string,
    // deno-lint-ignore no-explicit-any
    readonly literal: any,
    readonly line: number
  ) {}

  toString(): string {
    return `${TokenType[this.type]} ${this.lexeme} ${this.literal}`;
  }
}
