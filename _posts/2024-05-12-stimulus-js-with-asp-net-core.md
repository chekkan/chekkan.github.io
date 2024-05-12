---
layout: post
title: Stimulus JS with ASP.NET Core
date: 2024-05-12 23:31 +0100
---
[Stimulus JS](https://stimulus.hotwired.dev/) is JavaScript front end framework library 
thats popular in th Rails community. Whats different about Stimulus compared to other 
libraries such as React and Vue JS is its simplicity in the features it comes with. 
If all you require is sprinkle of javascript interactivity on your website, Stimulus 
is all you need. Which makes it perfect for use with your mainly full stack web application. 
Another alternative that I've briefly tried is [alpinejs](https://alpinejs.dev/). But, 
I was turned away by cross contaminating my HTML code with JavaScript.I am sure there 
is a way to avoid this. But, I did not get that far. 

I will walk through the method of using [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) as described in the [Using Without a Build System](https://stimulus.hotwired.dev/handbook/installing#using-without-a-build-system) installation documentation. Let’s open up the `_Layout.cshtml` file in your ASP.NET project. 

```html
<head>
  ...
  <script type="importmap">
    {
      "imports": {
        "@@hotwired/stimulus": "https://unpkg.com/@@hotwired/stimulus/dist/stimulus.js"
      }
    }
  </script>
</head>
```

Notice the `@@` infront of `hotwired/stimulus`, thats because `@` is a keyword in 
`cshtml` files, and I am escaping it with the extra `@`. 

Now, we need a JavaScript file that registers Stimulus controllers.

```js
// wwwroot/js/application.js
import {Application} from "@hotwired/stimulus"

window.Stimulus = Application.start()
```

Reference the `application.js` script in `_Layout.cshtml` file.

```html
  <script type="module" src="~/js/application.js" asp-append-version="true"></script>
</body>
```

To keep the sample short, let’s create a controller that shows a confirmation dialog
when user clicks a delete button.

Create a `confirmation_controller.js` file at `wwwroot/js/controllers/` folder. 
```js
import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
	static values = {message: String, default: "Are you sure?"}

	prompt(event) {
        const confirmation = confirm(this.messageValue);
        if (!confirmation) {
            event.preventDefault()
        }
	}
}
```

Make use of import maps to reference the controller. 
```json
{
	"imports": {
	  "@@hotwired/stimulus": "https://unpkg.com/@@hotwired/stimulus/dist/stimulus.js",
	  "controllers/confirmation_controller": "/js/controllers/confirmation_controller.js"
	}
}
```

Register the controller with Stimulus by modifying `application.js` file as:

```js
import {Application} from "@hotwired/stimulus"

import ConfirmationController from "controllers/confirmation_controller"

window.Stimulus = Application.start()

Stimulus.register("confirmation", ConfirmationController)
```

We register an instance of the confirmation controller via `data-controller` attribute 
on an HTML element. And we can execute the `confirmation_controller`’s `prompt` method 
by marking it as a `data-action` attribute on an anchor tag. By default, on an anchor tag,
the default action is a `click` event. So, any time someone clicks on the link, 
`confirmation` controller’s `prompt` method will be invoked. 

```html
@* /Views/Users/Details.cshtml *@

<a asp-controller="Users" asp-action="Delete" asp-route-id="@user.Id"
    data-controller="confirmation" data-action="confirmation#prompt"
    data-confirmation-message-value="@Localizer["Delete this user?"]">
  @Localizer["Delete"]
</a>
```

Stimulus JS is very powerful given how powerfull it is with a low learning curve. 
I haven't seen this framework used heavily on ASP.NET stack and there is no reason
why it should not be considered.