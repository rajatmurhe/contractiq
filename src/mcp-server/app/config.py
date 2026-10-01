from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    contracts_api_url: str = "http://contracts-api:8080"
    workflow_api_url: str = "http://workflow-api:8080"
    audit_api_url: str = "http://audit-api:8080"
    integrations_api_url: str = "http://integrations-api:8080"
    keycloak_url: str = "http://keycloak:8080"
    keycloak_realm: str = "contractiq"

settings = Settings()
