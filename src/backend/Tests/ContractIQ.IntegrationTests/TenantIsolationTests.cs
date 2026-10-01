using System.Net.Http.Json;
using System.Net.Http.Headers;
using FluentAssertions;
using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Text;
using System.Text.Json;

namespace ContractIQ.Tests.Integration;

public class TenantIsolationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _tenantAClient;
    private readonly HttpClient _tenantBClient;
    private const string TenantAId = "a0000000-0000-0000-0000-000000000001";
    private const string TenantBId = "b0000000-0000-0000-0000-000000000002";

    public TenantIsolationTests(WebApplicationFactory<Program> factory)
    {
        _tenantAClient = factory.CreateClient();
        _tenantAClient.DefaultRequestHeaders.Add("X-Tenant-Id", TenantAId);

        _tenantBClient = factory.CreateClient();
        _tenantBClient.DefaultRequestHeaders.Add("X-Tenant-Id", TenantBId);
    }

    [Fact]
    public async Task GetContract_OwnedByTenantA_ReturnsNotFoundForTenantB()
    {
        // Arrange
        var payload = new MultipartFormDataContent();
        payload.Add(new StringContent("Secret ACME NDA"), "title");
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes("Confidential"));
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/pdf");
        payload.Add(fileContent, "file", "acme_nda.pdf");

        // Act - Tenant A creates a contract
        var uploadResponse = await _tenantAClient.PostAsync("/api/v1/contracts/upload", payload);
        uploadResponse.EnsureSuccessStatusCode();
        var result = await uploadResponse.Content.ReadFromJsonAsync<JsonElement>();
        var contractId = result.GetProperty("contractId").GetString();

        // Assert - Tenant A can read it
        var readA = await _tenantAClient.GetAsync($"/api/v1/contracts/{contractId}");
        readA.EnsureSuccessStatusCode();

        // Assert - Tenant B CANNOT read it (Should get 404 due to Global Query Filter + RLS)
        var readB = await _tenantBClient.GetAsync($"/api/v1/contracts/{contractId}");
        readB.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AuditLog_ShouldOnlyContainEventsForCurrentTenant()
    {
        // Act - Both tenants fetch audit events
        var eventsA = await _tenantAClient.GetFromJsonAsync<JsonElement>("/api/v1/audit/events?page=1&pageSize=10");
        var eventsB = await _tenantBClient.GetFromJsonAsync<JsonElement>("/api/v1/audit/events?page=1&pageSize=10");

        // Assert - Check that all returned events belong to the calling tenant
        foreach (var ev in eventsA.GetProperty("items").EnumerateArray())
        {
            ev.GetProperty("tenantId").GetString().Should().Be(TenantAId);
        }

        foreach (var ev in eventsB.GetProperty("items").EnumerateArray())
        {
            ev.GetProperty("tenantId").GetString().Should().Be(TenantBId);
        }
    }
}
