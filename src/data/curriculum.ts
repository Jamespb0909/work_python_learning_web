import type { Stage, Lesson, LessonValidationResult } from '../types/curriculum';

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, idx) => item.trim() === b[idx].trim());
}

export const CURRICULUM_STAGES: Stage[] = [
  {
    id: 'stage-1',
    number: 1,
    title: '程式起點與變數概念',
    description: '從印出第一行文字開始，學會如何用變數為資料命名與重複使用。',
    milestoneTitle: '入門啟航：變數與輸出大師',
    milestoneDescription: '你已經掌握了 Python 最核心的輸出語法與變數指派觀念，準備進入資料運算的世界！',
    lessons: [
      {
        id: '1-1',
        stageId: 'stage-1',
        orderLabel: '1.1',
        title: '第一行 Python 程式',
        subtitle: '使用 print() 讓電腦開口說話',
        mode: 'drag-blocks',
        xpReward: 50,
        estimatedMinutes: 3,
        conceptSummary:
          '在 Python 中，我們使用 print() 函式將訊息顯示在終端機畫面上。要印出一段文字時，文字兩側必須加上成對的雙引號 " " 或單引號 \' \'。',
        syntaxSpotlight: {
          caption: '點擊下方任一程式片段，查看該語法的作用：',
          tokens: [
            {
              code: 'print',
              role: 'function',
              label: '輸出函式名稱',
              explanation: 'Python 內建的指令，負責把括號內的資料輸出到畫面上。',
            },
            {
              code: '(',
              role: 'punctuation',
              label: '左括號',
              explanation: '代表函式呼叫的開始，裡面要放入想輸出的內容。',
            },
            {
              code: '"Hello, Python!"',
              role: 'string',
              label: '字串 (String)',
              explanation: '被雙引號包住的內容稱為文字字串，Python 會原封不動將它印出。',
            },
            {
              code: ')',
              role: 'punctuation',
              label: '右括號',
              explanation: '代表 print() 指令結束，左括號與右括號必須成對出現。',
            },
          ],
        },
        taskPrompt: '請將下方的積木拖曳至程式碼插槽中（或點擊積木快速填入），讓程式印出 Hello, Python!',
        expectedOutputDisplay: ['Hello, Python!'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [
              { type: 'slot', id: 'fn', placeholder: '函式名稱', minWidthCh: 8 },
              { type: 'text', value: '(' },
              { type: 'slot', id: 'msg', placeholder: '要輸出的文字', minWidthCh: 18 },
              { type: 'text', value: ')' },
            ],
          },
        ],
        blocks: [
          { id: 'b-print', code: 'print', category: 'function' },
          { id: 'b-hello', code: '"Hello, Python!"', category: 'value' },
          { id: 'b-wrong-num', code: '123', category: 'value' },
        ],
        hints: [
          '第一個插槽需要負責輸出的函式名稱：print。',
          '第二個插槽要放入帶有雙引號的文字："Hello, Python!"。',
        ],
        validate: ({ execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '程式還差一點點',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if (arraysEqual(execution.output, ['Hello, Python!'])) {
            return {
              passed: true,
              headline: '完美執行！你寫出了第一支 Python 程式',
              feedback: '終端機成功印出了 Hello, Python!，函式與字串的搭配非常正確。',
              takeaway: '記得：文字資料（字串）一定要用引號包起來，print() 才能正確辨識並印出。',
            };
          }
          return {
            passed: false,
            headline: '輸出內容不太一樣喔',
            feedback: `目前印出的是「${execution.output.join(' ')}」，目標則是 Hello, Python!，請試著更換積木再執行一次。`,
          };
        },
      },
      {
        id: '1-2',
        stageId: 'stage-1',
        orderLabel: '1.2',
        title: '認識變數與賦值',
        subtitle: '用等號 = 把資料存進有標籤的盒子',
        mode: 'fill-blank',
        xpReward: 50,
        estimatedMinutes: 4,
        conceptSummary:
          '變數就像一個貼上標籤的收納盒，可以暫時存放資料方便後續取用。在 Python 中，單一個等號 = 代表「把右邊的值放進左邊的變數裡」。',
        syntaxSpotlight: {
          caption: '點擊下方程式碼各部分，了解變數是如何建立的：',
          tokens: [
            {
              code: 'city',
              role: 'variable',
              label: '變數名稱',
              explanation: '自訂的英文名稱（不可數字開頭），用來代表這個資料盒子的標籤。',
            },
            {
              code: '=',
              role: 'operator',
              label: '賦值運算子',
              explanation: '不是數學的「等於」，而是把右邊的資料「存進」左邊變數的動作。',
            },
            {
              code: '"台北"',
              role: 'string',
              label: '儲存的字串值',
              explanation: '存進變數裡的文字內容，之後只要寫 city 就能取出它。',
            },
          ],
        },
        taskPrompt: '請填寫程式碼中的兩個空白處，建立名為 city 的變數並賦值為 "台北"，最後將它印出。',
        expectedOutputDisplay: ['台北'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [
              { type: 'blank', id: 'varName', placeholder: '變數名', hint: '請輸入 city', widthCh: 8 },
              { type: 'text', value: ' = ' },
              { type: 'blank', id: 'varValue', placeholder: '"城市名稱"', hint: '請輸入 "台北"', widthCh: 10 },
            ],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [
              { type: 'text', value: 'print(' },
              { type: 'text', value: 'city' },
              { type: 'text', value: ')' },
            ],
          },
        ],
        hints: [
          '第二行的 print(city) 會讀取名為 city 的變數，所以第一行左邊必須寫 city。',
          '右邊要存入文字 "台北"，請記得加上成對的雙引號喔！',
        ],
        validate: ({ blankValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '語法需要微調一下',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          const nameClean = (blankValues.varName || '').trim();
          if (nameClean !== 'city') {
            return {
              passed: false,
              headline: '變數名稱不對應',
              feedback: '第二行使用 print(city)，所以第一行左邊的變數名稱必須完全一致地命名為 city。',
            };
          }
          if (arraysEqual(execution.output, ['台北'])) {
            return {
              passed: true,
              headline: '變數建立成功！',
              feedback: '你在右側記憶體面板可以看到 city 已經存放了 "台北"，並成功被 print() 取出印出。',
              takeaway: '變數名稱區分大小寫（city 與 City 不同），取個清楚的英文名字能讓程式更容易閱讀。',
            };
          }
          return {
            passed: false,
            headline: '輸出結果不是「台北」',
            feedback: '請確認第一行等號右邊填入的是 "台北"（含引號），再重新執行一次。',
          };
        },
      },
      {
        id: '1-3',
        stageId: 'stage-1',
        orderLabel: '1.3',
        title: '更新變數與 f-string 格式化',
        subtitle: '動態更新數值並將變數嵌入文字中',
        mode: 'drag-blocks',
        xpReward: 60,
        estimatedMinutes: 4,
        conceptSummary:
          '變數裡的值可以隨時被更新，例如 score = score + 5 會先算出新分數再存回 score。使用 f"..." 字串並加上大括號 {變數}，就能把數字和文字漂亮地組合在一起。',
        syntaxSpotlight: {
          caption: '點擊查看變數更新與 f-string 組合的關鍵語法：',
          tokens: [
            {
              code: 'score = score + 5',
              role: 'variable',
              label: '重新指派變數',
              explanation: '先讀取原本的 score（10），加上 5 得到 15 後，再覆蓋存回 score。',
            },
            {
              code: 'f"目前分數：{score}"',
              role: 'string',
              label: 'f-string 格式化字串',
              explanation: '引號前加上 f，就能在 {score} 的位置自動代入變數目前的數值。',
            },
          ],
        },
        taskPrompt: '請依序拖曳積木，完成分數從 10 分加 5 分後，印出「目前分數：15」。',
        expectedOutputDisplay: ['目前分數：15'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [
              { type: 'text', value: 'score = ' },
              { type: 'slot', id: 'init', placeholder: '初始值', minWidthCh: 6 },
            ],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [
              { type: 'text', value: 'score = ' },
              { type: 'slot', id: 'update', placeholder: '加分運算', minWidthCh: 12 },
            ],
          },
          {
            lineNumber: 3,
            indent: 0,
            segments: [
              { type: 'text', value: 'print(' },
              { type: 'slot', id: 'output', placeholder: 'f-string 訊息', minWidthCh: 20 },
              { type: 'text', value: ')' },
            ],
          },
        ],
        blocks: [
          { id: 'b-10', code: '10', category: 'value' },
          { id: 'b-add5', code: 'score + 5', category: 'operator' },
          { id: 'b-fstr', code: 'f"目前分數：{score}"', category: 'value' },
          { id: 'b-static', code: '"目前分數：10"', category: 'value' },
        ],
        hints: [
          '第一行先放入初始分數 10，第二行放入 score + 5 來完成加分。',
          '第三行請使用帶有 f 的格式化字串 f"目前分數：{score}"，而不是寫死的文字喔！',
        ],
        validate: ({ slotValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '執行時發生錯誤',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if (slotValues.output !== 'f"目前分數：{score}"') {
            return {
              passed: false,
              headline: '請使用 f-string 動態讀取變數',
              feedback: '建議將第三行換成 f"目前分數：{score}"，這樣就算分數改變，文字也會自動跟著更新！',
            };
          }
          if (arraysEqual(execution.output, ['目前分數：15'])) {
            return {
              passed: true,
              headline: '太棒了！第一階段圓滿完成',
              feedback: '變數 score 從 10 成功更新為 15，f-string 也漂亮地把分數嵌入文字中。',
              takeaway: 'f-string 是 Python 最實用的字串技巧之一，能在文字裡直接嵌入任何變數或運算結果。',
            };
          }
          return {
            passed: false,
            headline: '計算結果不太正確',
            feedback: `目前輸出為「${execution.output.join(' ')}」，請檢查第一行初始值與第二行加分運算是否為 10 與 score + 5。`,
          };
        },
      },
    ],
  },
  {
    id: 'stage-2',
    number: 2,
    title: '資料型別與基本運算',
    description: '分清楚數字與文字的差別，掌握數學運算子與布林真假邏輯。',
    milestoneTitle: '邏輯進階：型別與運算高手',
    milestoneDescription: '你已經能精準分辨數字、字串與布林值，接下來將用這些工具控制程式流程！',
    lessons: [
      {
        id: '2-1',
        stageId: 'stage-2',
        orderLabel: '2.1',
        title: '數字與文字的差別',
        subtitle: '整數 (int) 可計算，字串 (str) 需加引號',
        mode: 'fill-blank',
        xpReward: 60,
        estimatedMinutes: 4,
        conceptSummary:
          '在 Python 中，50 是整數（int），可以做加減乘除；而 "50" 則是字串（str），代表文字字元。計算價錢與數量時，必須使用不加引號的純數字。',
        syntaxSpotlight: {
          caption: '點擊查看不同型別的寫法差異：',
          tokens: [
            {
              code: 'price = 50',
              role: 'number',
              label: '整數 int',
              explanation: '不加引號的數字屬於 int 整數型別，可以直接進行乘法或加減計算。',
            },
            {
              code: '*',
              role: 'operator',
              label: '乘法運算子',
              explanation: '在程式語言中使用星號 * 代表乘法（而不是數學的 ×）。',
            },
            {
              code: 'total',
              role: 'variable',
              label: '儲存計算結果',
              explanation: 'price * count 的乘積會存入 total 變數中。',
            },
          ],
        },
        taskPrompt: '單價 price 為 50 元、數量 count 為 3 個，請完成填空並計算總金額 total。',
        expectedOutputDisplay: ['總金額為 150 元'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [
              { type: 'text', value: 'price = ' },
              { type: 'blank', id: 'priceVal', placeholder: '50', hint: '填入整數 50（不要引號）', widthCh: 6 },
            ],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [
              { type: 'text', value: 'count = ' },
              { type: 'blank', id: 'countVal', placeholder: '3', hint: '填入整數 3（不要引號）', widthCh: 6 },
            ],
          },
          {
            lineNumber: 3,
            indent: 0,
            segments: [
              { type: 'text', value: 'total = price ' },
              { type: 'blank', id: 'op', placeholder: '乘號', hint: '乘法符號 *', widthCh: 4 },
              { type: 'text', value: ' count' },
            ],
          },
          {
            lineNumber: 4,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"總金額為 {total} 元")' }],
          },
        ],
        hints: [
          'price 應填入 50，count 應填入 3，記得不要加上引號，否則會變成文字！',
          '第三行用來計算總價，請在 price 和 count 中間填入乘號 *。',
        ],
        validate: ({ blankValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '運算型別出現問題',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if ((blankValues.priceVal || '').includes('"') || (blankValues.countVal || '').includes('"')) {
            return {
              passed: false,
              headline: '數字不需要加引號喔',
              feedback: '加上引號會讓數字變成 str 字串型別，請拿掉引號改成純數字 50 與 3。',
            };
          }
          if (arraysEqual(execution.output, ['總金額為 150 元'])) {
            return {
              passed: true,
              headline: '型別掌握得非常精準！',
              feedback: '右側變數面板顯示 price、count 與 total 都是 int (整數)，乘法結果 150 完全正確。',
              takeaway: '永遠記住：要做數學計算的數字不加引號；要顯示的純文字才加引號。',
            };
          }
          return {
            passed: false,
            headline: '輸出金額與預期不符',
            feedback: '請確認單價為 50、數量為 3，並使用乘號 * 相乘。',
          };
        },
      },
      {
        id: '2-2',
        stageId: 'stage-2',
        orderLabel: '2.2',
        title: '整數除法與餘數運算',
        subtitle: '用 // 求商數、用 % 求餘數',
        mode: 'drag-blocks',
        xpReward: 65,
        estimatedMinutes: 4,
        conceptSummary:
          '在 Python 中，一般除法 / 會得到小數；若只要「整數商數」請用雙斜線 //，想求「剩下的餘數」則用百分比符號 %。',
        syntaxSpotlight: {
          caption: '點擊查看 Python 特有的兩種除法運算子：',
          tokens: [
            {
              code: '//',
              role: 'operator',
              label: '整數除法 (Floor Division)',
              explanation: '只取除法的整數商數、無條件捨去小數，例如 17 // 5 結果為 3。',
            },
            {
              code: '%',
              role: 'operator',
              label: '取餘數 (Modulo)',
              explanation: '算出相除之後還剩下多少，例如 17 % 5 結果為 2。',
            },
          ],
        },
        taskPrompt: '共有 17 顆蘋果要平分給 5 位朋友，請拖曳正確的運算子積木算出每人分幾顆與剩下幾顆。',
        expectedOutputDisplay: ['每人分到 3 顆，還剩下 2 顆'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [{ type: 'text', value: 'apples = 17' }],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [{ type: 'text', value: 'friends = 5' }],
          },
          {
            lineNumber: 3,
            indent: 0,
            segments: [
              { type: 'text', value: 'each = apples ' },
              { type: 'slot', id: 'divOp', placeholder: '商數', minWidthCh: 5 },
              { type: 'text', value: ' friends' },
            ],
          },
          {
            lineNumber: 4,
            indent: 0,
            segments: [
              { type: 'text', value: 'left = apples ' },
              { type: 'slot', id: 'modOp', placeholder: '餘數', minWidthCh: 5 },
              { type: 'text', value: ' friends' },
            ],
          },
          {
            lineNumber: 5,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"每人分到 {each} 顆，還剩下 {left} 顆")' }],
          },
        ],
        blocks: [
          { id: 'b-floor', code: '//', category: 'operator' },
          { id: 'b-mod', code: '%', category: 'operator' },
          { id: 'b-div', code: '/', category: 'operator' },
        ],
        hints: [
          '如果用單斜線 /，17 / 5 會算出小數 3.4，但蘋果不能切碎喔！',
          '第 3 行用 // 算出整數商數 3，第 4 行用 % 算出餘數 2。',
        ],
        validate: ({ execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '程式執行未完成',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if (arraysEqual(execution.output, ['每人分到 3 顆，還剩下 2 顆'])) {
            return {
              passed: true,
              headline: '分配得剛剛好！',
              feedback: '17 // 5 得到整數 3，17 % 5 得到餘數 2，你已經掌握實用的整除與餘數運算。',
              takeaway: '% 取餘數在實務上常常用來判斷奇偶數（n % 2 == 0）或週期循環喔！',
            };
          }
          return {
            passed: false,
            headline: '分出來的數量不太對喔',
            feedback: `目前印出「${execution.output.join(' ')}」，請確認第 3 行使用 //（整數除法）而第 4 行使用 %（取餘數）。`,
          };
        },
      },
      {
        id: '2-3',
        stageId: 'stage-2',
        orderLabel: '2.3',
        title: '布林值與比較運算',
        subtitle: '判斷條件是否成立，得到 True 或 False',
        mode: 'fill-blank',
        xpReward: 70,
        estimatedMinutes: 4,
        conceptSummary:
          '比較兩個資料的大小或相等關係時，結果只會有兩種布林值（bool）：True（成立）或 False（不成立）。特別注意，判斷「是否相等」要寫兩個等號 ==。',
        syntaxSpotlight: {
          caption: '點擊查看比較運算子的正確用法：',
          tokens: [
            {
              code: '>=',
              role: 'operator',
              label: '大於或等於',
              explanation: '檢查左邊的數字是否大於等於右邊，例如 18 >= 18 會得到 True。',
            },
            {
              code: '==',
              role: 'operator',
              label: '是否相等',
              explanation: '兩個等號用來「比較」兩邊是否相同；單個等號 = 才是賦值。',
            },
            {
              code: 'True',
              role: 'keyword',
              label: '布林真值 (bool)',
              explanation: '代表條件成立，開頭的 T 必須是大寫。',
            },
          ],
        },
        taskPrompt: '請填入比較運算子，檢查 age 是否大於等於 18，以及 vip 是否等於 True。',
        expectedOutputDisplay: ['成年資格：True', 'VIP 身分：True'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [{ type: 'text', value: 'age = 18' }],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [{ type: 'text', value: 'vip = True' }],
          },
          {
            lineNumber: 3,
            indent: 0,
            segments: [
              { type: 'text', value: 'is_adult = age ' },
              { type: 'blank', id: 'cmpAge', placeholder: '大於等於', hint: '請輸入 >=', widthCh: 6 },
              { type: 'text', value: ' 18' },
            ],
          },
          {
            lineNumber: 4,
            indent: 0,
            segments: [
              { type: 'text', value: 'is_vip = vip ' },
              { type: 'blank', id: 'cmpVip', placeholder: '相等', hint: '請輸入 ==', widthCh: 6 },
              { type: 'text', value: ' True' },
            ],
          },
          {
            lineNumber: 5,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"成年資格：{is_adult}")' }],
          },
          {
            lineNumber: 6,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"VIP 身分：{is_vip}")' }],
          },
        ],
        hints: [
          'age 是 18，要讓「大於等於 18」成立，需填入 >=。',
          '判斷 vip 是否等於 True，要使用兩個等號 ==，不可只寫一個 =。',
        ],
        validate: ({ blankValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '語法有誤喔',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if ((blankValues.cmpAge || '').trim() !== '>=') {
            return {
              passed: false,
              headline: '第一處比較運算子需為「大於等於」',
              feedback: '題目要求檢查是否「大於等於」18，請使用 >= 符號。',
            };
          }
          if ((blankValues.cmpVip || '').trim() !== '==') {
            return {
              passed: false,
              headline: '第二處比較運算子需為「相等判斷」',
              feedback: '判斷兩者是否相等請使用兩個等號 ==。',
            };
          }
          if (arraysEqual(execution.output, ['成年資格：True', 'VIP 身分：True'])) {
            return {
              passed: true,
              headline: '第二階段過關！邏輯感滿分',
              feedback: '兩個布林變數都計算出 True，你已具備進入條件判斷與迴圈控制的基礎。',
              takeaway: '區分 =（把值放進去）和 ==（檢查兩邊是否相等）是初學 Python 最重要的一步！',
            };
          }
          return {
            passed: false,
            headline: '判斷結果不符合預期',
            feedback: '請確認比較運算子是否分別填入 >= 與 ==。',
          };
        },
      },
    ],
  },
  {
    id: 'stage-3',
    number: 3,
    title: '邏輯判斷與重複執行',
    description: '學會讓程式依照不同條件做出決定，並用迴圈自動重複任務。',
    milestoneTitle: '流程大師：控制結構解鎖',
    milestoneDescription: '太厲害了！你已經學會 if/elif/else 分支與 for 迴圈，這正是讓程式變聰明的關鍵。',
    lessons: [
      {
        id: '3-1',
        stageId: 'stage-3',
        orderLabel: '3.1',
        title: '條件判斷 if 與 else',
        subtitle: '用縮排告訴 Python 條件成立時要執行哪些程式',
        mode: 'drag-blocks',
        xpReward: 75,
        estimatedMinutes: 5,
        conceptSummary:
          'if 與 else 可以讓程式根據條件選擇不同路線。要注意每個條件結尾都必須加上冒號 :，而底下要執行的程式行則必須向右縮排 4 個空白。',
        syntaxSpotlight: {
          caption: '點擊觀察條件判斷與「縮排」的重要性：',
          tokens: [
            {
              code: 'if temp > 30:',
              role: 'keyword',
              label: '條件開頭與冒號',
              explanation: '當 temp 大於 30 為 True 時，就會執行下方有縮排的程式。',
            },
            {
              code: '    print(...)',
              role: 'function',
              label: '4 個空白的縮排區塊',
              explanation: 'Python 靠縮排來分辨這行程式屬於上面的 if 或 else 區塊。',
            },
            {
              code: 'else:',
              role: 'keyword',
              label: '否則分支',
              explanation: '當 if 條件不成立（False）時，程式就會轉而執行 else: 底下的縮排區塊。',
            },
          ],
        },
        taskPrompt: '現在氣溫 temp = 33 度，請將積木拖曳至對應的縮排插槽，讓程式判斷高溫並印出提醒訊息。',
        expectedOutputDisplay: ['天氣炎熱，記得多喝水'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [{ type: 'text', value: 'temp = 33' }],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [{ type: 'slot', id: 'ifHead', placeholder: 'if 條件句:', minWidthCh: 18 }],
          },
          {
            lineNumber: 3,
            indent: 1,
            segments: [{ type: 'slot', id: 'ifBody', placeholder: '條件成立時執行', minWidthCh: 28 }],
          },
          {
            lineNumber: 4,
            indent: 0,
            segments: [{ type: 'slot', id: 'elseHead', placeholder: 'else 分支:', minWidthCh: 10 }],
          },
          {
            lineNumber: 5,
            indent: 1,
            segments: [{ type: 'slot', id: 'elseBody', placeholder: '條件不成立時執行', minWidthCh: 24 }],
          },
        ],
        blocks: [
          { id: 'b-if', code: 'if temp > 30:', category: 'keyword' },
          { id: 'b-hot', code: 'print("天氣炎熱，記得多喝水")', category: 'function' },
          { id: 'b-else', code: 'else:', category: 'keyword' },
          { id: 'b-cool', code: 'print("氣溫舒適涼爽")', category: 'function' },
        ],
        hints: [
          '第 2 行應放入 if temp > 30:，第 3 行縮排處放入高溫提醒的 print(...)。',
          '第 4 行放 else:，第 5 行放氣溫舒適的 print(...)。',
        ],
        validate: ({ slotValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '條件結構尚未完成',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if (slotValues.ifHead !== 'if temp > 30:' || slotValues.elseHead !== 'else:') {
            return {
              passed: false,
              headline: '請檢查 if 與 else 的位置',
              feedback: '第 2 行應該是 if temp > 30:，第 4 行則是 else:。',
            };
          }
          if (arraysEqual(execution.output, ['天氣炎熱，記得多喝水'])) {
            return {
              passed: true,
              headline: '條件判斷精準命中！',
              feedback: '因為 temp 是 33 大於 30，Python 走進了 if 的縮排區塊，並跳過了 else。',
              takeaway: '冒號 : 加上縮排，是 Python 組織程式區塊最標誌性的優雅設計。',
            };
          }
          return {
            passed: false,
            headline: '分支內容位置好像放反了',
            feedback: '當 temp > 30 成立時，應該印出「天氣炎熱，記得多喝水」喔！',
          };
        },
      },
      {
        id: '3-2',
        stageId: 'stage-3',
        orderLabel: '3.2',
        title: '多重條件分流 elif',
        subtitle: '當情況超過兩種時，依序檢查多個條件',
        mode: 'fill-blank',
        xpReward: 75,
        estimatedMinutes: 5,
        conceptSummary:
          '如果需要判斷三個以上的等級（例如優等、及格、待加強），可以在 if 和 else 中間加入 elif（代表 else if）。程式會由上而下檢查，找到第一個符合的分支就停止。',
        syntaxSpotlight: {
          caption: '點擊查看多重條件的關鍵字：',
          tokens: [
            {
              code: 'elif',
              role: 'keyword',
              label: '否則如果 (else if)',
              explanation: '當前面的 if 不成立時，接著測試下一個條件，可寫多個 elif。',
            },
            {
              code: 'score >= 60:',
              role: 'operator',
              label: '及格門檻條件',
              explanation: '注意結尾必須有冒號 :，條件才會完整。',
            },
          ],
        },
        taskPrompt: '分數 score = 75，請補齊多重條件程式，讓 80 分以上印出「優良」、60 分以上印出「及格」、其餘印出「再加油」。',
        expectedOutputDisplay: ['及格'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [{ type: 'text', value: 'score = 75' }],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [{ type: 'text', value: 'if score >= 80:' }],
          },
          {
            lineNumber: 3,
            indent: 1,
            segments: [{ type: 'text', value: 'print("優良")' }],
          },
          {
            lineNumber: 4,
            indent: 0,
            segments: [
              { type: 'blank', id: 'kw', placeholder: '關鍵字', hint: '輸入 elif', widthCh: 6 },
              { type: 'text', value: ' score >= ' },
              { type: 'blank', id: 'limit', placeholder: '分數', hint: '及格分數 60', widthCh: 5 },
              { type: 'text', value: ':' },
            ],
          },
          {
            lineNumber: 5,
            indent: 1,
            segments: [{ type: 'text', value: 'print("及格")' }],
          },
          {
            lineNumber: 6,
            indent: 0,
            segments: [{ type: 'text', value: 'else:' }],
          },
          {
            lineNumber: 7,
            indent: 1,
            segments: [{ type: 'text', value: 'print("再加油")' }],
          },
        ],
        hints: [
          '第 4 行需要用到「否則如果」的關鍵字：elif（全部小寫）。',
          '及格分數門檻為 60，因此第二個空白請填入 60。',
        ],
        validate: ({ blankValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '語法需要檢查一下',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if ((blankValues.kw || '').trim() !== 'elif') {
            return {
              passed: false,
              headline: '第 4 行的關鍵字不對喔',
              feedback: '在 Python 中要接續下一個條件測試，必須使用 elif 關鍵字（不是 else if）。',
            };
          }
          if ((blankValues.limit || '').trim() !== '60') {
            return {
              passed: false,
              headline: '及格門檻分數不正確',
              feedback: '題目設定 60 分以上為及格，請將分數門檻設為 60。',
            };
          }
          if (arraysEqual(execution.output, ['及格'])) {
            return {
              passed: true,
              headline: '多重條件邏輯完全正確！',
              feedback: '75 分未達 80，但符合 elif score >= 60，因此精準印出「及格」。',
              takeaway: '寫 if / elif 時要特別留意條件的順序，通常由最嚴格（分數最高）往低處判斷。',
            };
          }
          return {
            passed: false,
            headline: '輸出與預期不符',
            feedback: '請確認空白處分別填入 elif 與 60。',
          };
        },
      },
      {
        id: '3-3',
        stageId: 'stage-3',
        orderLabel: '3.3',
        title: '用 for 迴圈重複任務',
        subtitle: '搭配 range() 自動重複執行指定次數',
        mode: 'drag-blocks',
        xpReward: 80,
        estimatedMinutes: 5,
        conceptSummary:
          '寫程式最棒的地方就是讓電腦幫我們重複工作！使用 for i in range(1, 4): 可以讓變數 i 依序變成 1、2、3（注意不包含結尾數字 4），並重複執行縮排內的程式。',
        syntaxSpotlight: {
          caption: '點擊查看 for 迴圈與 range() 的規則：',
          tokens: [
            {
              code: 'for i in',
              role: 'keyword',
              label: '迴圈結構',
              explanation: '依序從後方的範圍中取出每一個數字，暫時放進變數 i 裡。',
            },
            {
              code: 'range(1, 4)',
              role: 'function',
              label: '數字產生器',
              explanation: '產生從 1 開始、到 4 之前結束的整數序列，也就是 1, 2, 3。',
            },
          ],
        },
        taskPrompt: '請組裝一個 for 迴圈，讓終端機依序印出「第 1 次練習」、「第 2 次練習」、「第 3 次練習」。',
        expectedOutputDisplay: ['第 1 次練習', '第 2 次練習', '第 3 次練習'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [
              { type: 'slot', id: 'forHead', placeholder: 'for 迴圈宣告', minWidthCh: 10 },
              { type: 'text', value: ' ' },
              { type: 'slot', id: 'rangeExpr', placeholder: 'range 範圍', minWidthCh: 14 },
              { type: 'text', value: ':' },
            ],
          },
          {
            lineNumber: 2,
            indent: 1,
            segments: [{ type: 'slot', id: 'loopBody', placeholder: '重複執行的 print', minWidthCh: 28 }],
          },
        ],
        blocks: [
          { id: 'b-for', code: 'for i in', category: 'keyword' },
          { id: 'b-range14', code: 'range(1, 4)', category: 'function' },
          { id: 'b-range13', code: 'range(1, 3)', category: 'function' },
          { id: 'b-printi', code: 'print(f"第 {i} 次練習")', category: 'function' },
        ],
        hints: [
          'range(起始, 結束) 不會包含結束數字本身，所以想印出 1 到 3，要選擇 range(1, 4)！',
          '迴圈內的縮排程式請放入 print(f"第 {i} 次練習")，每次迴圈 i 都會自動換成下一個數字。',
        ],
        validate: ({ execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '迴圈組裝尚未完成',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if (arraysEqual(execution.output, ['第 1 次練習', '第 2 次練習', '第 3 次練習'])) {
            return {
              passed: true,
              headline: '第三階段全數突破！',
              feedback: '短短兩行程式碼就自動執行了三次任務，這就是自動化與迴圈的威力！',
              takeaway: '記住 range(start, stop) 的「含頭不含尾」特性，就不會少算最後一次囉。',
            };
          }
          if (arraysEqual(execution.output, ['第 1 次練習', '第 2 次練習'])) {
            return {
              passed: false,
              headline: '少跑了一次喔！',
              feedback: 'range(1, 3) 只會產生 1 和 2（不包含 3），請改用 range(1, 4) 再試一次。',
            };
          }
          return {
            passed: false,
            headline: '輸出順序或內容不對喔',
            feedback: '請檢查第 1 行是否為 for i in range(1, 4):，第 2 行是否印出 f"第 {i} 次練習"。',
          };
        },
      },
    ],
  },
  {
    id: 'stage-4',
    number: 4,
    title: '資料集合與函式封裝',
    description: '學會用串列管理多筆資料、用迴圈加總計算，並定義自己的函式。',
    milestoneTitle: '基礎畢業：Python 實戰架構師',
    milestoneDescription: '恭喜你完成全部四個階段！你已經能獨立運用變數、條件、迴圈、串列與函式解決真實問題。',
    lessons: [
      {
        id: '4-1',
        stageId: 'stage-4',
        orderLabel: '4.1',
        title: '認識串列與索引取值',
        subtitle: '用中括號 [ ] 一次儲存多筆有序資料',
        mode: 'fill-blank',
        xpReward: 80,
        estimatedMinutes: 4,
        conceptSummary:
          '當資料很多筆時，我們可以用串列（list）把多個元素放進中括號 [ ] 裡。要取出特定位置的資料時，別忘了 Python 的索引位置是從 0 開始數的！',
        syntaxSpotlight: {
          caption: '點擊查看串列索引與 len() 長度函式：',
          tokens: [
            {
              code: 'fruits[0]',
              role: 'variable',
              label: '第 1 個元素（索引 0）',
              explanation: '串列的第一項編號是 0，第二項編號是 1，依此類推。',
            },
            {
              code: 'len(fruits)',
              role: 'function',
              label: '計算元素數量',
              explanation: 'len() 會回傳串列裡總共有幾筆資料。',
            },
          ],
        },
        taskPrompt: '串列 fruits 中依序有蘋果、香蕉、芒果。請填寫索引取得「香蕉」，並用 len() 算出共有幾種水果。',
        expectedOutputDisplay: ['第二種水果：香蕉', '共有 3 種水果'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [{ type: 'text', value: 'fruits = ["蘋果", "香蕉", "芒果"]' }],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [
              { type: 'text', value: 'second = fruits[' },
              { type: 'blank', id: 'idx', placeholder: '索引', hint: '從 0 開始數，香蕉是第幾個？', widthCh: 4 },
              { type: 'text', value: ']' },
            ],
          },
          {
            lineNumber: 3,
            indent: 0,
            segments: [
              { type: 'text', value: 'count = ' },
              { type: 'blank', id: 'lenFn', placeholder: '函式', hint: '計算串列長度的 len(fruits)', widthCh: 12 },
            ],
          },
          {
            lineNumber: 4,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"第二種水果：{second}")' }],
          },
          {
            lineNumber: 5,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"共有 {count} 種水果")' }],
          },
        ],
        hints: [
          '蘋果是索引 0，所以香蕉的索引編號是 1。',
          '第 3 行請填入 len(fruits) 來計算串列的元素總數。',
        ],
        validate: ({ blankValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '串列取值發生錯誤',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if ((blankValues.lenFn || '').trim() !== 'len(fruits)') {
            return {
              passed: false,
              headline: '請使用 len() 函式計算長度',
              feedback: '第 3 行請填入 len(fruits)，讓程式自動算出串列中有幾項資料。',
            };
          }
          if (arraysEqual(execution.output, ['第二種水果：香蕉', '共有 3 種水果'])) {
            return {
              passed: true,
              headline: '串列索引零失誤！',
              feedback: '你成功用 fruits[1] 取出第二筆資料「香蕉」，並用 len() 計算總數 3。',
              takeaway: '「索引從 0 開始」是幾乎所有現代程式語言的共通規則，多練習幾次就會很直覺！',
            };
          }
          return {
            passed: false,
            headline: '取出的水果不對喔',
            feedback: '蘋果是 0 號，香蕉是 1 號，請檢查 fruits[...] 裡填入的索引數字。',
          };
        },
      },
      {
        id: '4-2',
        stageId: 'stage-4',
        orderLabel: '4.2',
        title: '走訪串列並累加總和',
        subtitle: '結合 for 迴圈逐一處理串列內的每筆數字',
        mode: 'drag-blocks',
        xpReward: 90,
        estimatedMinutes: 5,
        conceptSummary:
          'for 迴圈不只可以搭配 range()，也能直接逐一讀取串列裡的每個項目！只要先準備一個初始為 0 的累加變數 total，就能在迴圈裡輕鬆算出總金額。',
        syntaxSpotlight: {
          caption: '點擊查看串列走訪與累加器的運作方式：',
          tokens: [
            {
              code: 'for price in prices:',
              role: 'keyword',
              label: '逐一取出串列元素',
              explanation: '迴圈每一輪都會把 prices 裡的下一個數字放進 price 變數。',
            },
            {
              code: 'total = total + price',
              role: 'operator',
              label: '累加器模式',
              explanation: '把目前的 price 加進 total 裡，最後就會得到所有項目的總和。',
            },
          ],
        },
        taskPrompt: '購物車裡有三件商品 prices = [40, 60, 50]，請拖曳積木完成迴圈累加，印出總價 150。',
        expectedOutputDisplay: ['購物車總計：150 元'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [{ type: 'text', value: 'prices = [40, 60, 50]' }],
          },
          {
            lineNumber: 2,
            indent: 0,
            segments: [
              { type: 'text', value: 'total = ' },
              { type: 'slot', id: 'initTotal', placeholder: '初始總和', minWidthCh: 6 },
            ],
          },
          {
            lineNumber: 3,
            indent: 0,
            segments: [
              { type: 'slot', id: 'forEach', placeholder: '走訪 prices 迴圈', minWidthCh: 22 },
            ],
          },
          {
            lineNumber: 4,
            indent: 1,
            segments: [{ type: 'slot', id: 'accumulate', placeholder: '累加運算', minWidthCh: 22 }],
          },
          {
            lineNumber: 5,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"購物車總計：{total} 元")' }],
          },
        ],
        blocks: [
          { id: 'b-zero', code: '0', category: 'value' },
          { id: 'b-for-prices', code: 'for price in prices:', category: 'keyword' },
          { id: 'b-acc', code: 'total = total + price', category: 'operator' },
          { id: 'b-wrong-acc', code: 'total = price', category: 'operator' },
        ],
        hints: [
          '累加器一開始還沒加任何東西，所以 total 要先設為 0。',
          '第 3 行用 for price in prices: 取出每件商品價格，第 4 行用 total = total + price 慢慢累加。',
        ],
        validate: ({ execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '程式還無法執行',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if (arraysEqual(execution.output, ['購物車總計：150 元'])) {
            return {
              passed: true,
              headline: '累加器邏輯完美運作！',
              feedback: 'total 從 0 依序加上 40、60、50，最後得出 150。這是處理帳單與成績統計最常見的寫法！',
              takeaway: '「初始值設為 0 + 迴圈內累加」是程式設計裡最重要的經典模式之一。',
            };
          }
          if (arraysEqual(execution.output, ['購物車總計：50 元'])) {
            return {
              passed: false,
              headline: '好像只留下最後一筆價格了',
              feedback: '如果寫 total = price，會直接覆蓋掉舊的總和；請使用 total = total + price 才能累加喔！',
            };
          }
          return {
            passed: false,
            headline: '加總結果不太正確',
            feedback: '請確認 total 初始為 0，並且在迴圈中把 price 累加進 total。',
          };
        },
      },
      {
        id: '4-3',
        stageId: 'stage-4',
        orderLabel: '4.3',
        title: '定義自己的函式 def',
        subtitle: '將常用邏輯打包，用 return 回傳結果',
        mode: 'fill-blank',
        xpReward: 100,
        estimatedMinutes: 5,
        conceptSummary:
          '使用 def 關鍵字可以打造屬於自己的功能積木（函式），讓重複的計算不必再重寫一遍。函式內部算出結果後，使用 return 將數值交還給呼叫者。',
        syntaxSpotlight: {
          caption: '點擊查看自訂函式的關鍵結構：',
          tokens: [
            {
              code: 'def calc_area(w, h):',
              role: 'keyword',
              label: '定義函式與參數',
              explanation: 'def 開頭宣告一個名為 calc_area 的函式，並接收 w 和 h 兩個輸入參數。',
            },
            {
              code: 'return',
              role: 'keyword',
              label: '回傳計算結果',
              explanation: '將函式算出來的答案送出去，讓外面可以用變數接住或直接 print。',
            },
          ],
        },
        taskPrompt: '請完成長方形面積函式 calc_area(w, h)，回傳寬乘以高的面積，並呼叫它計算寬 6、高 4 的面積。',
        expectedOutputDisplay: ['面積為：24'],
        lines: [
          {
            lineNumber: 1,
            indent: 0,
            segments: [
              { type: 'blank', id: 'defKw', placeholder: '關鍵字', hint: '輸入 def', widthCh: 5 },
              { type: 'text', value: ' calc_area(w, h):' },
            ],
          },
          {
            lineNumber: 2,
            indent: 1,
            segments: [
              { type: 'blank', id: 'retKw', placeholder: '回傳', hint: '輸入 return', widthCh: 8 },
              { type: 'text', value: ' w * h' },
            ],
          },
          {
            lineNumber: 3,
            indent: 0,
            segments: [
              { type: 'text', value: 'area = ' },
              { type: 'blank', id: 'callFn', placeholder: '呼叫 calc_area(6, 4)', hint: '輸入 calc_area(6, 4)', widthCh: 18 },
            ],
          },
          {
            lineNumber: 4,
            indent: 0,
            segments: [{ type: 'text', value: 'print(f"面積為：{area}")' }],
          },
        ],
        hints: [
          '第 1 行用來定義函式，開頭關鍵字是 def；第 2 行要回傳結果，關鍵字是 return。',
          '第 3 行要呼叫函式並傳入 6 與 4，請輸入 calc_area(6, 4)。',
        ],
        validate: ({ blankValues, execution }): LessonValidationResult => {
          if (!execution.success && execution.error) {
            return {
              passed: false,
              headline: '函式定義或呼叫有誤',
              feedback: `${execution.error.message}（${execution.error.friendlyHint}）`,
            };
          }
          if ((blankValues.callFn || '').trim() === '24') {
            return {
              passed: false,
              headline: '別忘了呼叫你定義的函式喔',
              feedback: '請在第 3 行填入 calc_area(6, 4)，親自體驗函式幫你算出 24 的過程！',
            };
          }
          if (arraysEqual(execution.output, ['面積為：24'])) {
            return {
              passed: true,
              headline: '恭喜你完成全部基礎課程！',
              feedback: '你親手打造並呼叫了第一個自訂函式，現在已經具備紮實的 Python 程式設計基礎。',
              takeaway: '善用 def 與 return 把複雜問題拆成小函式，是寫出好維護程式的關鍵習慣！',
            };
          }
          return {
            passed: false,
            headline: '結果與 24 不符',
            feedback: '請確認空白處依序填入 def、return 與 calc_area(6, 4)。',
          };
        },
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = CURRICULUM_STAGES.flatMap((stage) => stage.lessons);

export function getLessonById(lessonId: string): Lesson {
  return ALL_LESSONS.find((l) => l.id === lessonId) ?? ALL_LESSONS[0];
}

export function getStageById(stageId: string): Stage {
  return CURRICULUM_STAGES.find((s) => s.id === stageId) ?? CURRICULUM_STAGES[0];
}

export function getNextLesson(lessonId: string): Lesson | null {
  const index = ALL_LESSONS.findIndex((l) => l.id === lessonId);
  if (index === -1 || index === ALL_LESSONS.length - 1) return null;
  return ALL_LESSONS[index + 1];
}
