import {
  generateCompletions,
  generateSchemaFromPrompt,
} from "../../../scraper/scrapeURL/transformers/llmExtract";
import { TokenUsage } from "../../../controllers/v1/types";
import { z } from "zod";
import {
  buildAnalyzeSchemaPrompt,
  buildAnalyzeSchemaUserPrompt,
} from "../build-prompts";
import { logger } from "../../../lib/logger";
import { jsonSchema } from "ai";
import { getModel } from "../../../lib/generic-ai";

export async function analyzeSchemaAndPrompt(
  urls: string[],
  schema: any,
  prompt: string,
): Promise<{
  isMultiEntity: boolean;
  multiEntityKeys: string[];
  reasoning?: string;
  keyIndicators?: string[];
  tokenUsage: TokenUsage;
}> {
  if (!schema) {
    schema = await generateSchemaFromPrompt(prompt);
  }

  const schemaString = JSON.stringify(schema);

  const model = getModel("gemini-2.0-flash");

  const checkSchema = z
    .object({
      isMultiEntity: z.boolean(),
      multiEntityKeys: z.array(z.string()).optional().default([]),
      reasoning: z.string(),
      keyIndicators: z.array(z.string()),
    })
    .refine(
      (x) => !x.isMultiEntity || x.multiEntityKeys.length > 0,
      "isMultiEntity was true, but no multiEntityKeys",
    );

  try {
    const { extract: result, totalUsage } = await generateCompletions({
      logger,
      options: {
        mode: "llm",
        schema: checkSchema,
        prompt: buildAnalyzeSchemaUserPrompt(schemaString, prompt, urls),
        systemPrompt: buildAnalyzeSchemaPrompt(),
      },
      markdown: "",
      model,
    });

    const { isMultiEntity, multiEntityKeys, reasoning, keyIndicators } =
      checkSchema.parse(result);

    return {
      isMultiEntity,
      multiEntityKeys,
      reasoning,
      keyIndicators,
      tokenUsage: totalUsage,
    };
  } catch (e) {
    logger.warn("(analyzeSchemaAndPrompt) Error parsing schema analysis", {
      error: e,
    });
  }

  return {
    isMultiEntity: false,
    multiEntityKeys: [],
    reasoning: "",
    keyIndicators: [],
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      model: model.modelId,
    },
  };
}
