---
layout: post
title: Entity Framework Core Elegant Database Migrations on ECS
date: '2020-03-21 21:14:00'
tags:
- entity-framework
- aws
- cdk
- aspnet
- dotnet
- docker
- fargate
- ecs
- continuous-delivery
---

This article is insipired by the blog post [Elegant Database Migrations on ECS](https://engineering.instawork.com/elegant-database-migrations-on-ecs-74f3487da99f) from [Adam Stepinski](https://engineering.instawork.com/@adamstep). The original article guides you through setting up an application thats setup with Django Framework. I am going to presribe a method with the following technologies:

- ASPNET Core 3.1 Web API
- Entity Framework Core 3.1
- AWS CDK for Infrastructure as Code

## Database Migration Health Check

Let’s first tackle the Migration Health check endpoint which I think is a good idea anyway even if you don’t follow the rest of the article.

With the ECS Rollout Deployment strategy, a single task is started at a time by ECS. It is added to the Application Load balancer target group. ECS then waits for the Health Check endpoint to return a health status code for a set number of time before considering the task to be stable. Then continues the process till the desired number of tasks are launched. Removing the previous version of tasks from the target group as new tasks are registered.

With that being said, lets see some code for implementing the said health check.

    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Diagnostics.HealthChecks;
    
    namespace WebApi.HealthChecks
    {
        public class DbPendingMigrationHealthCheck<TContext> : IHealthCheck where TContext : DbContext
        {
            private readonly TContext _dbContext;
    
            public DbPendingMigrationHealthCheck(TContext dbContext)
            {
                _dbContext = dbContext;
            }
    
            public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
                CancellationToken cancellationToken = new CancellationToken())
            {
                IEnumerable<string> pending = await _dbContext.Database
                    .GetPendingMigrationsAsync(cancellationToken);
                string[] migrations = pending as string[] ?? pending.ToArray();
                var isHealthy = !migrations.Any();
    
                return isHealthy
                    ? HealthCheckResult.Healthy("No pending db migrations")
                    : HealthCheckResult.Unhealthy($"{migrations.Length} migrations pending!");
            }
        }
    }

The code should be fairly easy to follow. Read more about aspnet core Health Check endpoint have a look at the [Microsoft’s documentation](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks?view=aspnetcore-3.1).

Register `DbPendingMigrationHealthCheck` class in `Startup`.

    namespace WebApi
    {
    	public class Startup
    	{
    		public Startup(IConfiguration configuration)
    		{
    		    Configuration = configuration;
    		}
    
    		public IConfiguration Configuration { get; }
    		public void ConfigureServices(IServiceCollection services)
    		{
    		    ...
    		    services.AddDbContext<AppContext>();
    		    services.AddHealthChecks()
    		        .AddCheck<DbPendingMigrationHealthCheck<AppContext>>("db-migration-check");
    		    ...
    		}
    		...
    		public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    		{
    		    ...
    		    app.UseEndpoints(endpoints =>
    		        {
    		            endpoints.MapControllers();
    		            endpoints.MapHealthChecks("/");
    		        });
    		}
    	}
    }

With those changes in place, you will see the message “Healthy” or “Unhealthy” response body with `200` status code when calling `GET "/"` endpoint.

* * *

## Database Migration

Here is where I took a different approach to the method mentioned in the original post. Instead of invoking the task as part of the build step, I am going use the ECS Container Dependency in order to run the database migration.

In order to do this, I had to create a new _Dockerfile_ with `dotnet ef` global tool installed. The _Dockerfile_ looks like this:

    FROM mcr.microsoft.com/dotnet/core/sdk:3.1.200
    
    RUN dotnet tool install --global dotnet-ef --version 3.1.2
    ENV PATH="${PATH}:/root/.dotnet/tools"
    
    WORKDIR /build
    
    # Copy solution file
    COPY WebApi.sln ./
    
    # Copy src .csproj files
    COPY src/WebApi/WebApi.csproj ./src/WebApi/
    COPY src/Persistence/Persistence.csproj ./src/Persistence/
    
    # Copy everything and build
    COPY . .
    
    WORKDIR /build/src/WebApi
    
    CMD ["dotnet", "ef", "--project", "../Persistence", "database", "update"]

With CDK project, a container’s dependency can be defined as following in service task definition.

    var imageTag = (string) scope.Node.TryGetContext("imageTag");
    
    var taskDef = new FargateTaskDefinition(this, "example-api", new FargateTaskDefinitionProps
    {
        MemoryLimitMiB = 1024,
        Cpu = 512
    });
    
    # This is the actual api container definition
    ContainerDefinition apiContainerDef = taskDef.AddContainer("api", new ContainerDefinitionOptions
    {
        Environment = new Dictionary<string, string>
        {
            {"ASPNETCORE_LOGGING __CONSOLE__ DISABLECOLORS", "true"},
            {"ConnectionStrings__WebApi", _connectionString}
        },
        Image = ContainerImage.FromEcrRepository(
            Repository.FromRepositoryName(this, "repo", "example/api"), imageTag),
        Essential = true,
        Logging = LogDriver.AwsLogs(new AwsLogDriverProps {StreamPrefix = "api"})
    });
    
    # This is the container defintion with dotnet ef command defined
    ContainerDefinition dbMigrationContainerDef = taskDef.AddContainer("db-migration",
        new ContainerDefinitionOptions
        {
            Environment = new Dictionary<string, string>
            {
            	{"ConnectionStrings__WebApi", _connectionString}
            },
            Image = ContainerImage.FromEcrRepository(
                Repository.FromRepositoryName(this, "migrationRepo", "example/db-migration"), imageTag),
            Essential = false,
    	Logging = LogDriver.AwsLogs(new AwsLogDriverProps {StreamPrefix = "migration"})
        });
    
    # API container depends on db migration container completing succefully
    apiContainerDef.AddContainerDependencies(new ContainerDependency
        {Container = dbMigrationContainerDef, Condition = ContainerDependencyCondition.SUCCESS});
    apiContainerDef.AddPortMappings(new PortMapping {ContainerPort = 80});
    
    return new ApplicationLoadBalancedFargateService(this, "ExampleApiService",
        new ApplicationLoadBalancedFargateServiceProps
        {
            Cluster = _cluster,
            DesiredCount = 1,
            TaskDefinition = taskDef,
            MemoryLimitMiB = 512,
            PublicLoadBalancer = true,
            Protocol = ApplicationProtocol.HTTPS,
            DomainName = "example-api.xxxxxx.com",
            DomainZone = zone
        }
    );

That’s all there is to it. Now you can include the step `cdk deploy` and your database will be migrated before the API task runs. If migration fails for some reason, the deployment will fail.

* * *

## Conclusion

This has been a blog post with a lot of code samples, and I hope that hasn’t put people off from realising the benefits. If you’ve not already done so, please read through the [original article](https://engineering.instawork.com/elegant-database-migrations-on-ecs-74f3487da99f) to get a more detailed explanation on benefits and other options that could’ve been considered.

I am not sure how we would go about rolling back the database changes if the deployment doesn’t go smoothly. If you’ve already got strategy in place so that rollbacks won’t require database rollback. Then that’s great. In this post, I’ve mainly focused on using the `dotnet ef` global tool. However, there maybe much better alternatives out there.

