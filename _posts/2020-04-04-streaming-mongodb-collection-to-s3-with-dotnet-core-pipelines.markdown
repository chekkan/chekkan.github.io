---
layout: post
title: Streaming MongoDB collection to S3 with dotnet core Pipelines
date: '2020-04-04 16:00:00'
permalink: streaming-mongodb-collection-to-s3-with-dotnet-core-pipelines
tags:
- mongodb
- dotnet
- csharp
- aws
- s3
---

In this article, we will be looking into a memory-efficient way of streaming 
data from MongoDB collection into AWS S3 File Storage using the 
[System.IO.Pipelines][] introduced in .Net Standard 2.1. I will be using 
**MongoDB version 3.6** and going to be assuming that the appropriate 
_indexes_ are created for the particular query.

[David Fowler][] has written an [in-depth article][] on how to use the 
particular package. And I recommend you read that first before continuing with 
the rest of the article.

Introduction
------------

This article tries to tackle challenges that arise when the size of the data 
you are trying to export from Mongo DB is in GBs.

> The total volume of data and number of objects you can store in S3 are 
> unlimited. Individual Amazon S3 objects can range in size from a minimum of 
> 0 bytes to a maximum of 5 terabytes. The largest object that can be uploaded 
> in a single PUT is 5 gigabytes. For objects larger than 100 megabytes, 
> customers should consider using the Multipart Upload capability. - 
> [AWS S3 FAQ][]

You don’t want to read all the results of the query upfront, keep it in memory, 
and then upload it to S3 in one go. This approach is going to require you to 
have GBs of memory to be available in the environment your application is 
running. If it is a web server, think what the memory requirement is going to 
be when your application needs to serve multiple export requests simultaneously.

We will have to use the Mongo DB cursor query to traverse through the entire 
collection efficiently. Using `skip` and `limit` is going to be less efficient 
compared to using the cursor. If possible, try to avoid any kind of sorting in 
the query.

We will be using AWS S3’s [multipart upload][] capability to upload the data 
from the query. In particular, it will be the 
[AWS SDK for .NET for Multipart Upload (Low-Level API)][]. AWS S3’s High-Level 
API does provide us with the methods 
`TransferUtility.UploadAsync(filePath, bucketName, keyName)` 
and `TransferUtility.UploadAsync(stream, bucketName, keyName)`. However, it 
requires us to write the Mongo DB query results into a file first before 
uploading it to S3. I wasn’t such a fan of this approach as it introduced an 
intermediate step.

Using the Low-Level API means that we will have to manually handle the AWS S3 
requirement that each _part_ needs to have a minimum size of _5MB_; except for 
the last _part_. We will have to manually initialize, complete, abort, and 
retry uploads in case of failure.

> **Warning:** You also need to take into account the output file format 
> before considering the approach in this article. This approach is **not** 
> going to work if the output file is going to be _JSON_. As valid JSON file 
> cannot be uploaded in chunks. You might want to consider the 
> [JSON lines file format][] instead.

The code example below is going to use the CSV file format as the output. 
Which has its challenges when it comes to representing a nested data 
structures.

* * *

Setup
-----

We will try to export a collection of audits from MongoDB. The audits need to 
be sorted by `createdAt` in descending order. We require a class that 
initiates the orchestration of reading and writing of the data. Let’s say an 
`ExportCollectionService` class. We need the method `Export` to return a `Uri` 
which will be the location of uploaded the file.

```csharp
using MongoDB.Driver;
using System.IO.Pipelines;
...

namespace Example
{
    public class ExportCollectionService
    {
        private readonly IBytesReceiver<Audit>;
        private readonly IAuditsPipelineReader;
        private readonly IAuditsPipelineWriter;
        ...

        public ExportCollectionService(MongoClient client)
        {
            _reader = new MongoDbAuditsReader(client);
            _writer = new S3FileStorage();
            _bytesReceiver = new AuditCsvBytesReceiver();
            _filterBuilder = Builders<Audit>.Filter;
            _sortBuilder = Builders<Audit>.Sort;
        }

        public async Task<Uri> Export(Request req, CancellationToken ct)
        {
          string fileName = _bytesReceiver.FileName(req);
          FilterDefinition<Audit> filter = _filterBuilder.Empty;
          SortDefinition<Audit> sort = _sortBuilder.Descending(
            a => a.CreatedAt
          );
    
          var pipe = new Pipe();
          Task reading = _reader.Read(
            filter, sort, pipe.Writer, _bytesReceiver, ct
          );
          Task<Uri> writing = _writer.Write(fileName, pipe.Reader, ct);
    
          await Task.WhenAll(reading, writing);
          return writing.Result;
        }
    }
}
```

The class `AuditCsvBytesReceiver` implements `IBytesReceiver<Audit>` with the 
help of [CsvHelper][].

```csharp
namespace Example
{
  public class AuditCsvBytesReceiver : IBytesReceiver<Audit>
  {
    // Start will be called before any data is called
    public int Start(Memory<byte> buffer) =>
      CopyContentTo(buffer, csv =>
      {
        csv.WriteHeader<Audit>();
        csv.NextRecord();
      });

    // Will be called for each audit entry
    public int CopyTo(Memory<byte> buffer, Audit audit) =>
      CopyContentTo(buffer, csv =>
      {
        csv.WriteRecord(audit);
        csv.NextRecord();
      });

    private static int CopyContentTo(
      Memory<byte> buffer, Action<CsvWriter> action
    )
    {
      using var stream = new MemoryStream();
      using var textWriter = new StreamWriter(stream);
      using var csv = new CsvWriter(textWriter, CultureInfo.InvariantCulture);
      action(csv);
      textWriter.Flush();
      byte[] bytes = stream.ToArray();
      bytes.CopyTo(buffer);
      return bytes.Length;
    }
  }
}
```

The responsibility of the `AuditCsvBytesReceiver` is covert an audit/header 
into bytes and copy it into the memory buffer.

* * *

Reading into the Pipeline
-------------------------

The class `MongoDbAuditsPipelineReader` implements `IAuditsPipelineReader`.

```csharp
namespace Example
{
  public class MongoDbAuditsPipelineReader : IAuditsPipelineReader
  {
    ...
    public MongoDbAuditsPipelineReader(MongoClient client)
    {
      _client = client;
      _minSizeInKb = (int) (5 * Math.Pow(2, 10)); // 5MB
    }

    public async Task Read(
      FilterDefinition<Audit> filter,
      SortDefinition<Audit> sort,
      PipeWriter writer,
      IBytesReceiver<Audit> receiver,
      CancellationToken ct)
    {
      // sizeHint 1 == 1KB
      var bytes = receiver.Start(writer.GetMemory(sizeHint: 1));
      writer.Advance(bytes);

      var options = new FindOptions<Audit>
      {
          BatchSize = BatchSize,
          Sort = sort
      };
      using IAsyncCursor<Audit> cursor = await _client.Audits.FindAsync(
        filter, options, ct
      );
      while (await cursor.MoveNextAsync(ct))
      {
        foreach (Audit audit in cursor.Current)
        {
          Memory<byte> buffer = writer.GetMemory(_minSizeInKb);
          bytes = receiver.CopyTo(buffer, audit);
          writer.Advance(bytes);
        }

        // Make the data available to the PipeReader
        FlushResult flush = await writer.FlushAsync(ct);
        if (flush.IsCompleted) break;
      }

      writer.Complete();
    }
  }
}
```

Writing to S3 from pipeline
---------------------------

Class `S3FileStorage` implements `IAuditsPipelineWriter`.

```csharp
namespace Example
{
  public class S3FileStorage
  {
    ...
    public S3FileStorage(IAmazonS3 s3Client)
    {
      _s3Client = s3Client;
      _bucketName = "example-bucket";
    }

    public async Task<Uri> Write(
      string fileName, PipeReader reader, CancellationToken ct
    )
    {
      // Create list to store upload part responses.
      var uploadResponses = new List<UploadPartResponse>();

      InitiateMultipartUploadResponse initRes =
        await _s3Client.InitiateMultipartUploadAsync(
          _bucketName, fileName, ct
        );

      try
      {
        ...
      }
      catch (Exception exception)
      {
        // Abort the upload.
        var abortMpuRequest = new AbortMultipartUploadRequest
        {
          BucketName = initRes.BucketName,
          Key = objectKey,
          UploadId = initRes.UploadId
        };
        await _s3Client.AbortMultipartUploadAsync(abortMpuRequest, ct);
        throw;
      }
    }
  }
}
```

Notice that we are aborting the multi-part upload in case of exception. If you 
don’t handle failure, you will still be charged for the upload even though the 
successful parts cannot be retrieved again.

Inside the `try` code block.

```csharp
var partNumber = 1;
while (true)
{
  ReadResult result = await reader.ReadAsync(ct);
  ReadOnlySequence<byte> buffer = result.Buffer;

  if (result.IsCompleted && buffer.IsEmpty) break;

  // only upload part if the buffer contains more than 5MB data
  if (buffer.Length > (int) (5 * Math.Pow(2, 20)))
  {
    uploadResponses.Add(
      await UploadPart(
        partNumber++, buffer, initRes, false, ct
      )
    );
    reader.AdvanceTo(consumed: buffer.End);
  }
  else if (result.IsCompleted)
  {
    uploadResponses.Add(
      await UploadPart(partNumber++, buffer, initRes, true, ct)
    );
    reader.AdvanceTo(consumed: buffer.End);
  }
  else
    reader.AdvanceTo(buffer.Start, buffer.End);
}

// Setup to complete the upload.
var completeRequest = new CompleteMultipartUploadRequest
{
  BucketName = initRes.BucketName,
  Key = fileName,
  UploadId = initRes.UploadId
};
completeRequest.AddPartETags(uploadResponses);

// Complete the upload.
await _s3Client.CompleteMultipartUploadAsync(completeRequest, ct);

DateTime expiration = DateTime.UtcNow.Add(TimeSpan.Parse("04:00:00"));

var additionalProps = new Dictionary<string, object>();
var location = _s3Client.GeneratePreSignedURL(
  initRes.BucketName, objectKey, expiration, additionalProps
);

return new Uri(location);
```

The `while` loop will only exit if the `result.Completed` is true and 
`reader.ReadAsync` returns empty `buffer`. Result will be completed when the 
`PipeWriter.Complete()` is called from `MongoDbAuditsPipelineReader`. And at 
that point, we will upload the last part to S3. Notice that we need to 
increment the part number with each part’s upload. We will return a signed URL 
to the uploaded file which is valid for **4 hours**.

And finally `UploadPart` is a `private` method with the following 
implementation.

```csharp
private async Task<UploadPartResponse> UploadPart(
  int part,
  ReadOnlySequence<byte> buffer,
  InitiateMultipartUploadResponse initRes,
  bool isLastPart,
  CancellationToken ct = default
)
{
  // MemoryStream to be passed into S3 Upload Part request
  await using var ms = new MemoryStream();
  await using var sw = new BinaryWriter(ms);
  foreach (ReadOnlyMemory<byte> segment in buffer)
  {
    var leased = false;
    if (!MemoryMarshal.TryGetArray(
      segment, out ArraySegment<byte> arraySegment)
    )
    {
      byte[] temporary = ArrayPool<byte>.Shared.Rent(segment.Length);
      segment.CopyTo(temporary);
      arraySegment = new ArraySegment<byte>(
        temporary, offset: 0, count: segment.Length
      );
      leased = true;
    }

    sw.Write(
      arraySegment.Array, arraySegment.Offset, arraySegment.Count
    );
    if (leased) ArrayPool<byte>.Shared.Return(arraySegment.Array);
  }

  sw.Flush();
  ms.Position = 0;

  var uploadRequest = new UploadPartRequest
  {
    BucketName = initRes.BucketName,
    Key = initRes.Key,
    InputStream = ms,
    UploadId = initRes.UploadId,
    PartNumber = part,
    IsLastPart = isLastPart
  };

  // Upload a part and return to be added to our list.
  return await _s3Client.UploadPartAsync(uploadRequest, ct);
}
```

Conclusion
----------

This was a long post compared to my usual articles. I couldn’t find an 
approach of creating a stream from the Memory buffer. Therefore, the 
UploadPart method has to create a `MemoryStream` on the fly with data from the 
buffer. This means that each export collection request is going to take 5MB + 
5MB of memory size.

If you are already on .NET Standard 3.1, you might also be interested in 
taking a look at [Async Enumerables][].

[System.IO.Pipelines]: <https://www.nuget.org/packages/System.IO.Pipelines/>
[David Fowler]: <https://twitter.com/davidfowl>
[in-depth article]: <https://devblogs.microsoft.com/dotnet/system-io-pipelines-high-performance-io-in-net/>
[AWS S3 FAQ]: <https://aws.amazon.com/s3/faqs/>
[multipart upload]: <https://docs.aws.amazon.com/AmazonS3/latest/dev/uploadobjusingmpu.html>
[AWS SDK for .NET for Multipart Upload (Low-Level API)]: <https://docs.aws.amazon.com/AmazonS3/latest/dev/usingLLmpuDotNet.html>
[JSON lines file format]: <http://jsonlines.org/examples/>
[CsvHelper]: <https://joshclose.github.io/CsvHelper/>
[Async Enumerables]: <https://docs.microsoft.com/en-us/archive/msdn-magazine/2019/november/csharp-iterating-with-async-enumerables-in-csharp-8>
