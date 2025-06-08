import { anthropic, createAnthropic } from "@ai-sdk/anthropic"
import { google, createGoogleGenerativeAI } from "@ai-sdk/google"
import { mistral, createMistral } from "@ai-sdk/mistral"
import { openai, createOpenAI } from "@ai-sdk/openai"
import type { LanguageModelV1 } from "@ai-sdk/provider"
import { xai, createXai } from "@ai-sdk/xai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { getProviderForModel } from "./provider-map"

import type {
  AnthropicModel,
  GeminiModel,
  MistralModel,
  OllamaModel,
  OpenAIModel,
  SupportedModel,
  XaiModel,
} from "./types"


type OpenAIChatSettings = Parameters<typeof openai>[1]
type MistralProviderSettings = Parameters<typeof mistral>[1]
type GoogleGenerativeAIProviderSettings = Parameters<typeof google>[1]
type AnthropicProviderSettings = Parameters<typeof anthropic>[1]
type XaiProviderSettings = Parameters<typeof xai>[1]
type OllamaProviderSettings = OpenAIChatSettings // Ollama uses OpenAI-compatible API

type ModelSettings<T extends SupportedModel> = T extends OpenAIModel
  ? OpenAIChatSettings
  : T extends MistralModel
    ? MistralProviderSettings
    : T extends GeminiModel
      ? GoogleGenerativeAIProviderSettings
      : T extends AnthropicModel
        ? AnthropicProviderSettings
        : T extends XaiModel
          ? XaiProviderSettings
          : T extends OllamaModel
            ? OllamaProviderSettings
            : never

export type OpenProvidersOptions<T extends SupportedModel> = ModelSettings<T>

// Get Ollama base URL from environment or use default
const getOllamaBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use localhost
    return "http://localhost:11434/v1"
  }
  
  // Server-side: check environment variables
  return process.env.OLLAMA_BASE_URL?.replace(/\/+$/, '') + "/v1" || "http://localhost:11434/v1"
}

// Create Ollama provider instance with configurable baseURL
const createOllamaProvider = () => {
  return createOpenAI({
    baseURL: getOllamaBaseURL(),
    apiKey: "ollama", // Ollama doesn't require a real API key
    name: "ollama",
  })
}

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: OpenProvidersOptions<T>,
  apiKey?: string
): LanguageModelV1 {
  const provider = getProviderForModel(modelId)

  if (provider === "openrouter") {
    if (apiKey) {
      const openrouterProvider = createOpenRouter({ apiKey })
      return openrouterProvider.chat(modelId as string)
    }
    const openrouterProvider = createOpenRouter({ 
      apiKey: process.env.OPENROUTER_API_KEY 
    })
    return openrouterProvider.chat(modelId as string)
  }

  if (provider === "openai") {
    if (apiKey) {
      const openaiProvider = createOpenAI({ 
        apiKey,
        compatibility: 'strict'
      })
      return openaiProvider(modelId as OpenAIModel, settings as OpenAIChatSettings)
    }
    return openai(modelId as OpenAIModel, settings as OpenAIChatSettings)
  }

  if (provider === "mistral") {
    if (apiKey) {
      const mistralProvider = createMistral({ apiKey })
      return mistralProvider(modelId as MistralModel, settings as MistralProviderSettings)
    }
    return mistral(modelId as MistralModel, settings as MistralProviderSettings)
  }

  if (provider === "google") {
    if (apiKey) {
      const googleProvider = createGoogleGenerativeAI({ apiKey })
      return googleProvider(modelId as GeminiModel, settings as GoogleGenerativeAIProviderSettings)
    }
    return google(modelId as GeminiModel, settings as GoogleGenerativeAIProviderSettings)
  }

  if (provider === "anthropic") {
    if (apiKey) {
      const anthropicProvider = createAnthropic({ apiKey })
      return anthropicProvider(modelId as AnthropicModel, settings as AnthropicProviderSettings)
    }
    return anthropic(modelId as AnthropicModel, settings as AnthropicProviderSettings)
  }

  if (provider === "xai") {
    if (apiKey) {
      const xaiProvider = createXai({ apiKey })
      return xaiProvider(modelId as XaiModel, settings as XaiProviderSettings)
    }
    return xai(modelId as XaiModel, settings as XaiProviderSettings)
  }

  if (provider === "ollama") {
    const ollamaProvider = createOllamaProvider()
    return ollamaProvider(modelId as OllamaModel, settings as OllamaProviderSettings)
  }

  throw new Error(`Unsupported model: ${modelId}`)
}
