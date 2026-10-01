from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from enum import StrEnum

class LLMProvider(StrEnum):
    FAKE = "fake"
    OLLAMA = "ollama"
    AZURE_OPENAI = "azure-openai"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # LLM
    llm_provider: LLMProvider = LLMProvider.FAKE
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.1:8b"
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"

    # Services
    contracts_api_url: str = "http://contracts-api:8080"
    workflow_api_url: str = "http://workflow-api:8080"
    audit_api_url: str = "http://audit-api:8080"

    # Vector DB
    qdrant_url: str = "http://qdrant:6333"

    # SQL (for LangGraph checkpointer)
    sqlserver_connection_string: str = ""

    # Message bus
    rabbitmq_connection_string: str = "amqp://contractiq:contractiq@rabbitmq:5672/contractiq"

    # Telemetry
    otel_exporter_otlp_endpoint: str = "http://jaeger:4317"
    otel_service_name: str = "contractiq-agent"
    langsmith_api_key: str = ""
    langsmith_project: str = "contractiq-dev"
    langchain_tracing_v2: bool = True

    # Safety
    enable_injection_classifier: bool = True
    enable_pii_redaction: bool = True
    max_file_size_mb: int = 50
    token_budget_per_run: int = 100_000

    # Agent
    agent_version: str = "0.1.0"
    workflow_version: str = "0.1.0"

settings = Settings()
