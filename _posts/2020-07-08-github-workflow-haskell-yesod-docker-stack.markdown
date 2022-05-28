---
layout: post
title: GitHub Workflow for Haskell Yesod Docker image with Stack
date: '2020-07-08 22:30:00'
permalink: github-workflow-haskell-yesod-docker-stack
cover: https://res.cloudinary.com/chekkan/image/upload/q_auto:good/yesod-haskell-github--2-.png
tags:
- haskell
- webdev
- functional-programming
- docker
- github
---

In a [previous post][], I went over creating a Dockerfile for Haskell
[Yesod application][]. In this post, I will reuse part of the Dockerfile we
ended up with and modify it so that we can build the docker image with GitHub
Workflows.

### GitHub Workflow And Actions

In order to create a GitHub workflow, in the github repository, we will need a
yaml file at `.github/workflows`. I will name the file `haskell.yml` and the
initial contents will be:

```yaml
name: Haskell CI
    
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
    
  jobs:
    build:
      runs-on: ubuntu-18.04
    
      steps:
      - uses: actions/checkout@v2
```

With just these content, each push or pull-request to `master` branch will
trigger the CI to run. I have also specified `ubuntu-18.04` here as we will
build our application in the CI environment, the build artifacts will then be
packaged up in the docker image. The Dockerfile will also be based on
`ubuntu-18.04`. The first step in the workflow is to checkout the repository.
For this, we will be using the `checkout` action. `@v2` denotes
the version of the particular action.

### Haskell Environment

```yaml
- uses: actions/checkout@v2

- uses: actions/setup-haskell@v1.1
  with:
    enable-stack: true
    ghc-version: '8.8' # Resolves to the latest point release of GHC 8.8
    stack-version: 'latest'
```

[setup-haskell action][] allows you to configure a virtual environment with
haskell `ghc`, optionally `stack` and `cabal`. The above configuration sets up
the appropriate `ghc` and latest `stack`. I have chosen to go with ghc version
`8.8` which is the supported ghc version in my stack resolver `lts-16.0`.

### Cache

Even with the minimal yesod application, the builds take too long to run. For
me, it was _16 - 18 minutes_ to finish a successful build. In his book 
_[Extreme Programming Explained], Kent Beck_ talks about _10 minute_ builds.
The time was taken mostly because with each workflow instantiation, GitHub
spins up a clean virtual environment. And the `stack build` command will have
to rebuild all the binaries from source again. This is not the case in C#
projects where the packages from NuGet are already compiled dlls. The build
step would only involve just compiling your application code.

When developing locally, the builds do not take this long because `stack`
reuses build binaries from previous runs. We’ll have to make use of GitHub’s
Cache action to recreate this behaviour.

```yaml
{% raw %}
- uses: actions/setup-haskell@v1.1
  ...

- name: Cache stack
  uses: actions/cache@v2
  env:
    cache-name: cache-stack
  with:
    path: ~/.stack
    key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/stack.yaml.lock') }}
    restore-keys: |
      ${{ runner.os }}-build-${{ env.cache-name }}-
      ${{ runner.os }}-build-
      ${{ runner.os }}-
{% endraw %}
```

You can read more about what each of the attribute mean and when to use them at
[GitHub documentation][]. You can find an
[example haskell cache action with cabal][] here. And also,
[this travis CI documention][] also was useful. **Do not** include
`.stack-work` folder in your cache. Otherwise, stack will not even build your
source files.

With these changes, I got the build time down to just above _2 minutes_ with a
new commit on the same branch. The cache size came to around `~71 MB`.

### Build, Lint and Test

Use `stack` to build and run the unit tests of the application, the
`--system-ghc` makes sure that the ghc already availble at system path is used
instead of downloading one.

I found a number of articles suggesting to install `hlint` using `apt-get`,
`Cabal` or with `stack`. The version from `apt-get` did not output the same
warnings I was getting locally. Installing with `stack` and `Cabal` required
building the package from source. Which took around 10 mins to finish.

However, the [readme file at hlint repository][] suggests to use the following
script to install and run `hlint`.

```yaml
- name: Build
  run: stack build --system-ghc --test --bench --no-run-tests --no-run-benchmarks
  
- name: Run hlint
  run: curl -sSL https://raw.github.com/ndmitchell/hlint/master/misc/run.sh | sh -s .

- name: Run Tests
  run: stack test --system-ghc
```

### Build Artifact

In this example, the build artifact I want to produce is a docker image. In the
[previous post][] we ended up with a Dockerfile; which I have modified quite
alot.

```Dockerfile
FROM ubuntu:18.04 as app
RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY static ./static
COPY config ./config
COPY dist/bin ./

ENV YESOD_PORT 8080
EXPOSE 8080
CMD ["/opt/app/xxxx"] # replace xxxx with your app binary filename
```

You will notice that the Dockerfile is considerably shorter. Also notice that
the base image is the same as the CI environment. We are also copying the
contents of `./dist/bin` into the container as well.

```yaml
- name: Run Tests
  ...

- name: Copy over binary
  run: |
      mkdir -p ./dist/bin
      mv "$(stack path --local-install-root --system-ghc)/bin" ./dist

- name: Push Docker Image
  uses: docker/build-push-action@v1
  with:
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
    registry: docker.pkg.github.com
    repository: USERNAME/REPOSITORY/xxxx
    tag_with_ref: true
    tag_with_sha: true
```

We are using `$(stack path --local-install-root --system-ghc)/bin` to get the
location of the application binary location. We then move those files into
`./dist/bin` after making sure that location exists. We needed to move it to
some place within git repository root as only those are captured in docker 
context.

Finally, we use the docker [build-push action][] to build and publish the
docker image to a GitHub Packages registry.

### Summary

Normally, when I build a C# project, I include the build step both in the CI
and the Dockerfile because the step itself finishes within a minute or two.
However, I didn’t think about using the same binaries that were created in the
CI pipeline inside the Docker image. The process of reducing the time taken for
the build to run has made me re-evaluate my previous approach. The same binary
that we ran the tests against is now the docker image which will be in all the
different environments. I can’t think of any other optimisations to improve the
build time at this time. If I do in the future, I’ll make sure to update this
post with further updates.

For a much more complicated project setup with Cabal, have a look at
[github/semantic][] repository.

[previous post]: <{% post_url 2020-06-27-haskell-yesod-web-app-in-docker %}>
[Yesod application]: <https://www.yesodweb.com/>
[setup-haskell action]: <https://github.com/actions/setup-haskell>
[Extreme Programming Explained]: <https://www.goodreads.com/book/show/67833.Extreme_Programming_Explained>
[GitHub documentation]: <https://help.github.com/en/actions/configuring-and-managing-workflows/caching-dependencies-to-speed-up-workflows>
[example haskell cache action with cabal]: <https://github.com/actions/cache/blob/master/examples.md#haskell---cabal>
[this travis CI documention]: <https://docs.haskellstack.org/en/stable/travis_ci/#container-infrastructure>
[readme file at hlint repository]: <https://github.com/ndmitchell/hlint#running-with-continuous-integration>
[build-push action]: <https://github.com/marketplace/actions/build-and-push-docker-images>
[github/semantic]: <https://github.com/github/semantic/blob/master/.github/workflows/haskell.yml>

