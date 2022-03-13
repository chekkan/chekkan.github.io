---
layout: post
title: Command Line Parser for dotnet Gotchas
---

I am talking of course about the [CommandLineParser](https://github.com/commandlineparser/commandline) Nuget library. Specifically, version 2.8.0 at the time of this blog post.

## Change application version
<figure class="kg-card kg-bookmark-card"><a class="kg-bookmark-container" href="https://github.com/commandlineparser/commandline/wiki/HelpText-Configuration#setting-assemblyinfo-attributes"><div class="kg-bookmark-content">
<div class="kg-bookmark-title">HelpText Configuration · commandlineparser/commandline Wiki</div>
<div class="kg-bookmark-description">The best C# command line parser that brings standardized *nix getopt style, for .NET. Includes F# support - HelpText Configuration · commandlineparser/commandline Wiki</div>
<div class="kg-bookmark-metadata">
<img class="kg-bookmark-icon" src="https://github.githubassets.com/favicons/favicon.svg"><span class="kg-bookmark-author">GitHub</span><span class="kg-bookmark-publisher">commandlineparser</span>
</div>
</div>
<div class="kg-bookmark-thumbnail"><img src="https://opengraph.githubassets.com/e9ae77fd867bcc572c07c0c5cd9fa55742e7e2935bbef8e24862b1e9c08cd501/commandlineparser/commandline"></div></a></figure>
## Verb Commands

In order for the verb command functionality to be working with the fluent `MapResult` or `ParsedResult` methods, you need to have at least two options passed in. Otherwise, the `ParseArguments` will treat it as an argument. This took me a while to understand as with only one `Verb` options class, the first run command will always execute.

    return CommandLine.Parser.Default.ParseArguments<NewCommand, UpdateCommand>(args)
      .MapResult((NewCommand opts) => RunNewAndReturnExitCode(opts),
        (UpdateCommand opts) => RunUpdateAndReturnExitCode(opts),
        errs => 1);

