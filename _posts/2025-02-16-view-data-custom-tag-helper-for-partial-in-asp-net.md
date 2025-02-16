---
layout: post
title: View Data Custom Tag Helper for Partial in ASP.NET
tags:
- aspnet
- dotnet
- csharp
date: 2025-02-16 13:27 +0000
---
I often find the need to set values in `ViewData` when calling partials that are reused across the website. It might not make sense always to make that value part of the Model. 

You can do so currently by doing...

```html
<partial name="_ProfileImage" model="image"
	view-data="@(new ViewDataDictionary(ViewData) { { "returnUrl", Context.Request.Path } })"/>
```

There is already an [issue](https://github.com/dotnet/aspnetcore/issues/9736) reported on aspnetcore repository to make this experience better. 

```html
<partial name="view" view-data-additionalItem="abc" /> 
```

A similar experience is already in use when using `<a>` anchor element and setting `route values`. 

```html
<a asp-controller="User" asp-action="Profile" asp-route-id="123" asp-route-foo="bar">Profile</a>
```

While we are waiting for the issue to be closed, it is possible to extend the Partial Tag Helper ourselves. 

```csharp
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Example.TagHelpers;

[HtmlTargetElement("partial", Attributes = viewDataAttributeNamePrefix + "*")]
public class ViewDataTagHelper : TagHelper
{
    private const string viewDataAttributeNamePrefix = "ex-view-data-";

    /// <inheritdoc />
    public override int Order => -1000;

    [HtmlAttributeNotBound, ViewContext]
    public required ViewContext ViewContext { get; set; }

    public override Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
    {
        var attributes = context.AllAttributes.Where(attr =>
            attr.Name.StartsWith(viewDataAttributeNamePrefix)
        );

        foreach (var attribute in attributes)
        {
            var key = attribute.Name.Substring(viewDataAttributeNamePrefix.Length);
            var value = attribute.Value;

            ViewContext.ViewData[key] = value;
        }

        return Task.CompletedTask;
    }
};
```

Notice the attribute name cannot conflict with `view-data`, and i had to prefix it with `ex-`.

**Usage:**

```html
<partial name ="_Profile" ex-view-data-id="123" ex-view-data-returnUrl="/dashboard" />
```

We can have multiple values set on `ViewData` more succinctly. 

Don't forget to add your tag helper to the `_ViewImports.cshtml` file. 

```html
@addTagHelper *, ExampleAssemblyName
```

