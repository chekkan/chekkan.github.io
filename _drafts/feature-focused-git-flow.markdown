---
layout: post
title: Feature Focused Git-Flow
---

Please read this wonderful post by [Vincent Driessen](http://nvie.com/about/) about the git-flow. I won't be able to explain it any better than he has already. There is also [a good post](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow) at Atlassian explaining about a few other git workflows as well as git-flow. I found them to be a really good read.

However, I want to discuss a bit about a slight modification to the existing git-flow that you know from Vincent's post above.

Consider this...

Every develop is creating branches whenever they get start working on a particular task of a particular user store. They created the branch from the develop branch. Soon, you will get to this situation.

\*\*\*place holder for a diagram with lots of branches merging to develop\*\*\*

Suppose that this was repository was the api for your front-end site. The overwhelming number of branch merges and short but complete feature changes will surely make your branch unstable. If we were to add what we learned from git-flow into this, it might be a good idea to have the front-end depend on the master of this api repository and not develop branch. But, what happens when we are develop these two side of the site in parallel in the same cycle?

We cannot have an instance where the repository's `develop` branch has incomplete feature changes, and we have to make sure that the feature change that break existing functionality only gets incorporated into the repository when the front-end will not get broken by the change or vice versa.

So, it is clear that the team needs to have some discipline in place so that we create feature branches for changes that consist of more than one story? \_\_\_(is that clear)\_\_\_ and

