---
layout: post
title: Install haskell platform on mac with homebrew
date: '2019-09-05 00:30:00'
tags:
- haskell
- mac
---

> The recommended way to install the components of the mac platform is using [ghcup](https://www.haskell.org/ghcup) to install ghc and cabal-install. [haskell.org](https://www.haskell.org/platform/)

**ghcup** is an installer for the general purpose language **Haskell**

Open a terminal and execute the following command to install `ghcup`

    curl https://get-ghcup.haskell.org -sSf | sh

Press `ENTER` -\> `ENTER` -\> type `YES` and `ENTER` to accept the prompts in terminal.

From [ghcup README](https://gitlab.haskell.org/haskell/ghcup/blob/master/README.md)

    # prepare your environment
    . "$HOME/.ghcup/env"

You should now be able to execute `cabal` and `ghcup` into your terminal.

To make sure that the environment variables are setup on new terminal windows.

    echo '. $HOME/.ghcup/env' >> "$HOME/.bashrc"

or

    echo '. $HOME/.ghcup/env' >> "$HOME/.zshrc"

Follow the instruction on [haskellstack.org](https://docs.haskellstack.org/en/stable/README/) to install stack.

If you have homebrew…

    brew install haskell-stack

