---
title: MassTransit best practices
---

Testing
-------
1. Don't test for messages not published

This is same as saying don't write test scenarios for all things not happening.
Except, in the below example, asserting for message not to be published will 
only return after the default timeout of 6 seconds.

```csharp
[Fact]
public void Message_not_published()
{
    sut.Login(lockedOutUser);
    testHarness.Published.Select<IUserLoggedIn>()
      .Should().BeNull();
}
```

If absolutely necessary, you can pass in an optional `CancellationToken` that 
times out after a set period.

```csharp
[Fact]
public void Message_not_published()
{
    sut.Login(lockedOutUser);
    CancellationTokenSource cts = new CancellationTokenSource();
    cts.CancelAfter(100);
    testHarness.Published.Select<IUserLoggedIn>(cts.Token)
      .Should().BeNull();
}
```

Another **bad practise** is to using extension methods that forces waiting till
timeout.

```csharp
testHarness.Published.Count().Should().Be(2);
```
