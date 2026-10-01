namespace ContractIQ.SharedKernel.Interfaces;

public interface IBlobStore
{
    Task<Uri> UploadAsync(string containerName, string blobPath, Stream content, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> DownloadAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task DeleteAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
}
