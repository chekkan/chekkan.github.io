---
layout: post
title: Faking .NET Framework ConfigurationSection for Unit Tests
date: '2021-01-30 21:44:19'
permalink: faking-dotnet-framework-configuration-section-for-unit-tests
tags:
- testing
- xunit
- dotnet
- aspnet
---

Many are now familiar with using typed configuration that's available in .net
core and .net 5 with the help from [Options pattern][]. However, if you are
working on a projects targeting .NET Framework, you will know
`ConfigurationSection` from `System.Configuration` assembly.

[ConfigurationSection][] allows you to group related configurations together in
xml. Lets take an example of providing some simple configuring settings to a
retry client.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <configSections>
    <section name="retrySettings" type="ConfigSectionTest.RetrySettings, ConfigSectionTest" />
  </configSections>
  <retrySettings count="3" delay="00:00:30" failureThreshold="0.5" />
</configuration>
```

Notice the `configSections.section` node where we are naming the config section
and also pointing to the type where its implemented. `retrySettings` xml node
has various attributes and values assigned for each.

The `RetrySettings` class is implemented as...

```csharp
public class RetrySettings : ConfigurationSection
{
  [ConfigurationProperty("count")]
  public int RetryCount => (int)this["count"];
  
  [ConfigurationProperty("delay", IsRequired = true)]
  public TimeSpan RetryDelay => (TimeSpan)this["delay"];
    
  [ConfigurationProperty("failureThreshold")]
  public decimal FailureThreshold => (decimal)this["failureThreshold"];
}
```

With expression bodied property syntax, the class is fairly small. I've
specified `RetryDelay` to be required using the `ConfigurationProperty`
attribute.

In order to use the configuration section `RetrySettings`, you'd do so by
calling `ConfigurationManager`.

```csharp
ConfigurationManager.GetSection("retrySettings") as RetrySettings;
```

Even though you can create an instance of `RetrySettings`, it is not possible
set the values of the properties without modifying the class (providing a
setter). You will be able to mock the class by introducing an interface or
using an actual appsettings.config file.

However, it maybe easier to create a fake retry settings config section instead
of mocking. In order to do this, you can inherit the `ConfigurationSection`
class which gives you access to the `DeserializeElement` method. This method
takes in an xml string which is your section node. The second argument
indicates whether to serialize only the collection key property.

```csharp
class FakeRetrySettings : RetrySettings
{
  public void PopulateConfig(string xmlString)
  {
    using (XmlReader reader = new XmlTextReader(new StringReader(xmlString)))
    {
      reader.MoveToContent();
      DeserializeElement(reader, serializeCollectionKey: false);
    }
  }
}
```

You can now configure the retry settings as needed to orchestrate your system
under test.

```csharp
var retrySettings = new FakeRetrySettings();
const string xmlString = "<retrySettings count=\"3\" delay=\"00:05:00\" />";
retrySettings.PopulateConfig(xmlString);
```

You can make it much more easy to work with the `RetrySettings` class in test
project by having a builder class.

```csharp
class RetrySettingsBuilder
{
  private readonly Dictionary<string, string> properties = new Dictionary<string, string>
  {
    { "count", "3" },
    { "delay", "00:30:00" },
    { "failureThreshold", "0.5" }
  };
           
  public RetrySettingsBuilder WithProperty(string key, string url)
  {
    if (!properties.ContainsKey(key))
      throw new ArgumentException(nameof(key));
    
    properties[key] = url;
    
    return this;
  }
            
  public RetrySettings Build()
  {
    var xmlString = "<retrySettings ";
    var pairs = properties.Select(pair => $"{pair.Key}=\"{pair.Value}\"");
    xmlString += string.Join(" ", pairs) + " />";
    
    var settings = new FakeRetrySettings();
    settings.PopulateConfig(xmlString);
    return settings;
  }
}
```

Builder has some default values already configured. Therefore, if you wanted
the test to work and you don't worry about the values, you can create a new
instance of the configuration section by calling
`new RetrySettingsBuilder().Build();`. You can override the default value by 
calling `WithProperty` method e.g. 
`new RetrySettingsBuilder().WithProperty("count", "2").Build();`.

[Options pattern]: <https://docs.microsoft.com/en-us/dotnet/core/extensions/options>
[ConfigurationSection]: <https://docs.microsoft.com/en-us/dotnet/api/system.configuration.configurationsection?view=netframework-4.8>
