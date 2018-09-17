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
import models._
import parsers.CodesCSV
import play.api.{Configuration, Environment}
import play.api.cache.AsyncCacheApi
import play.api.libs.json._
import play.api.mvc._
import squants.energy.Energy

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

        val codesCSV: CodesCSV = new CodesCSV


        val fileStream1 = new FileInputStream(uploadedFile)
        val prop_types = Await.result(codesCSV.toPortfolio(fileStream1), Duration.Inf)

        val cz = prop_types.headOption match {
          case Some(a) => a match {
            case Vector(a,b,c,d,e) => e
          }
        }

        var portfolio = Json.obj(
          "prop_types" -> prop_types.map{
            case Vector(a,b,c,d,e) =>
              Json.obj(
                "building_name" -> a,
                "building_type" -> b,
                "floor_area" -> JsNumber(c.toDouble),
                "floor_area_units" -> d
              )
          },
          "climate_zone" -> cz
        )

        Future{Ok(portfolio)}

      }
    }.getOrElse(Future{Ok("File is Missing")})

  }
}

