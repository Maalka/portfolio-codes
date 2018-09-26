# The Portfolio Codes tool is used to understand typical energy end-use breakdowns in the most common building types in municipal buildings across the country. 

## Intro

The Portfolio Codes tool is used to understand typical energy end-use breakdowns in the most common building types in municipal buildings across the country. By selecting a climate zone and adding a list of buildings (manually or through CSV upload), users can experiment to understand the potential impacts of investing in broad energy saving building upgrades across the portfolio. Four upgrade scenarios, each increasing in terms of cost and comprehensiveness, provide insights into how individual buildings and the whole portfolio will be impacted.

## Collaborating Orgnanizations

The tool is the result of a collaboration between Maalka, Integral Group, New Buildings Institute, Eco Edge, and NEEA under the Department of Energy Municipal Portfolio Codes Program.

Maalka: Built the open-source tool
Integral Group: Provided the model end-use data driving the results
New Buildings Institute: Provided design guidance and city data analysis
Eco Edge: Interacted with cities to get the data for calibrating the models
NEEA: Provided funding support and initial city engagement

## Code Organization

The JavaScript modules are organized as follows:

    |- app
    |-- assets
    |--- javascripts    <- contains all the JavaScript/CoffeeScript modules
    |---- app.js        <- app module, wires everything together
    |---- main.js       <- tells RequireJS how to load modules and bootstraps the app
    |---- common/       <- a module, in this case
    |----- main.js      <- main file of the module, loads all sub-files in this folder
    |----- filters.js   <- common's filters
    |----- directives/  <- common's directives
    |----- services/    <- common's services
    |---- ...


## Trying It Out

### Install SBT
 [http://www.scala-sbt.org/release/docs/Setup.html](http://www.scala-sbt.org/release/docs/Setup.html)
 
### Dev Mode

* Load dependencies via `sbt update`
* Run via `sbt ~run`
* Go to [localhost:9000](http://localhost:9000)

This uses the normal JavaScript files and loads libraries from the downloaded WebJars.

