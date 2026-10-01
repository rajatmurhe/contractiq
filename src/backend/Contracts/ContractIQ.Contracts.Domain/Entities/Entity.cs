namespace ContractIQ.Contracts.Domain.Entities;
public abstract class Entity { public Guid Id { get; protected set; } = Guid.NewGuid(); }
