package controllers

/**
  * Created by rimukas on 12/19/16.
  */

import java.io._
import java.nio.file.Files
import java.util.zip.{ZipEntry, ZipOutputStream}

import akka.actor.ActorSystem
import scala.io.Source
import akka.stream.{ActorMaterializer, _}
import akka.util.Timeout
import com.github.tototoshi.csv.{CSVReader, CSVWriter, DefaultCSVFormat, QUOTE_NONE, Quoting}
import com.google.inject.Inject
import parsers.CaliforniaCSV
import play.api.{Configuration, Environment}
import play.api.cache.AsyncCacheApi
import play.api.libs.json._
import play.api.mvc._

import scala.concurrent.{Await, Future}
import scala.concurrent.duration._
import scala.language.{implicitConversions, postfixOps}
import scala.util.control.NonFatal
import scala.util.{Failure, Success, Try}


class CSVController @Inject()(val cache: AsyncCacheApi, cc: ControllerComponents, system:ActorSystem, configuration: Configuration) extends AbstractController(cc) with Logging {

  import scala.concurrent.ExecutionContext.Implicits.global


  implicit val actorSystem = ActorSystem("ServiceName")
  implicit val materializer = ActorMaterializer()
  implicit val timeout = Timeout(5 seconds)



  def upload = Action.async(parse.multipartFormData) { implicit request =>

    var tempDir = Files.createTempDirectory("Results")

    request.body.file("attachment").map {
      case upload if upload.filename.takeRight(3) != "csv" =>
        Future(BadRequest(
          Json.obj(
            "response" -> "Selected file is not a CSV",
            "status" -> "KO"
          )
        ))
      case upload => {
        val filename = upload.filename
        val uploadedFile = new File(tempDir + File.separator + filename)
        upload.ref.moveTo(uploadedFile)

        val fileStream = new FileInputStream(uploadedFile)


        val californiaCSV = new CaliforniaCSV

        val parameters = Await.result(californiaCSV.toParameter(fileStream), Duration.Inf)

        println(parameters)
      }
    }

          Future {
            Ok("File is missing")
          }

  }
}

