import { assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { Scanner } from "./Scanner.ts";
import { TokenType } from "./TokenType.ts";

Deno.test("Scanner skips single line comments", () => {
  const source = `
    // This is a comment
  `;
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  assertEquals(tokens.length, 1);
  assertEquals(tokens[0].type, TokenType.EOF);
});

Deno.test("Scanner skips multi line comments", () => {
  const source = `
        /* 
            This is a comment 
        */
    `;
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  assertEquals(tokens.length, 1);
  assertEquals(tokens[0].type, TokenType.EOF);
});
