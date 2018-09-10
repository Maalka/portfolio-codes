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

  def apiRecover(throwable: Throwable): Either[String, JsValue] = {
    throwable match {
      case NonFatal(th) => Left(th.getMessage)
    }
  }


  def api[T](response: T): Either[String, JsValue] = {

    response match {

      case v: Map[String, Any] => Right(
        JsObject(v.map {
          case (a, b) => {
            val ret: (String, JsValue) = b match {
              case _: String => a.toString -> JsString(b.asInstanceOf[String])
              case _: Double => a.toString -> JsNumber(b.asInstanceOf[Double])
            }
            ret
          }
        })
      )
      case v: Vector[Any] => Right {
        Json.toJson(v.map {
          case v: Map[String,Any] =>
            JsObject(v.map {
              case (a,b) => {
                val ret: (String, JsValue) = b match {
                  case _: String => a.toString -> JsString(b.asInstanceOf[String])
                  case _: Double => a.toString -> JsNumber(b.asInstanceOf[Double])
                }
                ret
              }
            })
        })
      }
      case v: String => Right(Json.toJson(v))
      case None => Left("Could not recognize input type")
    }
  }


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



        val futures = Future.sequence(Seq(

          Future{
            prop_types
              .map{
                case Vector(a,b,c,d,e) => {
                  Map(
                    "building_name" -> a,
                    "building_type" -> b,
                    "floor_area" -> c,
                    "floor_area_units" -> d
                  )
                }
              }
            }.map(api(_)).recover { case NonFatal(th) => apiRecover(th) },

          Future{
            prop_types.headOption match {
              case Some(a) => a match {
                case Vector(a,b,c,d,e) => Map("climate_zone" -> e)
              }
            }
          }.map(api(_)).recover { case NonFatal(th) => apiRecover(th) }
        ))

        val fieldNames = Seq(
          "prop_types",
          "climate_zone"
        )




        futures.map(fieldNames.zip(_)).map { r =>
          val errors = r.collect {
            case (n, Left(s)) => Json.obj(n -> s)
          }
          val results = r.collect {
            case (n, Right(s)) => Json.obj(n -> s)
          }

          Ok(Json.obj(
            "values" -> results,
            "errors" -> errors
          ))
        }


      }
    }.getOrElse(Future{Ok("File is Missing")})

  }
}

