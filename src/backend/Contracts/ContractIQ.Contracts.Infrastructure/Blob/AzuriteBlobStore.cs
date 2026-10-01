using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.Contracts.Infrastructure.Blob;

public class AzuriteBlobStore : IBlobStore
{
    private readonly BlobServiceClient _client;

    public AzuriteBlobStore(string connectionString)
    {
        _client = new BlobServiceClient(connectionString);
    }

    public async Task<Uri> UploadAsync(string containerName, string blobPath, Stream content, string contentType, CancellationToken ct = default)
    {
        var container = _client.GetBlobContainerClient(containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: ct);
        
        var blob = container.GetBlobClient(blobPath);
        await blob.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: ct);
        
        return blob.Uri;
    }

    public async Task<Stream> DownloadAsync(string containerName, string blobPath, CancellationToken ct = default)
    {
        var container = _client.GetBlobContainerClient(containerName);
        var blob = container.GetBlobClient(blobPath);
        var response = await blob.DownloadStreamingAsync(cancellationToken: ct);
        return response.Value.Content;
    }

    public async Task DeleteAsync(string containerName, string blobPath, CancellationToken ct = default)
    {
        var container = _client.GetBlobContainerClient(containerName);
        var blob = container.GetBlobClient(blobPath);
        await blob.DeleteIfExistsAsync(cancellationToken: ct);
    }

    public async Task<bool> ExistsAsync(string containerName, string blobPath, CancellationToken ct = default)
    {
        var container = _client.GetBlobContainerClient(containerName);
        var blob = container.GetBlobClient(blobPath);
        return await blob.ExistsAsync(cancellationToken: ct);
    }
}
