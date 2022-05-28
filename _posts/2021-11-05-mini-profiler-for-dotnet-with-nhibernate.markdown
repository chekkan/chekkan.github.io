---
layout: post
title: MiniProfiler for dotnet with NHibernate MSSQL Driver
date: '2021-11-05 22:50:08'
permalink: mini-profiler-for-dotnet-with-nhibernate
cover: https://res.cloudinary.com/chekkan/image/upload/q_auto:good/Cover-Image.png
tags:
- dotnet
- aspnet
- performance
- webdev
- nhibernate
---

I first came across [MiniProfiler](https://miniprofiler.com/) when I started a 
new ruby on rails project. It came built in and I found it very useful to see 
the time requests spend and a breakdown of it. I think it was only visible on 
development environment.

I found myself asking the question of whether it was available for ASP.NET web 
application. Turns out, MiniProfiler was written by the folks at stack overflow. 
And their primary technology stack is .NET. The library supports both full .NET 
Framework and the new .NET core. Their existing documentation for 
[ASP.NET integration](https://miniprofiler.com/dotnet/) is easy to follow and 
they even have a [samples](https://github.com/MiniProfiler/dotnet) repository.

One thing that was missing was NuGet package for NHibernate integration. I 
wanted to log SQL queries that were getting executed by NHibernate ORM library. 
I saw that there was couple of NuGet packages published by community members. 
But, they were not actively worked on by the maintainers.

The latest version for MiniProfiler.Mvc5 NuGet package at the time of writing is 
[4.2.22](https://www.nuget.org/packages/MiniProfiler/4.2.22), which I've 
installed to my Website project. Following the instructions for 
[ASP.NET MVC 5](https://miniprofiler.com/dotnet/AspDotNet), my Global.asax.cs 
file looks like below.

{% highlight csharp %}
public class MvcApplication : System.Web.HttpApplication
{
  protected void Application_Start()
  {
    ...
    InitProfilerSettings();
  }

  protected void Application_BeginRequest()
  {
    if (Request.IsLocal) MiniProfiler.StartNew();
  }
  
  protected void Application_EndRequest() => MiniProfiler.Current?.Stop();

  private static void InitProfilerSettings()
  {
    MiniProfiler.Configure(new MiniProfilerOptions
      {
        RouteBasePath = "~/profiler",
      }
      .AddViewProfiling() // Add MVC view profiling
    );
  }
}
{% endhighlight %}

I've went ahead and did the changes suggested for both the \_Layout.cshtml file 
and Web.config file.

![](https://res.cloudinary.com/chekkan/image/upload/q_auto:good/MiniProfiler-AspNetMvc5-HomePage.png)

I've installed FluentNHibernate(3.1.0) and NHibernate(5.3.10) packages to the 
project. I have an MSSQL Server and have a table called employees and will query 
for all employees and render them in my view. I would like to view the SQL that 
NHibernate produced and the time it took in my mini profiler.

{% highlight csharp %}
public class HomeController : Controller
{
  public async Task<ActionResult> Index()
  {
    using (var session = NHibernateHelper.OpenSession())
    {
      var employees = await session.Query<Employee>().ToListAsync();
      return View(employees);
    }
  }
}
{% endhighlight %}

And rendering the list in my index view

{% highlight html %}
<div class="row">
  <ul>
    @foreach (var employee in @Model)
    {
        <li>@employee.Name</li>
    }
  </ul>
</div>
{% endhighlight %}

Shows me MiniProfiler without any SQL information.

![](https://res.cloudinary.com/chekkan/image/upload/q_auto:good/MiniProfiler-without-sql.png)

To report SQL statements to MiniProfiler, we can use one of the 
[SQL wrapper classes](https://miniprofiler.com/dotnet/HowTo/ProfileSql).

{% highlight csharp %}
public class MiniProfiledSqlClientDriver : SqlClientDriver
{
  public override DbCommand CreateCommand()
  {
    var dbCommand = base.CreateCommand();
    if (MiniProfiler.Current != null)
    {
      dbCommand = new ProfiledDbCommand(
                        dbCommand, null, MiniProfiler.Current
                      );
    }
    return dbCommand;
  }
}
{% endhighlight %}

I have opted to use the `ProfiledDbCommand` wrapper as is the approach by 
[MRCollective](https://github.com/MRCollective)/
[MiniProfiler.NHibernate](https://github.com/MRCollective/MiniProfiler.NHibernate) 
repo. Notice that I am inheriting from `SqlClientDriver`.

I have then registered the `MiniProfiledSqlClientDriver` with `FluentNHibernate`.

{% highlight csharp %}
public static class NHibernateHelper
{
  private static ISessionFactory _sessionFactory;

  private static ISessionFactory SessionFactory
  {
    get
    {
      if (_sessionFactory != null) return _sessionFactory;
        _sessionFactory = Fluently.Configure()
          .Database(MsSqlConfiguration
            .MsSql2012.ConnectionString(c =>
              c.FromConnectionStringWithKey("Default"))
            .Driver<MiniProfiledSqlClientDriver>())
            .Mappings(m => m.AutoMappings
              .Add(AutoMap.AssemblyOf<Employee>(new StoreConfiguration())))
            .BuildSessionFactory();
          return _sessionFactory;
    }
  }

  public static ISession OpenSession() => SessionFactory.OpenSession();
}
{% endhighlight %}

With these changes, I've now SQL statements available in MiniProfiler.

![](https://res.cloudinary.com/chekkan/image/upload/q_auto:good/MiniProfiler-with-sql.png)
![](https://res.cloudinary.com/chekkan/image/upload/q_auto:good/MiniProfiler-with-sql-statements.png)

It also works for inserts

![](https://res.cloudinary.com/chekkan/image/upload/q_auto:good/MiniProfiler-with-sql-insert-statements.png)

## Summary

I wasn't expecting the insert to work with the code I've added. When working 
with an older version of NHibernate library, I had to also implement 
[ProfiledSqlClientBatchingBatcherFactory](https://github.com/MRCollective/MiniProfiler.NHibernate/blob/master/MiniProfiler.NHibernate/Infrastructure/ProfiledSqlClientBatchingBatcherFactory.cs), inherit 
`MiniProfiledSqlClientDriver` from `IEmbeddedBatcherFactoryProvider`, and 
implement `IEmbeddedBatcherFactoryProvider.BatcherFactoryClass` as done in 
[MRCollective](https://github.com/MRCollective)/
[MiniProfiler.NHibernate](https://github.com/MRCollective/MiniProfiler.NHibernate)'s 
implementation.

Repo accompanying this blog post can be found at 
[my github repository](https://github.com/chekkan/MiniProfilerNHibernateAspNetMvc5).
