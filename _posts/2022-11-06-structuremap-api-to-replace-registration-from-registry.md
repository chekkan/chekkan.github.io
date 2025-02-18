---
layout: post
title: StructureMap API to replace registration from registry
tags:
  - dotnet
  - testing
  - dependency injection
date: 2022-11-06 22:30 +0000
---

[StructureMap](https://structuremap.github.io/) allows you to replace an already registered type mapping by
clearing all previous registrations for the type and adding new one.

The [example in the documentation][clear_or_replace] clears all previous
registration for the type within a registry. What if you want to replace the
registration from the `Container` after mapping a type through a `Registry`?

One use case for this capability that I ran into recently was while writing a
test case. I wanted to make use of the StructureMap's `Registry`, but replace
one of the type registration with an _in-memory implementation_. Assumptions
made following the example in the documentation however did not produce the
desired outcome.

Suppose you had the following classes and Registry.

```csharp
public class InMemoryWidget : IWidget { }
public class Widget : IWidget { }

public class WidgetRegistry : Registry
{
    public WidgetRegistry()
    {
        For<IWidget>().Use<Widget>();
    }
}
```

_Notice the difference in the registry compared to the
[example from StructureMap documentation][clear_or_replace]_.

Now, to replace the `IWidget` registration to use `InMemoryWidget` in the test,
you might assume the following code to do the job.

```csharp
var container = new Container(cfg =>
{
    cfg.AddRegistry<WidgetRegistry>();
    cfg.For<IWidget>().ClearAll().Use<InMemoryWidget>();
});
```

This **doesn't work** as expected. If we printed out what the container
contains using `WhatDoIHave()`, you will still see 2 registrations.

```csharp
TestContext.Out.WriteLine(container.WhatDoIHave(pluginType: typeof(IWidget)));
```

Outputs...

```
================================================================================
PluginType     Namespace   Lifecycle     Description                 Name
--------------------------------------------------------------------------------
IWidget        Example     Transient   Example.Widget               (Default)
                           Transient   Example.InMemoryWidget
================================================================================
```

Notice how the first one (`Widget`) is the default. Because, it was added first.
The one mapped after clearing all previous registration for `IWidget` from our
test is appended to the list of registrations.

The reason for this I gathered is, because the previous registration was done
via a `Registry`. And clearing registrations for all types of `IWidget` ignores
the ones added via `Registry`. The previous approach will only clear registrations
applied directly to the `Container`.

In order to clear the registration from the registry in this situation...

```csharp
var container = new Container(cfg =>
{
  var registry = new WidgetRegistry();
  registry.For<IWidget>().ClearAll().Use<InMemoryWidget>();
  cfg.AddRegistry(registry);
});
```

You clear the registration from the instance of the registry and pass the
instance to the container configuration's `AddRegistry()` method. We make use of
the `AddRegistry` overload that accepts an object instead of the type.

---

- At time of writing, I am using [StructureMap][] version [4.7.1][sm_ver].

[structuremap]: https://structuremap.github.io/
[clear_or_replace]: https://structuremap.github.io/registration/clear-or-replace/
[sm_ver]: https://www.nuget.org/packages/StructureMap/4.7.1
