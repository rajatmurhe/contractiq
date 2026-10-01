using ContractIQ.SharedKernel.Domain;

namespace ContractIQ.SharedKernel.Interfaces;

public interface IOutbox
{
    Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : DomainEvent;
}
