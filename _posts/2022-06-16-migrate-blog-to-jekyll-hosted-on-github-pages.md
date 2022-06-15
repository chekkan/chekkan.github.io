---
layout: post
title: Migrate Blog to Jekyll hosted on GitHub Pages
date: 2022-06-16 00:26 +0100
---
I've had this blog migrated so many times in the past. I had it running in 
Jekyll and GitHub pages when I first started blogging. Then I switched to self
hosting with Ghost blog engine. I switched out of Ghost in favour of Gatsby
while I was doing more ReactJS development. Hosted the blog on Netlify with its
free tier. I then switched back to Ghost and self hosting it on Kubernetes.

I even considered using the Hey World blogging platform for a while. But, that 
was way too simple for me. It has got potentials and I will wait and see if it 
grows into something more that meets my needs in the future. 

And now, I am back to how it all began, running the site using Jekyll and
hosting it back on GitHub pages. 

## Taking a break from Ghost
I was not using the full set of features offered by Ghost. I didn't need mostly
all of them. I don't have subscriber, I don't need to send out emails to
anyone. And I don't plan to use the blog as a revenue stream. 

I enjoyed the default theme, I loved its integration with cloudflare for image 
uploads. I am planning to continue using Cloudflare to serve the images for my
blog after migrating to Jekyll.

Running a kubernetes cluster for my blog and couple of side projects is turned
out to be expensive. I would like to have the oppertunity to turn the 
Kubernetes Cluster off without bringing down my blog.

## Why Jekyll?
I think the main reason for migrating to Jekyll blog engine is because of its
simplicity. I already have tools needed for running jekyll on my workstation. I
am becoming more familiar with the ecosystem nowadays. I like the concept of 
simply serving HTML. That's all I need from a Blog. There is no need for 
server rendering, no need for lots of JavaScript to be executing in my reader's 
Browser.

I like the freedom of writing in Markdown, saving it to GIT and having a bit 
more control over the customizations. I will have to make the site look more 
appealing, some UI improvements, including taking care of my mobile readers.
I am losing some nice functionalities with this migration. There is not alot 
that comes with the minima theme. So, will be taking some time to polish the 
look and feel of the site. 

## Approach
In order to migrate the posts from ghost, I used the [jekyll_ghost_importer][1] 
gem pointing to the `.json` file that I exported from Ghost admin UI.

### URLs
The gem however, did not migrate over the urls correctly for me. I ended up with 
jekyll's default post format `yyyy-mm-dd-title` urls. Therefore, I had to 
manually set the `permalink` front matter attribute. This wasn't so bad as I 
only had around 34 blog posts. 

Also, posts with links to other posts ended up with `__GHOST_URL__` prefix. 
e.g. `[Part 2 - Setting up Kibana Service](__GHOST_URL__/setting-up-elasticsearch-cluster-on-kubernetes-part-2-kibana/)`.
Therefore, make sure to find and replace these ones manually to use `post_url`
liquid tags. 
e.g. `[Part 2 - Setting up Kibana Service]({{ '{%' }} post_url 2018-02-13-setting-up-elasticsearch-cluster-on-kubernetes-part-2-kibana %})`.

### Code blocks
I also had to also add the correct `highlight language` tag for my code blocks 
in existing posts.

```
{% raw %}
{% highlight csharp %}
public int Add(int a, int b) => a + b;
{% endhighlight %}
{% endraw %}
```

I later found out that jekyll can also make use of 
[GitHub Fenced Code Blocks][gh_code] syntax as well.

<pre class='code'>
<code>``` javascript
const add = (a, b) => a + b;
```</code>
</pre>

### Images
[jekyll_ghost_importer][1] also imports the images as html tags, and with fixed 
width and height which looks streched out in Jekyll with minima theme. I had to 
convert each one to the markdown format of `![alt](url) "title"` format.

## Conclusion
Who knows, I might decide to move away from Jekyll in some time in the future. 
But for now, I enjoy the simplicity of just writing and pushing the content to 
the world.

I have blogged quite a lot already on migrating from one platform to another. I 
have to stop migrating the blog and stick to a platform for a substantial 
amount of time. And I am hopefull that this might be it. 


[1]: <https://github.com/eloyesp/jekyll_ghost_importer>
[gh_code]: <https://help.github.com/articles/creating-and-highlighting-code-blocks/>
