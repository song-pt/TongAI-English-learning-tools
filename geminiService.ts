
import { GoogleGenAI, Type } from "@google/genai";
import { WordPair, ContextQuestion, GrammarPracticeData } from './types';

const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const fetchWordPairs = async (userWords: string, modelName: string = 'gemini-3-flash-preview'): Promise<WordPair[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `请将以下英文单词翻译成中文。输出要求：仅输出 JSON 数组格式，每个对象包含 'en' 和 'cn'。单词列表如下：\n ${userWords}`;
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            en: { type: Type.STRING },
            cn: { type: Type.STRING },
          },
          required: ["en", "cn"],
        },
      },
    }
  });

  const jsonStr = cleanJsonResponse(response.text || '[]');
  const rawPairs = JSON.parse(jsonStr);
  
  return rawPairs.map((p: any, i: number) => ({
    id: `${i}-${Date.now()}`,
    en: p.en,
    cn: p.cn
  }));
};

export const fetchContextQuestions = async (userWords: string, allowInflection: boolean, count: number, modelName: string = 'gemini-3-flash-preview'): Promise<ContextQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inflectionText = allowInflection ? "允许" : "禁止";
  const prompt = `请为以下单词生成 ${count} 道英文填空题，返回 JSON 数组格式。每个对象包含 'sentence' (用 _____ 代替待填词) 和 'answer' (正确的单词)。
  要求：
  1. 句子要简单易懂。
  2. 答案必须来自单词列表。
  3. ${inflectionText} 单词变形。
  单词列表：${userWords}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING },
            answer: { type: Type.STRING },
          },
          required: ["sentence", "answer"],
        },
      },
    }
  });

  const jsonStr = cleanJsonResponse(response.text || '[]');
  return JSON.parse(jsonStr) as ContextQuestion[];
};

export const fetchGrammarData = async (grammarPoint: string, grade: string, count: number, modelName: string = 'gemini-3-flash-preview'): Promise<GrammarPracticeData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `你是一个专业的英语教师。请针对以下语法点和年级生成学习内容。
  语法点：${grammarPoint}
  适用年级：${grade}

  请返回一个 JSON 对象，包含以下结构：
  1. explanation: 对象，包含 title (语法点名称), usage (详细用法解释), examples (3个例句数组), comparisons (与其他易混淆语法的对比)。
  2. fillQuestions: ${count}个填空题对象数组。每个包含 sentence (挖空处用 _____ 表示), hint (括号里的原形提示), 和 answer。
     【极重要要求】：挖空处对应的 answer 必须是一个且仅一个单词！
     禁止考查多词短语。助动词（如 are/is/do/have/has/will）必须直接写在 sentence 中，而不是放在 answer 里。
     错误示范：sentence: "The students _____ (dance) in the hall.", answer: "are dancing" (这是错的！)
     正确示范：sentence: "The students are _____ (dance) in the hall.", answer: "dancing" (这才是对的！)
     目标是让用户只填写提示词 (hint) 的正确形式。
  3. choiceQuestions: ${count}个选择题对象数组，每个包含 sentence (挖空处用 _____ 表示), options (包含正确项和干扰项的数组), answer (正确选项)。

  所有内容必须符合该年级的认知水平。`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              usage: { type: Type.STRING },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
              comparisons: { type: Type.STRING },
            },
            required: ["title", "usage", "examples", "comparisons"]
          },
          fillQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sentence: { type: Type.STRING },
                hint: { type: Type.STRING },
                answer: { type: Type.STRING },
              },
              required: ["sentence", "hint", "answer"]
            }
          },
          choiceQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sentence: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
              },
              required: ["sentence", "options", "answer"]
            }
          }
        },
        required: ["explanation", "fillQuestions", "choiceQuestions"]
      },
    }
  });

  const jsonStr = cleanJsonResponse(response.text || '{}');
  return JSON.parse(jsonStr) as GrammarPracticeData;
};

export const fetchExplanationForError = async (sentence: string, correctAnswer: string, userAnswer: string, modelName: string = 'gemini-3-flash-preview'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `你是一个专业的英语私人教师。用户在练习中做错了一道题。
  句子背景: "${sentence.replace('_____', '[' + correctAnswer + ']')}"
  正确答案: "${correctAnswer}"
  用户的错误答案: "${userAnswer}"

  请分析：
  1. 为什么用户的答案是错误的。
  2. 正确答案背后的语法逻辑。
  3. 记忆小贴士。

  要求：
  - 使用中文回答。
  - **重点词汇或短语请务必使用 **双星号** 包围（例如：**are running**），以便前端进行加粗显示。**
  - 语言简练，直击痛点。
  - 控制在 150 字左右。`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  return response.text || '抱歉，暂时无法获取分析结果。';
};
