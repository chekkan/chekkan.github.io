---
layout: post
title: Resilient testing approaches for Blazor components
tags:
- blazor
- testing
- web assembly
- dotnet
date: 2022-12-11 21:54 +0000
---
I've been a fan of [testing library][] when I was working with react about 2
years ago. Since then, I've started working on a project that's using Blazor Web
Assembly for front end. However, haven't come across a similar framework for
testing Blazor component that's similar to [testing library][].

[BUnit][] seems to be default testing framework for anything Blazor related.
You would install it to your test project like any other nuget package
installation.

```
dotnet add package bunit --version 1.12.6
```

The default project template for a Blazor Web Assembly project has a simple
`<SurveyPrompty />` Blazor component which I will use to demonstrate writing
unit test in this blog post. For simplicity, lets pretend the implementation of
`<SurveyPrompty />` component was...

```html
<div class="alert alert-secondary mt-4">
  <span class="oi oi-pencil me-2" aria-hidden="true"></span>
  <strong>@Title</strong>

  <span class="text-nowrap">
    Please take our
    <a target="_blank" class="font-weight-bold link-dark" href="#"
      >brief survey</a
    >
  </span>
  and tell us what you think.
</div>

@code { [Parameter] public string? Title { get; set; } }
```

The `<SurveyPrompty />` component has 1 parameter called `Title` which is then
rendered inside a `<strong>` element, which is nested in `<div />` with class
`alert`. If we were to follow the [BUnit][] documentation on how to write a test for the
`<SurveyPrompty />` component, you'd end up with something similar to...

```csharp
[Theory, InlineData("Foo"), InlineData("Bar"), InlineData("Baz")]
public void Render_Title(string title)
{
    using var ctx = new TestContext();
    var cut = ctx.RenderComponent<SurveyPrompt>(parameters =>
        parameters.Add(p => p.Title, title));

    var actual = cut.Find(".alert strong").TextContent;
    Assert.Equal(title, actual);
}
```

The above test will pass, but there is 1 issue I have with this test. It couples
the styling, and structure of the component to the unit test. If the class
`.alert` or the element `<strong \>` were to be changed or replaced, the tests
would stop working.

The [guiding principles at testing library][] is...

> The more your tests resemble the way your software is used, the more
> confidence they can give you.

---

## Test Id attribute approach

[Testing library][] recommends avoiding using a test specific attribute, but
suggests that its way better than querying based on DOM structure or styling
css class names. It is common to use the attribute `data-testid` as a means to
finding elements. I came across it first when using [Cypress][] - End to end
testing framework. Cypress uses `data-cy`, `data-test` and `data-testid`
attributes. However, [testing library][] seems to have a preference on
`data-testid` attribute. They all serve the same purpose. You'd only use this
attribute strictly for finding elements for testing purposes and nothing else.

In our example, the `<strong>` element surrounding the `@Title` would have an
additional html attribute...

```html
<strong data-testid="survey-prompt-title">@Title</strong>
```

With this approach, we can replace the `Find()` method from previous test to
find by `data-testid` attribute.

```csharp
[Theory, InlineData("Foo"), InlineData("Bar"), InlineData("Baz")]
public void Render_Title_TestId(string title)
{
    using var ctx = new TestContext();
    var cut = ctx.RenderComponent<SurveyPrompt>(parameters =>
        parameters.Add(p => p.Title, title));

    var actual = cut.Find("[data-testid='survey-prompt-title']").TextContent;
    Assert.Equal(title, actual);
}
```

---

## Verify text content approach

This is the recommended approach according to the [testing library][], you'd try
to find if text passed into the `Title` property was rendered by the component.
[BUnit][] doesn't have any direct support for this, but we can still acheive
this result by using the css selector `:contains()`.

```csharp
[Theory, InlineData("Foo"), InlineData("Bar"), InlineData("Baz")]
public void Render_Title(string title)
{
    using var ctx = new TestContext();
    var cut = ctx.RenderComponent<SurveyPrompt>(parameters =>
        parameters.Add(p => p.Title, title));

    cut.Find($":contains({title})");
}
```

`Find()` will throw `Bunit.ElementNotFoundException` exception when it can't
find any elements that matches the `contains()` css selector. Therefore, there
is no need for any more assertion statements. If the line doesn't throw
exception, we've passed out test. We can clean this up further by creating an
extension method called `VerifyTextContaining()` on `IRenderedComponent` type.

```csharp
public static class RenderedComponentExtensions
{
    public static void VerifyTextContains<T>(
        this IRenderedComponent<T> component,
        string text) where T : Microsoft.AspNetCore.Components.IComponent
        => component.Find($":contains({text})");
}
```

```csharp
cut.VerifyTextContaining(title);
```

You can make the error message more useful than
`Bunit.ElementNotFoundException : No elements were found that matches the selector ':contains(Foo)'`
by catching the `ElementNotFoundException` and using [FluentAssertions][]
library or some other means.

---

## Conclusion

Testing the behaviour rather than the structure of the elements within the
component is more resilient. Perhaps we should discourage the use of `Find()`
and `FindAll()` methods all together in our [BUnit][] test projects?

There is an open source project that I came across which has started
implementing [testing library][] APIs for Blazor and is called
[blazor-testing-library][]. Its fairly new and only has 2 stars at the time of
writing this post.

## Further reading

- [Making your UI tests resilient to change][] by Kent C. Dodds

[bunit]: https://bunit.dev/
[cypress]: https://www.cypress.io/
[testing library]: https://testing-library.com/
[fluentassertions]: https://fluentassertions.com/
[blazor-testing-library]: https://github.com/morganlaneap/blazor-testing-library
[making your ui tests resilient to change]: https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change
[guiding principles at testing library]: https://testing-library.com/docs/guiding-principles
