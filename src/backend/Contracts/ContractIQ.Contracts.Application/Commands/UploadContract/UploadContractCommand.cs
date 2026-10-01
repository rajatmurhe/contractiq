namespace ContractIQ.Contracts.Application.Commands.UploadContract;

using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

public record UploadContractCommand(
    TenantId TenantId,
    string Title,
    Stream FileContent,
    string OriginalFileName,
    long FileSizeBytes,
    string ContentType,
    string UploadedBy
) : IRequest<UploadContractResult>;

public record UploadContractResult(ContractId ContractId, string StoragePath);
