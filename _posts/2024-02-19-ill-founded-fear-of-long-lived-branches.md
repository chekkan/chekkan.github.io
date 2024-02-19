---
layout: post
title: Ill-founded fear of long lived branches
tags:
- git
date: 2024-02-19 17:37 +0530
---
Most people seems to have a fear of long lived branches and recently this cost our team almost a week of release freeze as we had to roll back changes in production. 

In our current project, we follow [GIT rebasing strategy](https://git-scm.com/docs/git-rebase). Our fear was that having a branch live long will mean greater difficulty when it comes time to completing a pull request. Especially if the feature branch has substantial changes - 60 to around 100 file changes rather than under 50.

When it came time to decide whether a moderately risky change to a high impact area should wait for the end of month rush time to pass before releasing - we opted for releasing it as soon as possible. So that we won't have to keep rebasing that branch any longer.

If we were doing [merges](https://git-scm.com/docs/git-merge) instead of rebasing, the situation wouldn't be any different. Instead of rebasing when new changes were added to main line branch, we would instead be merging. Nothing else changes.

There is problem leaving a branch for a long time without attending to it. However, is that something to be concerned with? Yes. The changes that were made to the feature branch might have moved or changed unrecognisably by the time you merge the feature branch to main line branch. Therefore, both rebasing and merge based strategy is against the idea of long lived feature branches.

If you have the option to choose, does that mean you should always prefer [trunk based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) - where you make changes directly to the main-line branch? The problem with trunk based development is that you are [trading off communicating the design of the code](https://world.hey.com/dhh/the-advantages-of-large-long-running-pull-requests-c33d913c) with the rest of the team until all the tiny commits finally make it into main-line branch. I've found the team following trunk based development also don't tend to put much effort into code reviewing with pull requests. If you are a very small team, or your team mainly consists of a handful of very senior developers, perhaps trunk based development is what works best for you.

I want our team of 10 - 12 developers to still review the risks and feel like we have control over when a substantial feature gets merged for release. For that, I think long lived branches that are kept up-to date frequently is the preferred approach. We have cultivated a lower tolerance for leaving branches alone for a long period. We can't have the [mental psychic weight](https://www.hanselman.com/blog/psychic-weight-dealing-with-the-things-that-press-on-your-mind) forcing us to feel bad about not integrating back into the main line branch. Because, by having long lived branches, we will be conscientiously making a  preference towards the benefits it brings us. 