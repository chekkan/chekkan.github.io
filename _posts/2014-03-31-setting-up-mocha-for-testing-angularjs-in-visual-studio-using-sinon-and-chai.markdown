---
layout: post
title: Setting up mocha for testing AngularJS in Visual Studio using sinon, and chai
date: '2014-03-31 21:18:00'
tags:
- angularjs
- chai
- html
- javascript
- mocha
- sinon
- testing
---

I decided to start a new asp.net mvc project with web api and use a bit of angularjs functionality. I had heard about mocha testing library which you can use do a tdd style development for my angularjs codes. I saw this pluraral sight course [AngularJS for .NET Developers](http://pluralsight.com/courses/angularjs-dotnet-developers) by _Joe Eames_, and _Jim Copper_; which has a topic on Creating a Test in AngularJS. But, the video shows how to use jasmine testing library instead of mocha which is what I wanted to use.

I searched for mocha in nuget package manager and only found one package called blah blah which downloads and sets up mocha tests in an already existing asp.net mvc project. I wasn’t really impressed by this package as it was creating the files in your mvc project. you do not want your testing code to reside within your production code.

After searching for an hour on the web to get the javascript files for mocha, chai, sinon, and sinon-chai, i managed to find downloadable javascript files for mocha from [here](http://https//github.com/visionmedia/mocha/releases), sinon from [here](http://sinonjs.org/), chai.js file from [here](http://chaijs.com/chai.js), and sinon-chai can be downloaded from [here](https://github.com/domenic/sinon-chai/releases). All the site recommend using `npm` to download the libraries and I agree with them. It is easy to do, and you can also get the latest version each time or target a specific version. But, it requires you to have nodejs and npm installed on your computer. Node.js can be installed on your machine from [here](http://nodejs.org/). Install node package manager (npm) using guidelines from [here](http://howtonode.org/introduction-to-npm). executing this line of code from command prompt should install it for you.

    curl http://npmjs.org/install.sh | sh

I prefer downloading each file manually from the links above. If you want to install it using `npm`, the command to install using node package manager is `npm install --save mocha sinon chai sinon-chai`. This will download the libraries needed into the `node_modules` folder.

<figure class="kg-card kg-image-card"><img src="https://res.cloudinary.com/chekkan/image/upload/v1570362257/angularjsfordotnet_postnpminstall_osa3ag.png" class="kg-image" alt="AngularJsForDotNet_PostNpmInstall" loading="lazy"></figure>

Then you can add the files mocha.js, sinon.js, chai.js, and sinon-chai.js from the node\_modules folder into your test project. Beware that if you want stubs and spy methods, you will have to include the `sinon/libs/stub.js` etc files. you can get the html runner template from `mocha/template.html`. The code is given below.

To add client side test into you solution as a separate project, follow these steps: Open you asp.net mvc project, and create a new project in your solution by selecting an Empty Project Template and name it something like `"{{SolutionName}}.ClientSideTests"`. I like to keep all of my test projects in a folder called `"Tests"`.

<figure class="kg-card kg-image-card"><img src="https://res.cloudinary.com/chekkan/image/upload/v1570362257/angularjsfordotnet_folderstructure_gtipeh.png" class="kg-image" alt="AngularJsForDotNet_FolderStructure" loading="lazy"></figure>

Download each of the files from these locations: [mocha](https://github.com/visionmedia/mocha/releases), [sinon](http://sinonjs.org/), [chai](http://chaijs.com/chai.js), and [sinon-chair](https://github.com/domenic/sinon-chai/releases).

In my asp.net mvc project, I have a file called `app.js` with a `homeCtrl` and a `courseRepository` with the following code

    "use strict";
    
    var app = angular.module("app", []);
    
    app.controller("homeCtrl", [
      "$scope",
      "courseRepository",
      function homeCtrl($scope, courseRepository) {
        $scope.courseTitle = "angularjs";
      }
    ]);
    
    app.factory("courseRepository", function() {
      return {};
    });

Add an html document to your `"{{SolutionName}}.ClientSideTests"` project. I called mine _testrunner.html_ and add the following lines of code.

    <!DOCTYPE html>
    <html>
      <head>
        <title>Mocha</title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="css/mocha.css" />
      </head>
      <body>
        <script src="Scripts/mocha.js"></script>
        <script src="Scripts/chai.js"></script>
        <script src="Scripts/sinon-1.9.0.js"></script>
        <script src="Scripts/sinon-chai.js"></script>
        <script>
          mocha.setup("bdd");
        </script>
    
        <!-- include your files here -->
    
        <script src="../../Src/AngularJsWithDotNet.Web/Scripts/angular.js"></script>
        <script src="../../Src/AngularJsWithDotNet.Web/Scripts/angular-route.js"></script>
        <script src="../../Src/AngularJsWithDotNet.Web/Scripts/angular-mocks.js"></script>
    
        <script src="../../Src/AngularJsWithDotNet.Web/js/app.js"></script>
    
        <script src="tests.js"></script>
    
        <!-- End of your files -->
    
        <div id="mocha"></div>
        <script>
          mocha.run();
        </script>
      </body>
    </html>

Please note that the order you include the scripts matter. Your _testrunner.html_ file needs to know about _angular.js_, _angular-routes.js_, and _angular-mocks.js_ files. I am linking to the angular files from my mvc project here so make sure you have these files in your project. Referencing the same version of angularjs files is recommended as you wont have any issues with using different versions of angularjs libraries.

And finally, create a _tests.js_ file in your `"{{SolutionName}}.ClientSideTests"` project and add a simple test such as the following:

    var expect = chai.expect;
    
    describe("homeCtrl", function() {
      var scope, controller, courseRepositoryMock;
      beforeEach(function() {
        module("app");
        inject(function($rootScope, $controller, courseRepository) {
          scope = $rootScope.$new();
          courseRepositoryMock = sinon.stub(courseRepository);
          controller = $controller("homeCtrl", { $scope: scope });
        });
      });
    
      it("courseTitle should be set to angularjs by default", function() {
        expect(scope.courseTitle).to.equal("angularjs");
      });
    });

Your solution structure should look like the following screenshot

<figure class="kg-card kg-image-card"><img src="https://res.cloudinary.com/chekkan/image/upload/v1570362257/angularjsfordotnet_solutionstructure_ladz4c.png" class="kg-image" alt="AngularJsForDotNet_SolutionStructure" loading="lazy"></figure>

And finally right click _testrunner.html_ file and choose “View in Browser”. and watch your first test pass.

<figure class="kg-card kg-image-card"><img src="https://res.cloudinary.com/chekkan/image/upload/v1570362257/angularjsfordotnet_passingtest_qdbci8.png" class="kg-image" alt="AngularJsForDotNet_PassingTest" loading="lazy"></figure>