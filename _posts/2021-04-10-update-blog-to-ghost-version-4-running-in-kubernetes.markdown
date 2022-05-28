---
layout: post
title: Update blog to ghost version 4 running in Kubernetes
date: '2021-04-10 21:11:25'
permalink: update-blog-to-ghost-version-4-running-in-kubernetes
cover: https://res.cloudinary.com/chekkan/image/upload/q_auto:good/ghostv3-kubernetes-ghostv4--2-.png
tags:
- kubernetes
- ghost-tag
- docker
- container
---

This blog is running on the ghost blogging platform at the time of this
writing. Its current running version 3.42.x and there was a new major version
released recently and its currently on version 4.2.0. There are guides
available on [ghost documentation site][] to help make the upgrade when you
have installed ghost on a server using the ghost-CLI tooling. However, none
exists for ghost running on Kubernetes, or docker containers. `ghost-cli`
update path seemed desirable compared to the clean install option especially
because some database migration might be involved I assumed. Also, I didnt
want to re-configure my site with google analytics etc.
 
Follow the initial steps of backing up all the important content as mentioned
in [ghost documentation site][]. Then come back here...
 
You will have ssh into the docker container in order to copy the content folder
across.

    kubectl cp <namespace>/<pod_name>:/var/lib/ghost/content ghost-migration-to-4.x/content

I didn't have much luck copying the theme folder in content. But, I haven't
made any changes to the theme using the default Casper theme at present. Make
sure run the upgrade check for your theme before progressing any further.
Download your existing theme from the Admin site and upload the zipped file
into the [GScan][] website.

The way I have the blog setup in Kubernetes is by using the base image
[chekkan/ghost-cloudinary][] which builds off the `ghost-alpine` image. I have
already gone ahead and published version `4.2.0` of the docker image.

You will need to ssh into the docker container pod and install `ghost-cli`.

	kubectl exec --stdin --tty -n "<namespace>" "<pod_name>" -- /bin/bash

*ssh into the page thats running ghost container*

	npm install -g ghost-cli@latest

*install ghost-cli npm package*

Make sure your current working directory is where you've installed ghost. For
me, its at `/var/lib/ghost`.

I used environment variables in deployment spec file together with Kubernetes
secrets to configure my database credentials. For some reason, these were not
picked up when I ran `ghost config get database.connection.host` command. So,
I decided to configure them again manually.

	ghost config --db mysql --dbhost &lt;dbhost&gt; --dbuser &lt;dbuser&gt; \
	--dbpass &lt;dbpass&gt; --dbport &lt;dbport&gt; --dbname &lt;dbname&gt;

*Update the ghost config values for database*

Running the above command will update the _config.production.json_ file.
Review the file to make sure its got the expected values.

	su node

*switch user to node*

`ghost-cli` stops you from updating as a `root` user. If you wanted to get
back to being a root user again, `exit`.

Before you can update to version 4, ghost wants you to be in the latest
version of the currently installed ghost version.

	ghost update v3

*updates ghost to the latest version of major version 3*

	ghost update

*updates ghost to the latest version; version 4.2.0 at the time of writing*

Once ghost is updated, go ahead and `kubectl apply` with your deployment spec
file thats updated to the same version of ghost.

[ghost documentation site]: <https://ghost.org/docs/update/>
[GScan]: <https://gscan.ghost.org/>
[chekkan/ghost-cloudinary]: <https://hub.docker.com/r/chekkan/ghost-cloudinary>
