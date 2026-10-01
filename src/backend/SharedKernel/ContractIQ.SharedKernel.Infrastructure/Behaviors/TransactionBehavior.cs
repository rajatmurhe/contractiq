using MediatR;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.SharedKernel.Infrastructure.Behaviors;

public class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    private readonly IUnitOfWork _unitOfWork;

    public TransactionBehavior(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var response = await next();
        if (request is ICommand)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        return response;
    }
}
