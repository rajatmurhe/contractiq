namespace ContractIQ.Contracts.Domain.ValueObjects;

public readonly record struct SourceSpan(int Page, int StartChar, int EndChar, string? SectionId = null)
{
    public bool Contains(int charOffset) => charOffset >= StartChar && charOffset <= EndChar;
}
