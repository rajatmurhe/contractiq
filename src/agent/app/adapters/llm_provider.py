from abc import ABC, abstractmethod
from typing import Any, Dict
from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_community.llms.fake import FakeListLLM

class ILLMProvider(ABC):
    """Abstraction over LLM backends. Config selects implementation."""

    @abstractmethod
    def get_chat_model(self, temperature: float = 0.0, max_tokens: int = 4096) -> BaseLanguageModel: ...

    @abstractmethod
    def get_embedding_model(self) -> Any: ...

class FakeDeterministicProvider(ILLMProvider):
    """Deterministic fake for automated tests. Returns pre-configured JSON responses."""
    def get_chat_model(self, temperature: float = 0.0, max_tokens: int = 4096) -> BaseLanguageModel:
        return FakeListLLM(responses=["fake response"])

    def get_embedding_model(self) -> Any:
        return None

class OllamaProvider(ILLMProvider):
    """Real Ollama provider for local development demo."""
    def get_chat_model(self, temperature: float = 0.0, max_tokens: int = 4096) -> BaseLanguageModel:
        from langchain_community.chat_models import ChatOllama
        from app.config import settings
        return ChatOllama(base_url=settings.ollama_base_url, model=settings.ollama_model, temperature=temperature) # type: ignore

    def get_embedding_model(self) -> Any:
        return None

class AzureOpenAIProvider(ILLMProvider):
    """Production Azure OpenAI provider."""
    def get_chat_model(self, temperature: float = 0.0, max_tokens: int = 4096) -> BaseLanguageModel:
        from langchain_openai import AzureChatOpenAI
        from app.config import settings
        return AzureChatOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key, # type: ignore
            azure_deployment=settings.azure_openai_deployment,
            api_version="2023-05-15",
            temperature=temperature,
            max_tokens=max_tokens
        )

    def get_embedding_model(self) -> Any:
        from langchain_openai import AzureOpenAIEmbeddings
        from app.config import settings
        return AzureOpenAIEmbeddings(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key, # type: ignore
            api_version="2023-05-15"
        )

def get_llm_provider(settings: Any) -> ILLMProvider:
    """Factory function; reads LLM_PROVIDER env var."""
    from app.config import LLMProvider
    if settings.llm_provider == LLMProvider.FAKE:
        return FakeDeterministicProvider()
    elif settings.llm_provider == LLMProvider.OLLAMA:
        return OllamaProvider()
    elif settings.llm_provider == LLMProvider.AZURE_OPENAI:
        return AzureOpenAIProvider()
    return FakeDeterministicProvider()
