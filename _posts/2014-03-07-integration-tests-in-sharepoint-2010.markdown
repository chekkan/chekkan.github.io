---
layout: post
title: Integration Tests in SharePoint 2010
date: '2014-03-07 12:02:00'
tags:
- sharepoint
- continuous-integration
- xunit
- integration-test
- azure
---

I understand that a lot of developers out there have given up writing unit tests for SharePoint developments. But, that doesn’t stop you from writing integration tests.

Continuous Integration allows developers to continually produce a working software without any show stoppers that developers have to wait for. If your solution doesn’t have any sort of automated testing, every check in that you do will have to be tested out manually before it is considered to be a working solution. This makes the developers slow. They will have to wait for the testers to complete before they can do any more check ins.

How ever, with integration testing you can have a lot of your requirements written down as tests and your build stage will validate these tests and only let you commit a new change when all the tests passes.

Consider the following piece of Integration Test:

    [Theory]
    [InlineData("http://sp2010/Documents", true)]
    [InlineData("http://sp2010/Invalid", false)]
    [InlineData("http://sp2010/Documents/SubFolder", true)]
    [InlineData("http://sp2010/Documents/Invalid", false)]
    public void IsValidDestinationReturnsExpected(string destinationUrl, bool expected)
    {
        // Arrange
        using (var site = new SPSite("http://sp2010"))
        {
            using (var web = site.RootWeb)
            {
                SPDocumentLibrary library = GetCleanLibrary("Documents", web);
                CreateSubFolder("SubFolder", library);
                const string fileToUpload = @"C:\testFile.txt";
                SPFile file = UploadFile(fileToUpload, library);
                var query = new NameValueCollection
                {
                    {"selectedItems", file.Item.ID.ToString(CultureInfo.InvariantCulture)},
                    {"listId", library.ID.ToString()}
                };
                // Act
                var sut = new MoveSPDocumentPresenter(query, new SPFileItemsMover(web));
                bool actual = sut.IsValidDestination(destinationUrl);
                // Assert
                Assert.Equal(expected, actual);
                // Cleanup
                library.Delete();
                web.Update();
            }
        }
    }

The above integration test checks if the destination URL passed in is pointing to library or a folder. One refactoring that might not be obvious at first, but can’t be ignored is that the URL given in the parametrized tests represents actual SharePoint site collection in my development environment. What if another developer wants to start contributing to my project and wants to run the integration tests? One solution might be that the URL is read from a config file and each developer only need to change the value in there to reflect their environment. But, that still leaves us with an issue that the values provided in attributes must be constant values, hence cannot be a value from config file. Luckily, xUnit provides us with attributes to help with this.

    [Theory, PropertyData("SharePointDestinationValidData")]
    public void IsValidDestinationReturnsExpected(string destinationUrl, bool expected)
    {
        // Arrange
        CreateSubFolder("SubFolder", library);
        const string fileToUpload = @"C:\testFile.txt";
        SPFile file = UploadFile(fileToUpload, library);
        var query = new NameValueCollection
        {
            {"selectedItems", file.Item.ID.ToString(CultureInfo.InvariantCulture)},
            {"listId", library.ID.ToString()}
        };
        // Act
        var sut = new MoveSPDocumentPresenter(query, new SPFileItemsMover(web));
        bool actual = sut.IsValidDestination(destinationUrl);
        // Assert
        Assert.Equal(expected, actual);
    }
    
    public static IEnumerable<object[]> SharePointDestinationValidData
    {
        get
        {
            string spUrl = GetSiteUrl();
            return new[]
            {
                new object[] {spUrl + "Documents", true},
                new object[] {spUrl + "Invalid", false},
                new object[] {spUrl + "Documents/SubFolder", true},
                new object[] {spUrl + "Documents/Invalid", false}
            };
        }
    }
    
    private static string GetSiteUrl()
    {
        string spUrl = ConfigurationManager.AppSettings["SharePointTestSite"];
        if (spUrl == null)
        {
            throw new ArgumentException("Please provide a value for SharePointTestSite in App.config file");
        }
        return spUrl;
    }

In this case, the property `SharePointDestinationValidData` is responsible for providing us with test data, which allows us to read the SharePoint site collection URL from the config file. And we can throw a nice error message if the config file is not configured properly.

There are a lot of refactoring still left in this test to be done. One example would be that it requires an actual file to be present at that location for the file to be uploaded correctly. My next step would be to create the file if it is not already there.

