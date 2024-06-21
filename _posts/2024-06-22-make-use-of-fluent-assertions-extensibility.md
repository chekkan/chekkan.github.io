---
layout: post
title: Make use of Fluent Assertions extensibility
tags:
  - dotnet
  - testing
date: '2024-06-22 00:44 +0100'
---
I've been writing some [chef](https://www.chef.io/) cookbooks recently. And you often see tests in chef that looks something like

```ruby
expect(chef_run).to(create_template('/opt/xyz.yml')
    .with_cookbook('other_cookbook'))
```

And, when I came back to writing C# again, a [Fluent Assertions](https://fluentassertions.com/) statement seemed familiar.

```csharp
actual.Should().Contain(expected).And.HaveCount(2);
```

I haven't seen the [extensibility points of Fluent Assertions library](https://fluentassertions.com/extensibility/) talked about much. And I am starting to think, this is the real advantage Fluent Assertions library brings compared to the built in assertion methods from the test framework.

For example, doesn't this assertion look pretty? What would be the equivalent without using Fluent Assertions?

```csharp
fakeFileStore.Should().HaveFileAt("/etc/xyx.txt").Which
    .Should().MatchBase64EncodedStringContent(content);
```

When using [FurlClient](https://flurl.dev/) for example, the library comes with an [HttpTest](https://flurl.dev/docs/testable-http/) class that helps with testing.

```csharp
var httpTest = new HttpTest();
httpTest.ForCallsTo("https://google.com")
    .RespondWithJson(new { foo = "bar" });
```

However, the verification or assertion error messages are not very useful if you have a long chain of verifications.

```csharp
httpTest.ShouldHaveCalled("https://google.com")
    .WithVerb(HttpMethod.Post)
    .WithBearerToken("valid_token")
    .WithContentType("application/json")
    .WithRequestBodyJson(new { foo = "bar" });
```

You'll only get a generic error message saying one of those things didn't match. The failure message doesn't tell you which part of the assertion failed.

However, re-writing them using Fluent Assertions custom extensions can provide you with much better failure messages at exactly the point at which the verification fails.

```csharp
httpTest.Should().HaveCalled("https://google.com").Which
    .Should().HaveVerb(HttpMethod.Post).And
    .HaveBearerToken("valid_token").And
    .HaveContentType("application/json").And
    .HaveRequestJsonBody(new { foo = "bar" });
```

You can also verify that the request or response JSON body matches a JSON schema as well.

```csharp
httpTest.Should().HaveCalled("https://google.com").Which
    .Should().MatchRequestSchema("./req-schema.json").And
    .MatchResponseSchema("./res-schema.json");
```

Fluent Assertions library provides you with a few built in extension methods for assertions. However, the real power is when you start creating your own extension methods for the classes in your code base. This can help with readability of the tests, reduce blotted assertions, discover-ability and re-usability of assertion methods.

There are a [number of Fluent Assertions nuget packages](https://www.nuget.org/packages?q=FluentAssertions), but not a lot compared to how powerful of a feature this is.

