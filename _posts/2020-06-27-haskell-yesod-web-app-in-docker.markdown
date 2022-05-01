---
layout: post
title: Haskell Yesod Web Application in Docker
date: '2020-06-27 18:38:00'
permalink: haskell-yesod-web-app-in-docker
tags:
- haskell
- webdev
- functional-programming
- docker
- container
---

[Yesod][] is one of the [web frameworks available for Haskell][]. It seems to 
be the easiest one out of the multiple choices available to get started with.

### Prerequisites

1. Docker
2. [Haskell Stack][] version 2.3.1

You can find all yesod stack templates available from the [github repository][].
At the time of writing, the available stack yesod templates are:

1. yesodweb/minimal
2. yesodweb/mongo
3. yesodweb/mysql
4. yesodweb/postgres
5. yesodweb/simple
6. yesodweb/sqlite

We will use the minimal yesod template:

    stack new my-project yesodweb/minimal

It scaffolds the following files…

    .
    | ____.dir-locals.el
    | ____ stack.yaml
    | ____ app
    | | ____ Main.hs
    | ____ my-project.cabal
    | ____ README.md
    | ____.gitignore
    | ____ package.yaml
    | ____ routes
    | ____ src
    | | ____ Application.hs
    | | ____ Home.hs
    | | ____ Add.hs
    | | ____ Foundation.hs

### Dockerfile

This Dockerfile was greatly influenced by the blog post 
[Optimized Docker builds for Haskell Stack][] by [Tim Spence][]. Create a 
Dockerfile at the root of the director with the following content:

```Dockerfile
FROM fpco/stack-build:lts-16.0 as dependencies
RUN mkdir /opt/build
WORKDIR /opt/build

# GHC dynamically links its compilation targets to lib gmp
RUN apt-get update \
  && apt-get download libgmp10
RUN mv libgmp*.deb libgmp.deb

# Docker build should not use cached layer if any of these is modified
COPY stack.yaml package.yaml stack.yaml.lock /opt/build/
RUN stack build --system-ghc --dependencies-only

# ------------------------------------------------------------------------
FROM fpco/stack-build:lts-16.0 as build

# Copy compiled dependencies from previous stage
COPY --from=dependencies /root/.stack /root/.stack
COPY . /opt/build/

WORKDIR /opt/build

RUN stack build --system-ghc

RUN mv "$(stack path --local-install-root --system-ghc)/bin" /opt/build/bin

# -----------------------------------------------------------------------
# Base image for stack build so compiled artifact from previous
# stage should run
FROM ubuntu:18.04 as app
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install lib gmp
COPY --from=dependencies /opt/build/libgmp.deb /tmp
RUN dpkg -i /tmp/libgmp.deb && rm /tmp/libgmp.deb

COPY --from=build /opt/build/bin .
COPY --from=build /opt/build/static ./static
COPY --from=build /opt/build/config ./config
ENV YESOD_PORT 8080
EXPOSE 8080
CMD ["/opt/app/my-project"]
```

The blog post from [Tim Spence][] also mentions to replace the base images with
[haskell docker image][]. However, I was encountered with many issues when I
tried that. Package conflicts for `language-javascript` version was one of
them. After digging into the reason behind it, I figured out that I needed to 
use Stackage package registry instead of Hackage.

> Most Haskell dependencies you use live on the Hackage repository. But Stack 
> adds a further layer with Stackage. A resolver set in Stackage contains many 
> of the most common Haskell libraries out there. But there’s only a single 
> version of each. Stack maintainers have curated all the resolver sets. They’ve
> exhaustively checked that there are no dependency conflicts between the 
> package versions in the set.

The readme at [haskell docker image][] also advises against using stack tool 
inside the Dockerfile.

> Do not use stack commands inside the dockerfile. Instead use cabal to install
> and build the image.

> **Cabal** is a system for building and packaging Haskell libraries and
> programs. It defines a common interface for package authors and distributors 
> to easily build their applications in a portable way. Cabal is part of a 
> larger infrastructure for distributing, organizing, and cataloging Haskell
> libraries and programs

Another problem I faced when trying to use Cabal inside the Dockerfile was that
Cabal kept complaining that it can’t find the modules specified inside the
`*.cabal` file’s `exposed-modules`.

### Summary

I found it very hard to find enough blog articles or up to date documentation
available that shows how to setup a docker image for Yesod or Haskell. Even
though I’ve managed to configure a working Dockerfile, the whole step for
build the docker image takes very long to build. Hopefully, I will find other 
alternatives or optimizations in the future. If I do, I will update this blog
with the details.

[Yesod]: <https://www.yesodweb.com/>
[web frameworks available for Haskell]: <https://wiki.haskell.org/Web/Frameworks>
[Haskell Stack]: <http://haskellstack.org/>
[github repository]: <https://github.com/yesodweb/stack-templates>
[Optimized Docker builds for Haskell Stack]: <https://medium.com/permutive/optimized-docker-builds-for-haskell-76a9808eb10b>
[Tim Spence]: <https://medium.com/@timothywspence>
[haskell docker image]: <https://hub.docker.com/_/haskell>

