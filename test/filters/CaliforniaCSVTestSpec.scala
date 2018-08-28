package filters

import org.scalatestplus.play.PlaySpec
import org.scalatestplus.play.guice.GuiceOneServerPerSuite
import parsers.CaliforniaCSV
import play.Play
import play.api.Environment

import scala.concurrent.Await
import scala.concurrent.duration.Duration

class CaliforniaCSVTestSpec extends PlaySpec with GuiceOneServerPerSuite {

  val californiaCSV = app.injector.instanceOf[CaliforniaCSV]
  val env = app.injector.instanceOf[Environment]

  "CaliforniaCSV.parseCSV " must {
    "parse correctly" in {
      var resource = env.resourceAsStream("california.csv").get

      val parameters = Await.result(californiaCSV.toParameter(resource), Duration.Inf)

      resource = env.resourceAsStream("california.csv").get
      val project = Await.result(californiaCSV.toProject(resource), Duration.Inf)

      resource = env.resourceAsStream("california.csv").get
      val annual = Await.result(californiaCSV.toAnnualResults(resource), Duration.Inf)

      resource = env.resourceAsStream("california.csv").get
      val hourly = Await.result(californiaCSV.toHourlylResults(resource), Duration.Inf)

      parameters.size mustBe 5

      project.size mustBe 19

      annual.foreach(println)

      hourly.size mustBe 1764

    }
  }
}
