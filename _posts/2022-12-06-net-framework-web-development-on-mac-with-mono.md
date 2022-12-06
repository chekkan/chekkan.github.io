---
layout: post
title: ".NET Framework web development on Mac with Mono"
date: 2022-12-06 23:02 +0000
tags:
  - dotnet
  - aspnet
  - mac
  - mono
---

When it comes to developing an ASP.NET MVC application for .NET Framework
on your non Windows dev machine, you can make use of Mono Framework. A word of
caution that Mono is no longer developed since .NET 5 was released. However, if
your application targets .NET Framework version 4.8, you can still develop and
run your application on Mac or Linux using Mono.

### Install Mono

Visit the [mono download page][] and download the latest release for your
Operating System. As the title of the blog post suggests, I am going to be using
a Mac. At the time of writing, the stable version of Mono is 6.12.0.

Complete the installation following the guide on the website. Once its complete,
Mono command line tools will be available at the path
`/Library/Frameworks/Mono.framework/Versions/Current/Commands`. You can
optionally add this path to your `$PATH` environment variable.

### Build script

I'll be making use of `make` and `Makefile` in order to write my build scripts.
But, you can choose your own preferred tool. Create a `Makefile` at the root of
your repository / project structure.

```cmd
touch Makefile
```

Next, we will need a build task in the `Makefile` that will compile the project
/ solution.

```Makefile
msbuild = "/Library/Frameworks/Mono.framework/Versions/Current/Commands/msbuild"
build:
    $(msbuild) ./ExampleWebsite.sln
```

Notice that on the first line, I set a variable for `msbuild` which points to
the `msbuild` commandline tool that was added by the Mono Framework
installation. I then refer to this variable in the build task. If you've saved
the path to Mono installation location in your environment variable, then you
don't need to declare a variable and can invoke `msbuild` command directly from
build task. Which will be a good idea if the `Makefile` and task are going to be
used from a Windows machine as well. And `msbuild` command is also resolved
on that machine.

At this stage, executing the build command `make build` will error with the
message that NuGet packages are missing. So, lets add a new task to restore the
solution.

```Makefile
restore:
    $(msbuild) ./ExampleWebsite.sln /t:restore /p:RestorePackagesConfig=true
build: restore
    $(msbuild) ./ExampleWebsite.sln
```

`/t:restore` indicates to `msbuild` that we want to invoke the `restore`
`msbuild` target. `/p:RestorePackagesConfig=true` is required if the project uses
`packages.config` file for managing dependencies. You can omit this argument if
your `.csproj` file is using the newer SDK style file. You can also see I've
specified that the build task depends on the new `restore` task. Therefore,
calling the build task will first run the `restore` task.

### Running the Website

Mono comes with a command line tool called `xsp4` that can be used to run a web
application. XSP is the Mono ASP.NET Web Server. The process provides a
minimalistic web server which hosts the ASP.NET runtime and can be used to test
and debug web applications that use the `System.Web` facilities in Mono. `xsp4`
is not intended to be used as your production web server. Unless its used as a
means for integrating with a production web server such as Apache.

We will call the new task `run_web`.

```Makefile
xsp4 = "/Library/Frameworks/Mono.framework/Versions/Current/Commands/xsp4"
run_web: build
    $(xsp4) --verbose --applications=/:./ExampleWebsite
```

Again, `run_web` task has a dependency on the `build` task. I am also referring
to `xsp4` tool via a variable that points to the actual location of the tool.
`--verbose` flag prints extra mesages to the output which are useful for
debugging purposes. `--applications` argument allows you to provide a list of
virtual and real directory for all applications we want to manage with this
server. The virtual and real directories are seperated by a colon. In our case,
we only specify 1 application. At the root (`/`) virtual directory that is
mapped to the relative real directory where the website project is located.

I suggest first reading [ASP.NET getting started][] page on mono project website to
learn more about the web server. There are lots of other arguments that you can
pass to the tool. Which are documented on the [xsp4 manpages][].

If you run the new task `make run_web`, there will be a website running on port
`9000` on `localhost` which you can browse to. As the task output suggests, you
can press `Enter` / `Return` key to stop the web server running.

![asp.net mvc running on mac](https://res.cloudinary.com/chekkan/image/upload/v1670366395/Screenshot_2022-12-06_at_22.39.25_hqfik7.png)

### Conclusion

If you have team members using more than one development operating systems, it
will be a good idea to make sure your Continuous Integration pipeline builds for
all the different Operating Systems. Because it will be easy for one of the team
members to introduce a change that breaks the application for others.

Try to move away from .NET Framework as soon as possible into .NET 7 which is
latest at the time of writing as they have cross platform support built in.

[mono download page]: https://www.mono-project.com/download/stable/
[asp.net getting started]: https://www.mono-project.com/docs/web/aspnet/
[xsp4 manpages]: https://manpages.ubuntu.com/manpages/bionic/man1/xsp.1.html
