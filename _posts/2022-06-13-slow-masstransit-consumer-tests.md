---
layout: post
title: Slow MassTransit Consumer tests
tags:
  - dotnet
  - testing
date: 2022-06-13 00:54 +0100
---

[MassTransit][] is an open source library that is an abstraction over some of
the popular messaging/bus technologies. I have used it for interacting with
RabbitMQ bus and have found the experience very pleasant.

There is a pitfall that most developers fall into (myself including) when
writing a test for MassTransit _consumer_. In the below example test, asserting
for message not to be published will only return to the caller after the
default timeout of **6 seconds** has passed.

```csharp
[Fact]
public void Message_not_published()
{
    sut.Login(lockedOutUser);
    testHarness.Published.Select<IUserLoggedIn>()
      .Should().BeEmpty();
}
```

General advice 🫡 is to not write tests that asserts something didn't happen.
Rethink how you can rewrite the test when you reach for this.

If absolutely necessary, you can pass in an optional `CancellationToken` to
the `Select` method that times out after a set period.

```csharp
[Fact]
public void Message_not_published()
{
    sut.Login(lockedOutUser);
    using CancellationTokenSource cts = new ();
    cts.CancelAfter(100);
    testHarness.Published.Select<IUserLoggedIn>(cts.Token)
      .Should().BeEmpty();
}
```

You can override the default timeout value by setting `TestInactivityTimeout`
property on the `TestHarness`.

```csharp
/// <summary>
/// Timeout specifying the elapsed time with no bus activity after which the
/// test could be completed
/// </summary>
public TimeSpan TestInactivityTimeout { get; set; }
```

Another permutation of the above assertion is _counting_ the number of messages
published. This will also wait till the timeout period. However, `Count`
doesn't have an _overload_ that takes in a `CancellationToken`.

```csharp
testHarness.Published.Count().Should().Be(2);
```

---

- The latest version of [MassTransit][] library at the time of writing was
  [8.0.3][].

[masstransit]: https://github.com/MassTransit/MassTransit
[8.0.3]: https://www.nuget.org/packages/MassTransit/8.0.3
