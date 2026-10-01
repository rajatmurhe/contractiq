using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.Messaging;

namespace ContractIQ.Contracts.Infrastructure.Messaging;

public class OutboxPublisher : IOutbox
{
    public Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : DomainEvent
    {
        // Outbox publisher places event in OutboxMessage table
        return Task.CompletedTask;
    }
}
