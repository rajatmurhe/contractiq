using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.Enums;
using ContractIQ.Contracts.Domain.ValueObjects;

namespace ContractIQ.Contracts.Domain.Entities;

public class RiskReport : Entity
{
    public ContractId ContractId { get; private set; }
    public RiskLevel OverallRisk { get; private set; }
    public IReadOnlyList<RiskFinding> Findings { get; private set; } = new List<RiskFinding>();
    public string AgentVersion { get; private set; } = string.Empty;
    public string ModelId { get; private set; } = string.Empty;
    public string PromptVersion { get; private set; } = string.Empty;

    public static RiskReport Create(ContractId contractId, RiskLevel riskLevel, IEnumerable<RiskFinding> findings, string agentVersion, string modelId, string promptVersion)
    {
        return new RiskReport
        {
            ContractId = contractId,
            OverallRisk = riskLevel,
            Findings = findings.ToList(),
            AgentVersion = agentVersion,
            ModelId = modelId,
            PromptVersion = promptVersion
        };
    }
}
