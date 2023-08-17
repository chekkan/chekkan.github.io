---
layout: post
title: Unit testing stripe webhook
tags:
- stripe
- testing
- dotnet
- aspnet
- xunit
date: 2023-08-17 10:04 +0100
---
I am trying to [avoid using any auto mocking library](https://blog.ploeh.dk/2023/08/14/replacing-mock-and-stub-with-a-fake/). And instead trying to rely on [Fakes](http://xunitpatterns.com/Fake%20Object.html) when writing unit tests. There is an alternative approach to [writing unit test using mock](https://medium.com/fromscratch-studio/writing-testable-applications-with-net-and-stripe-a7dd42a26e80) available elsewhere.

When it comes to creating a [stripe webhook](https://stripe.com/docs/billing/subscriptions/webhooks) controller on asp.net MVC, we need to verify that the request is infact coming from stripe using `Stripe-Signature` value.

```csharp
[Route("stripe_webhook")]
public class StripeWebHookController : Controller
{
  [HttpPost]
  public async Task<IActionResult> Index()
  {
    var json = await new StreamReader(Request.Body)
      .ReadToEndAsync();
    try
    {
      var signatureHeader = Request.Headers["Stripe-Signature"];
      var stripeEvent = EventUtility.ConstructEvent(
        json,
        signatureHeader,
        "whsec_xxxx");
      switch (stripeEvent.Type)
      {
        case Events.CustomerSubscriptionTrialWillEnd:
        {
          await new EndOfTrialEmail(emailClient)
          				.SendAsync(stripeEvent);
          break;
        }
        return Ok();
      }
    }
    catch(StripeException e)
    {
      return BadRequest();
    }
  }
}
```

If we were to write a unit test against for this action, it might look like...
```csharp
public class StripeWebHookControllerTests
{
  [Fact]
  public async Task Customer_subscription_trial_will_expire_sends_out_an_email()
  {
    var emailClient = new FakeEmailClient();
    var sut = new StripeWebHookController(emailClient, ...);
    
    var result = await sut.Index();
    
    result.Should().BeOfType<OkResult>();
    var expected = new MailMessage(
    	"noreply@example.org",
    	"user@example.com",
    	"Your trial ends soon",
        null);
    emailClient.Emails.Should().ContainEquivalentOf(
    	expected,
        opt => opt.Including(x => x.From)
        	.Including(x => x.To)
        	.Including(x => x.Subject));
  }
}
```

I am using [FluentAssertions (v6.11.9)](https://www.nuget.org/packages/FluentAssertions/6.11.0) library for my assertion on the email that got send out.

This test is going to fail because, the `Request` is null. And we haven't got a value for `Stripe-Signature` header.

```csharp
var sut = new StripeWebHookController(emailClient, ...)
{
  ControllerContext = new ControllerContext
  {
    HttpContext = new DefaultHttpContext
    {
      Request =
      {
        Headers = { ["Stripe-Signature"] = string.Empty }
      }
    }
  }
}
```

The test will now start failing because the `EventUtility.ConstructEvent` method won't be able to verify the signature. What value do we provide to `Stripe-Signature` header for the verification to pass?

According to [stripe nodejs repository](https://github.com/stripe/stripe-node#testing-webhook-signing), there is a `stripe.webhooks.generateTestHeaderString` method available in the library. There isn't one as far as I can tell with the [Stripe.net](https://github.com/stripe/stripe-dotnet/) library.

Looking into how the validation logic is implemented, Stripe signature is computed using request body, and a unix timestamp value. The header value has the format `t={timestamp},v1={signature}`. `v1` is represent the schema. 

This `ComputeSignature` method is taken straight from [stripe-dotnet](https://github.com/stripe/stripe-dotnet/blob/6e29ccefda732c4a6ae5a9e54fafc1bb84ff7b99/src/Stripe.net/Services/Events/EventUtility.cs#L193) repository.

```csharp
private static string ComputeSignature(
  string secret,
  string timestamp,
  string payload)
{
  var secretBytes = Encoding.UTF8.GetBytes(secret);
  var payloadBytes = Encoding.UTF8.GetBytes($"{timestamp}.{payload}");

  using var cryptographer = new HMACSHA256(secretBytes);
  var hash = cryptographer.ComputeHash(payloadBytes);
  return BitConverter.ToString(hash)
  	.Replace("-", string.Empty).ToLowerInvariant();
}
```

With the `ComputeSignature` method in place, let's modify our test to create `Stripe-Signature` header. 

```csharp
var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
					.ToString();
var signature = ComputeSignature("whsec_xxx", timestamp, "{}");
...
Request.Headers = { ["Stripe-Signature"] = $"t={timestamp},v1={signature}" }
```

The `timestamp` needs to be close to the current time because there is threshold in the [validation logic](https://github.com/stripe/stripe-dotnet/blob/6e29ccefda732c4a6ae5a9e54fafc1bb84ff7b99/src/Stripe.net/Services/Events/EventUtility.cs#L18C9-L18C9). 

The next exception will be on Parsing the request body. It needs to look like a Stripe `Event`. And also match the `ApiVersion` specified with `StripeConfiguration.ApiVersion` or default version included with the library.

```csharp
StripeConfiguration.ApiVersion = "2022-11-15";
var utf8Json = new MemoryStream();
await JsonSerializer.SerializeAsync(utf8Json,
  new
  {
    type = Events.CustomerSubscriptionTrialWillEnd,
    api_version = "2022-11-15",
    data = new
    {
      @object = new
      {
      	@object = "subscription",
      	customer = "cus_123"
      }
    },
    request = new EventRequest()
  });
utf8Json.Position = 0;
...
var signature = ComputeSignature("whsec_xxx", timestamp,
            Encoding.UTF8.GetString(utf8Json.ToArray()));
...
Request.Body = utf8Json
```

And with that, your test should now start passing. 