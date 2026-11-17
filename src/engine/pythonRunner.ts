import type { ExecutionResult, PythonRuntimeError, VariableSnapshot } from '../types/curriculum';

type PyValue =
  | { kind: 'int'; value: number }
  | { kind: 'float'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'list'; value: PyValue[] }
  | { kind: 'none'; value: null };

interface PyFunction {
  params: string[];
  body: StatementNode[];
}

type StatementNode =
  | { kind: 'assign'; line: number; target: string; op: '=' | '+=' | '-=' | '*='; expr: string }
  | { kind: 'expr'; line: number; expr: string }
  | { kind: 'return'; line: number; expr: string | null }
  | {
      kind: 'if';
      line: number;
      branches: Array<{ condition: string | null; body: StatementNode[] }>;
    }
  | { kind: 'for'; line: number; varName: string; iterableExpr: string; body: StatementNode[] }
  | { kind: 'while'; line: number; condition: string; body: StatementNode[] }
  | { kind: 'def'; line: number; name: string; params: string[]; body: StatementNode[] };

class RuntimeTrap extends Error {
  line: number;
  errorType: string;
  friendlyHint: string;

  constructor(line: number, errorType: string, message: string, friendlyHint: string) {
    super(message);
    this.line = line;
    this.errorType = errorType;
    this.friendlyHint = friendlyHint;
  }
}

class ReturnSignal {
  value: PyValue;
  constructor(value: PyValue) {
    this.value = value;
  }
}

type Scope = Record<string, PyValue>;

const MAX_STEPS = 2000;

function formatPyValue(val: PyValue, quoteStr = false): string {
  switch (val.kind) {
    case 'int':
    case 'float':
      return String(val.value);
    case 'bool':
      return val.value ? 'True' : 'False';
    case 'none':
      return 'None';
    case 'str':
      return quoteStr ? `"${val.value}"` : val.value;
    case 'list':
      return `[${val.value.map((item) => formatPyValue(item, true)).join(', ')}]`;
  }
}

function getTypeName(val: PyValue): string {
  switch (val.kind) {
    case 'int':
      return 'int (整數)';
    case 'float':
      return 'float (浮點數)';
    case 'str':
      return 'str (字串)';
    case 'bool':
      return 'bool (布林值)';
    case 'list':
      return 'list (串列)';
    case 'none':
      return 'NoneType';
  }
}

function isTruthy(val: PyValue): boolean {
  switch (val.kind) {
    case 'bool':
      return val.value;
    case 'int':
    case 'float':
      return val.value !== 0;
    case 'str':
      return val.value.length > 0;
    case 'list':
      return val.value.length > 0;
    case 'none':
      return false;
  }
}

function stripComment(raw: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) {
      return raw.slice(0, i);
    }
  }
  return raw;
}

interface RawLine {
  lineNumber: number;
  indent: number;
  text: string;
}

function preprocessLines(code: string): RawLine[] {
  const split = code.replace(/\r\n/g, '\n').split('\n');
  const result: RawLine[] = [];
  for (let i = 0; i < split.length; i++) {
    const noComment = stripComment(split[i]);
    if (noComment.trim().length === 0) continue;
    const expanded = noComment.replace(/\t/g, '    ');
    const leadingSpaces = expanded.length - expanded.trimStart().length;
    result.push({
      lineNumber: i + 1,
      indent: leadingSpaces,
      text: expanded.trim(),
    });
  }
  return result;
}

function parseBlock(
  lines: RawLine[],
  startIndex: number,
  expectedIndent: number
): { statements: StatementNode[]; nextIndex: number } {
  const statements: StatementNode[] = [];
  let idx = startIndex;

  while (idx < lines.length) {
    const current = lines[idx];
    if (current.indent < expectedIndent) {
      break;
    }
    if (current.indent > expectedIndent) {
      throw new RuntimeTrap(
        current.lineNumber,
        'IndentationError',
        `第 ${current.lineNumber} 行出現多餘的縮排`,
        '請檢查這一行的空白數，確保沒有多出額外的縮排。'
      );
    }

    const txt = current.text;

    // def statement
    if (txt.startsWith('def ')) {
      const match = txt.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*:$/);
      if (!match) {
        throw new RuntimeTrap(
          current.lineNumber,
          'SyntaxError',
          `第 ${current.lineNumber} 行的函式定義語法有誤`,
          '函式定義格式應為 def 函式名稱(參數):，結尾別忘了加上冒號 : 。'
        );
      }
      const fnName = match[1];
      const rawParams = match[2].trim();
      const params = rawParams
        ? rawParams.split(',').map((p) => {
            const cleaned = p.trim();
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleaned)) {
              throw new RuntimeTrap(
                current.lineNumber,
                'SyntaxError',
                `無效的參數名稱「${cleaned}」`,
                '參數名稱只能包含英文字母、數字與底線，且不可數字開頭。'
              );
            }
            return cleaned;
          })
        : [];
      idx++;
      if (idx >= lines.length || lines[idx].indent <= expectedIndent) {
        throw new RuntimeTrap(
          current.lineNumber,
          'IndentationError',
          `第 ${current.lineNumber} 行的函式內部缺少縮排程式`,
          'def 冒號後的下一行需要縮排（4 個空白）。'
        );
      }
      const bodyResult = parseBlock(lines, idx, lines[idx].indent);
      statements.push({
        kind: 'def',
        line: current.lineNumber,
        name: fnName,
        params,
        body: bodyResult.statements,
      });
      idx = bodyResult.nextIndex;
      continue;
    }

    // if / elif / else
    if (txt.startsWith('if ') || txt.startsWith('if(')) {
      if (!txt.endsWith(':')) {
        throw new RuntimeTrap(
          current.lineNumber,
          'SyntaxError',
          `第 ${current.lineNumber} 行的 if 結尾缺少冒號 :`,
          'Python 的條件判斷 if 結尾必須加上冒號 : 。'
        );
      }
      const firstCond = txt.slice(2, -1).trim();
      if (!firstCond) {
        throw new RuntimeTrap(
          current.lineNumber,
          'SyntaxError',
          `第 ${current.lineNumber} 行的 if 缺少條件運算式`,
          '請在 if 與冒號之間填入要判斷的條件，例如 temp > 30。'
        );
      }
      idx++;
      if (idx >= lines.length || lines[idx].indent <= expectedIndent) {
        throw new RuntimeTrap(
          current.lineNumber,
          'IndentationError',
          `第 ${current.lineNumber} 行的 if 區塊內沒有縮排程式`,
          'if 冒號後的下一行必須向右縮排（4 個空白）。'
        );
      }
      const firstBody = parseBlock(lines, idx, lines[idx].indent);
      const branches: Array<{ condition: string | null; body: StatementNode[] }> = [
        { condition: firstCond, body: firstBody.statements },
      ];
      idx = firstBody.nextIndex;

      while (idx < lines.length && lines[idx].indent === expectedIndent) {
        const nextTxt = lines[idx].text;
        if (nextTxt.startsWith('elif ') || nextTxt.startsWith('elif(')) {
          if (!nextTxt.endsWith(':')) {
            throw new RuntimeTrap(
              lines[idx].lineNumber,
              'SyntaxError',
              `第 ${lines[idx].lineNumber} 行的 elif 結尾缺少冒號 :`,
              'elif 結尾也需要加上冒號 : 。'
            );
          }
          const elifCond = nextTxt.slice(4, -1).trim();
          const elifLine = lines[idx].lineNumber;
          idx++;
          if (idx >= lines.length || lines[idx].indent <= expectedIndent) {
            throw new RuntimeTrap(
              elifLine,
              'IndentationError',
              `第 ${elifLine} 行的 elif 區塊內缺少縮排程式`,
              'elif 冒號後的下一行需要向右縮排。'
            );
          }
          const elifBody = parseBlock(lines, idx, lines[idx].indent);
          branches.push({ condition: elifCond, body: elifBody.statements });
          idx = elifBody.nextIndex;
        } else if (/^else\s*:$/.test(nextTxt)) {
          const elseLine = lines[idx].lineNumber;
          idx++;
          if (idx >= lines.length || lines[idx].indent <= expectedIndent) {
            throw new RuntimeTrap(
              elseLine,
              'IndentationError',
              `第 ${elseLine} 行的 else 區塊內缺少縮排程式`,
              'else 冒號後的下一行需要向右縮排。'
            );
          }
          const elseBody = parseBlock(lines, idx, lines[idx].indent);
          branches.push({ condition: null, body: elseBody.statements });
          idx = elseBody.nextIndex;
          break;
        } else {
          break;
        }
      }

      statements.push({ kind: 'if', line: current.lineNumber, branches });
      continue;
    }

    if (txt.startsWith('elif ') || /^else\s*:/.test(txt)) {
      throw new RuntimeTrap(
        current.lineNumber,
        'SyntaxError',
        `第 ${current.lineNumber} 行的 ${txt.startsWith('elif') ? 'elif' : 'else'} 找不到對應的 if`,
        'elif 與 else 必須接在同一層縮排的 if 區塊後面。'
      );
    }

    // for loop
    if (txt.startsWith('for ')) {
      const match = txt.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+):$/);
      if (!match) {
        throw new RuntimeTrap(
          current.lineNumber,
          'SyntaxError',
          `第 ${current.lineNumber} 行的 for 迴圈語法有誤`,
          'for 迴圈語法應為 for 變數 in 集合或範圍:，例如 for i in range(3):'
        );
      }
      const varName = match[1];
      const iterableExpr = match[2].trim();
      idx++;
      if (idx >= lines.length || lines[idx].indent <= expectedIndent) {
        throw new RuntimeTrap(
          current.lineNumber,
          'IndentationError',
          `第 ${current.lineNumber} 行的 for 迴圈內部缺少縮排程式`,
          'for 迴圈冒號後的下一行必須向右縮排（4 個空白）。'
        );
      }
      const loopBody = parseBlock(lines, idx, lines[idx].indent);
      statements.push({
        kind: 'for',
        line: current.lineNumber,
        varName,
        iterableExpr,
        body: loopBody.statements,
      });
      idx = loopBody.nextIndex;
      continue;
    }

    // while loop
    if (txt.startsWith('while ')) {
      if (!txt.endsWith(':')) {
        throw new RuntimeTrap(
          current.lineNumber,
          'SyntaxError',
          `第 ${current.lineNumber} 行的 while 結尾缺少冒號 :`,
          'while 條件結尾需要加上冒號 : 。'
        );
      }
      const cond = txt.slice(5, -1).trim();
      idx++;
      if (idx >= lines.length || lines[idx].indent <= expectedIndent) {
        throw new RuntimeTrap(
          current.lineNumber,
          'IndentationError',
          `第 ${current.lineNumber} 行的 while 迴圈內部缺少縮排程式`,
          'while 冒號後的下一行必須向右縮排。'
        );
      }
      const loopBody = parseBlock(lines, idx, lines[idx].indent);
      statements.push({
        kind: 'while',
        line: current.lineNumber,
        condition: cond,
        body: loopBody.statements,
      });
      idx = loopBody.nextIndex;
      continue;
    }

    // return statement
    if (txt === 'return' || txt.startsWith('return ')) {
      const returnExpr = txt === 'return' ? null : txt.slice(7).trim();
      statements.push({ kind: 'return', line: current.lineNumber, expr: returnExpr });
      idx++;
      continue;
    }

    // assignment vs expression
    const compoundMatch = txt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|\*=)\s*(.+)$/);
    if (compoundMatch) {
      statements.push({
        kind: 'assign',
        line: current.lineNumber,
        target: compoundMatch[1],
        op: compoundMatch[2] as '+=' | '-=' | '*=',
        expr: compoundMatch[3].trim(),
      });
      idx++;
      continue;
    }

    const assignIdx = findTopLevelAssign(txt);
    if (assignIdx !== -1) {
      const target = txt.slice(0, assignIdx).trim();
      const expr = txt.slice(assignIdx + 1).trim();
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(target)) {
        throw new RuntimeTrap(
          current.lineNumber,
          'SyntaxError',
          `第 ${current.lineNumber} 行的變數名稱「${target}」格式不正確`,
          '變數名稱只能使用英文字母、數字與底線（例如 score、user_name），且不能以數字開頭。'
        );
      }
      if (!expr) {
        throw new RuntimeTrap(
          current.lineNumber,
          'SyntaxError',
          `第 ${current.lineNumber} 行的等號右邊沒有值`,
          '請在 = 右邊填入要指派的值或運算式。'
        );
      }
      statements.push({
        kind: 'assign',
        line: current.lineNumber,
        target,
        op: '=',
        expr,
      });
      idx++;
      continue;
    }

    statements.push({ kind: 'expr', line: current.lineNumber, expr: txt });
    idx++;
  }

  return { statements, nextIndex: idx };
}

function findTopLevelAssign(txt: string): number {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === '=' && depth === 0) {
        const prev = txt[i - 1];
        const next = txt[i + 1];
        if (prev !== '!' && prev !== '<' && prev !== '>' && prev !== '=' && next !== '=') {
          return i;
        }
      }
    }
  }
  return -1;
}

// Expression tokenizer & recursive-descent evaluator
type ExprToken =
  | { type: 'number'; value: number; isFloat: boolean }
  | { type: 'string'; value: string; isFString?: boolean }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string }
  | { type: 'punct'; value: string };

function tokenizeExpr(expr: string, line: number): ExprToken[] {
  const tokens: ExprToken[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // f-string
    if ((ch === 'f' || ch === 'F') && (expr[i + 1] === '"' || expr[i + 1] === "'")) {
      const quote = expr[i + 1];
      i += 2;
      let str = '';
      let closed = false;
      while (i < expr.length) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          str += expr[i + 1] === 'n' ? '\n' : expr[i + 1];
          i += 2;
          continue;
        }
        if (expr[i] === quote) {
          closed = true;
          i++;
          break;
        }
        str += expr[i];
        i++;
      }
      if (!closed) {
        throw new RuntimeTrap(
          line,
          'SyntaxError',
          `第 ${line} 行的字串缺少結尾引號 ${quote}`,
          `請確認字串開頭與結尾都有加上引號 ${quote}。`
        );
      }
      tokens.push({ type: 'string', value: str, isFString: true });
      continue;
    }

    // regular string
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      let closed = false;
      while (i < expr.length) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          str += expr[i + 1] === 'n' ? '\n' : expr[i + 1];
          i += 2;
          continue;
        }
        if (expr[i] === quote) {
          closed = true;
          i++;
          break;
        }
        str += expr[i];
        i++;
      }
      if (!closed) {
        throw new RuntimeTrap(
          line,
          'SyntaxError',
          `第 ${line} 行的字串缺少結尾引號 ${quote}`,
          `請確認文字兩側都有成對的引號 ${quote}。`
        );
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // numbers
    if (/[0-9]/.test(ch)) {
      let numStr = '';
      let isFloat = false;
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        if (expr[i] === '.') {
          if (isFloat) break;
          isFloat = true;
        }
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'number', value: Number(numStr), isFloat });
      continue;
    }

    // identifiers / keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      if (ident === 'and' || ident === 'or' || ident === 'not' || ident === 'in') {
        tokens.push({ type: 'op', value: ident });
      } else {
        tokens.push({ type: 'ident', value: ident });
      }
      continue;
    }

    // 2-char operators
    const two = expr.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '**'].includes(two)) {
      tokens.push({ type: 'op', value: two });
      i += 2;
      continue;
    }

    // 1-char operators
    if ('+-*/%<>'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // punctuation
    if ('(),[].:'.includes(ch)) {
      tokens.push({ type: 'punct', value: ch });
      i++;
      continue;
    }

    throw new RuntimeTrap(
      line,
      'SyntaxError',
      `第 ${line} 行出現無法辨識的字元「${ch}」`,
      '請確認是否誤用了全形符號（如全形括號、全形引號或頓號）。'
    );
  }

  return tokens;
}

interface ExecEnv {
  globalScope: Scope;
  functions: Record<string, PyFunction>;
  output: string[];
  steps: number;
}

function evalExpression(expr: string, scope: Scope, env: ExecEnv, line: number): PyValue {
  const tokens = tokenizeExpr(expr, line);
  if (tokens.length === 0) {
    throw new RuntimeTrap(line, 'SyntaxError', `第 ${line} 行運算式為空`, '請填入完整的數值或運算式。');
  }
  let pos = 0;

  function peek(): ExprToken | undefined {
    return tokens[pos];
  }

  function consume(): ExprToken {
    return tokens[pos++];
  }

  function parseOr(): PyValue {
    let left = parseAnd();
    while (peek()?.type === 'op' && peek()?.value === 'or') {
      consume();
      const right = parseAnd();
      left = isTruthy(left) ? left : right;
    }
    return left;
  }

  function parseAnd(): PyValue {
    let left = parseNot();
    while (peek()?.type === 'op' && peek()?.value === 'and') {
      consume();
      const right = parseNot();
      left = isTruthy(left) ? right : left;
    }
    return left;
  }

  function parseNot(): PyValue {
    if (peek()?.type === 'op' && peek()?.value === 'not') {
      consume();
      return { kind: 'bool', value: !isTruthy(parseNot()) };
    }
    return parseComparison();
  }

  function comparePair(a: PyValue, op: string, b: PyValue): boolean {
    if (op === 'in') {
      if (b.kind === 'list') {
        return b.value.some((el) => comparePair(a, '==', el));
      }
      if (b.kind === 'str' && a.kind === 'str') {
        return b.value.includes(a.value);
      }
      throw new RuntimeTrap(line, 'TypeError', 'in 運算子右側需要是串列或字串', '請確認 in 右側為串列或文字。');
    }

    if (op === '==' || op === '!=') {
      const equal = (() => {
        if ((a.kind === 'int' || a.kind === 'float') && (b.kind === 'int' || b.kind === 'float')) {
          return a.value === b.value;
        }
        if (a.kind === b.kind) {
          if (a.kind === 'list' && b.kind === 'list') {
            return (
              a.value.length === b.value.length &&
              a.value.every((item, idx) => comparePair(item, '==', b.value[idx]))
            );
          }
          return a.value === b.value;
        }
        return false;
      })();
      return op === '==' ? equal : !equal;
    }

    if ((a.kind === 'int' || a.kind === 'float') && (b.kind === 'int' || b.kind === 'float')) {
      switch (op) {
        case '<':
          return a.value < b.value;
        case '<=':
          return a.value <= b.value;
        case '>':
          return a.value > b.value;
        case '>=':
          return a.value >= b.value;
      }
    }

    if (a.kind === 'str' && b.kind === 'str') {
      switch (op) {
        case '<':
          return a.value < b.value;
        case '<=':
          return a.value <= b.value;
        case '>':
          return a.value > b.value;
        case '>=':
          return a.value >= b.value;
      }
    }

    throw new RuntimeTrap(
      line,
      'TypeError',
      `無法對 ${getTypeName(a)} 與 ${getTypeName(b)} 進行「${op}」比較`,
      '數字與文字無法直接比較大小，請確認兩邊的資料型別一致。'
    );
  }

  function parseComparison(): PyValue {
    let left = parseAddSub();
    const cmpOps = ['==', '!=', '<', '<=', '>', '>=', 'in'];
    if (peek()?.type === 'op' && cmpOps.includes(String(peek()?.value))) {
      let result = true;
      let prev = left;
      while (peek()?.type === 'op' && cmpOps.includes(String(peek()?.value))) {
        const op = String(consume().value);
        const next = parseAddSub();
        if (!comparePair(prev, op, next)) {
          result = false;
        }
        prev = next;
      }
      return { kind: 'bool', value: result };
    }
    return left;
  }

  function parseAddSub(): PyValue {
    let left = parseMulDiv();
    while (peek()?.type === 'op' && (peek()?.value === '+' || peek()?.value === '-')) {
      const op = String(consume().value);
      const right = parseMulDiv();
      if (op === '+') {
        if ((left.kind === 'int' || left.kind === 'float') && (right.kind === 'int' || right.kind === 'float')) {
          const isFloat = left.kind === 'float' || right.kind === 'float';
          left = { kind: isFloat ? 'float' : 'int', value: left.value + right.value };
        } else if (left.kind === 'str' && right.kind === 'str') {
          left = { kind: 'str', value: left.value + right.value };
        } else if (left.kind === 'list' && right.kind === 'list') {
          left = { kind: 'list', value: [...left.value, ...right.value] };
        } else {
          throw new RuntimeTrap(
            line,
            'TypeError',
            `無法將 ${getTypeName(left)} 與 ${getTypeName(right)} 相加`,
            '文字與數字不能直接用 + 相加，可以使用 f"..." 字串格式或 str() 轉換數字。'
          );
        }
      } else {
        if ((left.kind === 'int' || left.kind === 'float') && (right.kind === 'int' || right.kind === 'float')) {
          const isFloat = left.kind === 'float' || right.kind === 'float';
          left = { kind: isFloat ? 'float' : 'int', value: left.value - right.value };
        } else {
          throw new RuntimeTrap(
            line,
            'TypeError',
            `無法對 ${getTypeName(left)} 與 ${getTypeName(right)} 進行減法`,
            '減法只能用於整數或浮點數。'
          );
        }
      }
    }
    return left;
  }

  function parseMulDiv(): PyValue {
    let left = parseUnary();
    while (
      peek()?.type === 'op' &&
      ['*', '/', '//', '%'].includes(String(peek()?.value))
    ) {
      const op = String(consume().value);
      const right = parseUnary();

      if (op === '*') {
        if ((left.kind === 'int' || left.kind === 'float') && (right.kind === 'int' || right.kind === 'float')) {
          const isFloat = left.kind === 'float' || right.kind === 'float';
          left = { kind: isFloat ? 'float' : 'int', value: left.value * right.value };
          continue;
        }
        if (left.kind === 'str' && right.kind === 'int') {
          left = { kind: 'str', value: left.value.repeat(Math.max(0, right.value)) };
          continue;
        }
        if (left.kind === 'int' && right.kind === 'str') {
          left = { kind: 'str', value: right.value.repeat(Math.max(0, left.value)) };
          continue;
        }
      }

      if ((left.kind === 'int' || left.kind === 'float') && (right.kind === 'int' || right.kind === 'float')) {
        if (right.value === 0) {
          throw new RuntimeTrap(line, 'ZeroDivisionError', '除數不可為 0', '請檢查除法或取餘數的右邊數字，不能是 0。');
        }
        if (op === '/') {
          left = { kind: 'float', value: left.value / right.value };
          continue;
        }
        if (op === '//') {
          left = { kind: 'int', value: Math.floor(left.value / right.value) };
          continue;
        }
        if (op === '%') {
          const mod = ((left.value % right.value) + right.value) % right.value;
          left = { kind: left.kind === 'float' || right.kind === 'float' ? 'float' : 'int', value: mod };
          continue;
        }
      }

      throw new RuntimeTrap(
        line,
        'TypeError',
        `無法進行「${op}」運算`,
        '請檢查運算符號兩側的資料型別是否為數字。'
      );
    }
    return left;
  }

  function parseUnary(): PyValue {
    if (peek()?.type === 'op' && peek()?.value === '-') {
      consume();
      const val = parsePower();
      if (val.kind === 'int' || val.kind === 'float') {
        return { kind: val.kind, value: -val.value };
      }
      throw new RuntimeTrap(line, 'TypeError', '負號只能用於數字', '無法對非數字使用負號。');
    }
    return parsePower();
  }

  function parsePower(): PyValue {
    let left = parsePostfix();
    if (peek()?.type === 'op' && peek()?.value === '**') {
      consume();
      const right = parseUnary();
      if ((left.kind === 'int' || left.kind === 'float') && (right.kind === 'int' || right.kind === 'float')) {
        return { kind: 'float', value: Math.pow(left.value, right.value) };
      }
    }
    return left;
  }

  function parsePostfix(): PyValue {
    let val = parsePrimary();

    while (peek()?.type === 'punct') {
      const p = peek()?.value;
      if (p === '[') {
        consume();
        const idxVal = parseOr();
        if (peek()?.type !== 'punct' || peek()?.value !== ']') {
          throw new RuntimeTrap(line, 'SyntaxError', `第 ${line} 行缺少右中括號 ]`, '索引取值需要成對的 [ ]。');
        }
        consume();
        if (idxVal.kind !== 'int') {
          throw new RuntimeTrap(line, 'TypeError', '串列索引必須是整數', '請使用整數（例如 0、1、2）來讀取位置。');
        }
        if (val.kind === 'list') {
          const i = idxVal.value < 0 ? val.value.length + idxVal.value : idxVal.value;
          if (i < 0 || i >= val.value.length) {
            throw new RuntimeTrap(
              line,
              'IndexError',
              `串列索引 ${idxVal.value} 超出範圍（共有 ${val.value.length} 筆資料）`,
              `串列索引從 0 開始計算，有效範圍為 0 到 ${Math.max(0, val.value.length - 1)}。`
            );
          }
          val = val.value[i];
        } else if (val.kind === 'str') {
          const i = idxVal.value < 0 ? val.value.length + idxVal.value : idxVal.value;
          if (i < 0 || i >= val.value.length) {
            throw new RuntimeTrap(line, 'IndexError', '字串索引超出範圍', '請確認索引值小於文字長度。');
          }
          val = { kind: 'str', value: val.value[i] };
        } else {
          throw new RuntimeTrap(line, 'TypeError', `${getTypeName(val)} 不支援索引取值`, '只有串列與字串支援 [索引] 取值。');
        }
      } else if (p === '.') {
        consume();
        const methodTok = consume();
        if (methodTok?.type !== 'ident') {
          throw new RuntimeTrap(line, 'SyntaxError', '點號後方缺少方法名稱', '請填入正確的方法名稱，例如 .append(...)。');
        }
        if (peek()?.type === 'punct' && peek()?.value === '(') {
          consume();
          const args: PyValue[] = [];
          if (!(peek()?.type === 'punct' && peek()?.value === ')')) {
            args.push(parseOr());
            while (peek()?.type === 'punct' && peek()?.value === ',') {
              consume();
              args.push(parseOr());
            }
          }
          if (peek()?.type !== 'punct' || peek()?.value !== ')') {
            throw new RuntimeTrap(line, 'SyntaxError', '方法呼叫缺少右括號 )', '請確認括號有成對閉合。');
          }
          consume();
          if (val.kind === 'list' && methodTok.value === 'append') {
            if (args.length !== 1) {
              throw new RuntimeTrap(line, 'TypeError', 'append() 需要剛好 1 個參數', '請在 append() 內放入 1 個要加入的元素。');
            }
            val.value.push(args[0]);
            val = { kind: 'none', value: null };
          } else if (val.kind === 'str' && methodTok.value === 'upper') {
            val = { kind: 'str', value: val.value.toUpperCase() };
          } else if (val.kind === 'str' && methodTok.value === 'lower') {
            val = { kind: 'str', value: val.value.toLowerCase() };
          } else {
            throw new RuntimeTrap(line, 'AttributeError', `找不到方法 .${methodTok.value}()`, '請確認該資料型別是否支援此方法。');
          }
        }
      } else {
        break;
      }
    }

    return val;
  }

  function parsePrimary(): PyValue {
    const tok = peek();
    if (!tok) {
      throw new RuntimeTrap(line, 'SyntaxError', `第 ${line} 行程式不完整`, '請檢查括號、逗號或運算式是否尚未填寫完成。');
    }

    if (tok.type === 'number') {
      consume();
      return { kind: tok.isFloat ? 'float' : 'int', value: tok.value };
    }

    if (tok.type === 'string') {
      consume();
      if (tok.isFString) {
        const interpolated = tok.value.replace(/\{([^{}]+)\}/g, (_match, innerExpr: string) => {
          const evaluated = evalExpression(innerExpr.trim(), scope, env, line);
          return formatPyValue(evaluated, false);
        });
        return { kind: 'str', value: interpolated };
      }
      return { kind: 'str', value: tok.value };
    }

    if (tok.type === 'punct' && tok.value === '(') {
      consume();
      const inner = parseOr();
      if (peek()?.type !== 'punct' || peek()?.value !== ')') {
        throw new RuntimeTrap(line, 'SyntaxError', `第 ${line} 行缺少右括號 )`, '請確認所有的左括號 ( 都有對應的右括號 )。');
      }
      consume();
      return inner;
    }

    if (tok.type === 'punct' && tok.value === '[') {
      consume();
      const items: PyValue[] = [];
      if (!(peek()?.type === 'punct' && peek()?.value === ']')) {
        items.push(parseOr());
        while (peek()?.type === 'punct' && peek()?.value === ',') {
          consume();
          if (peek()?.type === 'punct' && peek()?.value === ']') break;
          items.push(parseOr());
        }
      }
      if (peek()?.type !== 'punct' || peek()?.value !== ']') {
        throw new RuntimeTrap(line, 'SyntaxError', `第 ${line} 行串列缺少右中括號 ]`, '串列需要使用成對的 [ ] 包裹元素。');
      }
      consume();
      return { kind: 'list', value: items };
    }

    if (tok.type === 'ident') {
      consume();
      if (tok.value === 'True') return { kind: 'bool', value: true };
      if (tok.value === 'False') return { kind: 'bool', value: false };
      if (tok.value === 'None') return { kind: 'none', value: null };

      // function call
      if (peek()?.type === 'punct' && peek()?.value === '(') {
        consume();
        const args: PyValue[] = [];
        if (!(peek()?.type === 'punct' && peek()?.value === ')')) {
          args.push(parseOr());
          while (peek()?.type === 'punct' && peek()?.value === ',') {
            consume();
            args.push(parseOr());
          }
        }
        if (peek()?.type !== 'punct' || peek()?.value !== ')') {
          throw new RuntimeTrap(
            line,
            'SyntaxError',
            `第 ${line} 行的 ${tok.value}() 缺少右括號 )`,
            '呼叫函式時需要成對的小括號 ()。'
          );
        }
        consume();
        return callFunction(tok.value, args, env, line);
      }

      // variable lookup
      if (tok.value in scope) {
        return scope[tok.value];
      }
      if (tok.value in env.globalScope) {
        return env.globalScope[tok.value];
      }

      throw new RuntimeTrap(
        line,
        'NameError',
        `找不到變數「${tok.value}」`,
        `請確認變數「${tok.value}」是否已先定義，或者文字是否忘記加上引號 "${tok.value}"。`
      );
    }

    throw new RuntimeTrap(
      line,
      'SyntaxError',
      `第 ${line} 行語法不正確`,
      '請檢查是否漏掉了括號、引號或運算數值。'
    );
  }

  const val = parseOr();
  if (pos < tokens.length) {
    throw new RuntimeTrap(
      line,
      'SyntaxError',
      `第 ${line} 行出現多餘的語法片段`,
      '請檢查是否有多餘的符號或缺少運算子。'
    );
  }
  return val;
}

function callFunction(name: string, args: PyValue[], env: ExecEnv, line: number): PyValue {
  if (name === 'print') {
    const text = args.map((arg) => formatPyValue(arg, false)).join(' ');
    env.output.push(text);
    return { kind: 'none', value: null };
  }

  if (name === 'len') {
    if (args.length !== 1) {
      throw new RuntimeTrap(line, 'TypeError', 'len() 需要 1 個參數', '請在 len() 中放入一個串列或字串。');
    }
    const target = args[0];
    if (target.kind === 'list' || target.kind === 'str') {
      return { kind: 'int', value: target.value.length };
    }
    throw new RuntimeTrap(line, 'TypeError', `${getTypeName(target)} 無法計算長度`, 'len() 只能用來計算串列或字串的長度。');
  }

  if (name === 'range') {
    if (args.length < 1 || args.length > 3 || args.some((a) => a.kind !== 'int')) {
      throw new RuntimeTrap(line, 'TypeError', 'range() 參數必須為整數', 'range(結束) 或 range(起始, 結束) 需要放入整數。');
    }
    let start = 0;
    let stop = 0;
    let step = 1;
    if (args.length === 1) {
      stop = (args[0] as { kind: 'int'; value: number }).value;
    } else if (args.length === 2) {
      start = (args[0] as { kind: 'int'; value: number }).value;
      stop = (args[1] as { kind: 'int'; value: number }).value;
    } else {
      start = (args[0] as { kind: 'int'; value: number }).value;
      stop = (args[1] as { kind: 'int'; value: number }).value;
      step = (args[2] as { kind: 'int'; value: number }).value;
      if (step === 0) {
        throw new RuntimeTrap(line, 'ValueError', 'range() 的步長不可為 0', '第三個參數必須是非零整數。');
      }
    }
    const items: PyValue[] = [];
    if (step > 0) {
      for (let v = start; v < stop && items.length < 500; v += step) {
        items.push({ kind: 'int', value: v });
      }
    } else {
      for (let v = start; v > stop && items.length < 500; v += step) {
        items.push({ kind: 'int', value: v });
      }
    }
    return { kind: 'list', value: items };
  }

  if (name === 'str') {
    if (args.length !== 1) throw new RuntimeTrap(line, 'TypeError', 'str() 需要 1 個參數', '請傳入一個要轉成字串的值。');
    return { kind: 'str', value: formatPyValue(args[0], false) };
  }

  if (name === 'int') {
    if (args.length !== 1) throw new RuntimeTrap(line, 'TypeError', 'int() 需要 1 個參數', '請傳入一個數字或數字字串。');
    const a = args[0];
    if (a.kind === 'int') return a;
    if (a.kind === 'float') return { kind: 'int', value: Math.trunc(a.value) };
    if (a.kind === 'str' && /^-?\d+$/.test(a.value.trim())) {
      return { kind: 'int', value: parseInt(a.value.trim(), 10) };
    }
    throw new RuntimeTrap(line, 'ValueError', `無法將「${formatPyValue(a)}」轉換成整數`, 'int() 只能轉換純數字字串或數值。');
  }

  if (name === 'float') {
    if (args.length !== 1) throw new RuntimeTrap(line, 'TypeError', 'float() 需要 1 個參數', '請傳入一個數值。');
    const a = args[0];
    if (a.kind === 'int' || a.kind === 'float') return { kind: 'float', value: a.value };
    if (a.kind === 'str' && !Number.isNaN(Number(a.value.trim()))) {
      return { kind: 'float', value: Number(a.value.trim()) };
    }
    throw new RuntimeTrap(line, 'ValueError', `無法將「${formatPyValue(a)}」轉換成浮點數`, '請確認傳入內容為合法數字。');
  }

  if (name === 'sum') {
    if (args.length !== 1 || args[0].kind !== 'list') {
      throw new RuntimeTrap(line, 'TypeError', 'sum() 需要傳入一個數字串列', '例如 sum([10, 20, 30])。');
    }
    let total = 0;
    for (const item of args[0].value) {
      if (item.kind !== 'int' && item.kind !== 'float') {
        throw new RuntimeTrap(line, 'TypeError', 'sum() 串列內的元素必須都是數字', '請確認串列裡沒有文字元素。');
      }
      total += item.value;
    }
    return { kind: Number.isInteger(total) ? 'int' : 'float', value: total };
  }

  if (name === 'type') {
    if (args.length !== 1) throw new RuntimeTrap(line, 'TypeError', 'type() 需要 1 個參數', '請傳入一個變數或數值。');
    const shortType = args[0].kind === 'none' ? 'NoneType' : args[0].kind;
    return { kind: 'str', value: `<class '${shortType}'>` };
  }

  const userFn = env.functions[name];
  if (!userFn) {
    throw new RuntimeTrap(
      line,
      'NameError',
      `找不到函式「${name}」`,
      `請確認函式名稱「${name}」拼字是否正確（例如 print），或是否已先用 def 定義。`
    );
  }

  if (args.length !== userFn.params.length) {
    throw new RuntimeTrap(
      line,
      'TypeError',
      `${name}() 需要 ${userFn.params.length} 個參數，但你傳入了 ${args.length} 個`,
      `請檢查呼叫 ${name}() 時傳入的參數數量是否符合定義。`
    );
  }

  const localScope: Scope = {};
  userFn.params.forEach((param, idx) => {
    localScope[param] = args[idx];
  });

  try {
    executeStatements(userFn.body, localScope, env);
  } catch (sig) {
    if (sig instanceof ReturnSignal) {
      return sig.value;
    }
    throw sig;
  }

  return { kind: 'none', value: null };
}

function executeStatements(statements: StatementNode[], scope: Scope, env: ExecEnv): void {
  for (const stmt of statements) {
    env.steps++;
    if (env.steps > MAX_STEPS) {
      throw new RuntimeTrap(
        stmt.line,
        'RecursionError',
        '程式執行步驟超過安全上限（可能發生無窮迴圈）',
        '請檢查 while 或遞迴條件是否能正常結束。'
      );
    }

    switch (stmt.kind) {
      case 'assign': {
        const val = evalExpression(stmt.expr, scope, env, stmt.line);
        if (stmt.op === '=') {
          scope[stmt.target] = val;
        } else {
          const prev = scope[stmt.target] ?? env.globalScope[stmt.target];
          if (!prev) {
            throw new RuntimeTrap(
              stmt.line,
              'NameError',
              `變數「${stmt.target}」尚未初始化就使用 ${stmt.op}`,
              `請先設定 ${stmt.target} = 0 再進行累加或更新。`
            );
          }
          if (
            (prev.kind === 'int' || prev.kind === 'float') &&
            (val.kind === 'int' || val.kind === 'float')
          ) {
            const isFloat = prev.kind === 'float' || val.kind === 'float';
            const nextNum =
              stmt.op === '+='
                ? prev.value + val.value
                : stmt.op === '-='
                  ? prev.value - val.value
                  : prev.value * val.value;
            scope[stmt.target] = { kind: isFloat ? 'float' : 'int', value: nextNum };
          } else if (stmt.op === '+=' && prev.kind === 'str' && val.kind === 'str') {
            scope[stmt.target] = { kind: 'str', value: prev.value + val.value };
          } else {
            throw new RuntimeTrap(stmt.line, 'TypeError', `無法對變數「${stmt.target}」執行 ${stmt.op}`, '請檢查資料型別。');
          }
        }
        break;
      }
      case 'expr': {
        evalExpression(stmt.expr, scope, env, stmt.line);
        break;
      }
      case 'return': {
        const retVal = stmt.expr ? evalExpression(stmt.expr, scope, env, stmt.line) : { kind: 'none' as const, value: null };
        throw new ReturnSignal(retVal);
      }
      case 'if': {
        for (const branch of stmt.branches) {
          if (branch.condition === null) {
            executeStatements(branch.body, scope, env);
            break;
          }
          const condVal = evalExpression(branch.condition, scope, env, stmt.line);
          if (isTruthy(condVal)) {
            executeStatements(branch.body, scope, env);
            break;
          }
        }
        break;
      }
      case 'for': {
        const iterable = evalExpression(stmt.iterableExpr, scope, env, stmt.line);
        let items: PyValue[] = [];
        if (iterable.kind === 'list') {
          items = iterable.value;
        } else if (iterable.kind === 'str') {
          items = iterable.value.split('').map((c) => ({ kind: 'str', value: c }));
        } else {
          throw new RuntimeTrap(
            stmt.line,
            'TypeError',
            `${getTypeName(iterable)} 無法用於 for 迴圈走訪`,
            'for 迴圈右側通常使用 range(...) 或串列 [ ... ]。'
          );
        }
        for (const item of items) {
          scope[stmt.varName] = item;
          executeStatements(stmt.body, scope, env);
        }
        break;
      }
      case 'while': {
        while (isTruthy(evalExpression(stmt.condition, scope, env, stmt.line))) {
          env.steps++;
          if (env.steps > MAX_STEPS) {
            throw new RuntimeTrap(
              stmt.line,
              'TimeoutError',
              'while 迴圈執行次數過多，已自動停止',
              '請確認迴圈內有更新條件變數（例如 count += 1），避免無窮迴圈。'
            );
          }
          executeStatements(stmt.body, scope, env);
        }
        break;
      }
      case 'def': {
        env.functions[stmt.name] = {
          params: stmt.params,
          body: stmt.body,
        };
        break;
      }
    }
  }
}

export function runPythonCode(code: string): ExecutionResult {
  const globalScope: Scope = {};
  const env: ExecEnv = {
    globalScope,
    functions: {},
    output: [],
    steps: 0,
  };

  try {
    const rawLines = preprocessLines(code);
    if (rawLines.length === 0) {
      return {
        success: false,
        output: [],
        variables: [],
        stepsExecuted: 0,
        error: {
          line: 1,
          type: 'EmptyCode',
          message: '目前沒有可執行的程式碼',
          friendlyHint: '請先填入空白或拖曳積木到程式碼區域中。',
        },
      };
    }

    if (rawLines[0].indent > 0) {
      throw new RuntimeTrap(
        rawLines[0].lineNumber,
        'IndentationError',
        `第 ${rawLines[0].lineNumber} 行開頭不應該有縮排`,
        '程式最外層的第一行請從最左邊對齊開始。'
      );
    }

    const parsed = parseBlock(rawLines, 0, 0);
    executeStatements(parsed.statements, globalScope, env);

    const variables: VariableSnapshot[] = Object.entries(globalScope).map(([name, val]) => ({
      name,
      valueDisplay: formatPyValue(val, true),
      typeName: getTypeName(val),
    }));

    return {
      success: true,
      output: env.output,
      variables,
      stepsExecuted: env.steps,
    };
  } catch (err) {
    const variables: VariableSnapshot[] = Object.entries(globalScope).map(([name, val]) => ({
      name,
      valueDisplay: formatPyValue(val, true),
      typeName: getTypeName(val),
    }));

    if (err instanceof RuntimeTrap) {
      const error: PythonRuntimeError = {
        line: err.line,
        type: err.errorType,
        message: err.message,
        friendlyHint: err.friendlyHint,
      };
      return {
        success: false,
        output: env.output,
        variables,
        error,
        stepsExecuted: env.steps,
      };
    }

    return {
      success: false,
      output: env.output,
      variables,
      error: {
        line: 1,
        type: 'Error',
        message: err instanceof Error ? err.message : '執行時發生未預期錯誤',
        friendlyHint: '請檢查程式語法是否正確。',
      },
      stepsExecuted: env.steps,
    };
  }
}
