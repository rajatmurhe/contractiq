namespace ContractIQ.SharedKernel.Domain;

public abstract class AggregateRoot : AuditableEntity
{
    private readonly List<DomainEvent> _domainEvents = new();

    public void AddDomainEvent(DomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public IReadOnlyList<DomainEvent> PopDomainEvents()
    {
        var copy = _domainEvents.ToList();
        _domainEvents.Clear();
        return copy;
    }
}
