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
import parsers.CaliforniaCSV
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

        val californiaCSV = new CaliforniaCSV

        val fileStream1 = new FileInputStream(uploadedFile)
        val parameters = Await.result(californiaCSV.toParameter(fileStream1), Duration.Inf)

        val fileStream2 = new FileInputStream(uploadedFile)
        val project = Await.result(californiaCSV.toProject(fileStream2), Duration.Inf)

        val fileStream3 = new FileInputStream(uploadedFile)
        val annual = Await.result(californiaCSV.toAnnualResults(fileStream3), Duration.Inf)


        def mapEndUses(metrics:Seq[(String,String)]):Map[String,Any] = {


          var metricsMap:Seq[Map[String,Any]] = metrics.map {

            _ match {

              case (a, b) if a == "Space Heating" => Map("htg" -> b.toDouble)
              case (a, b) if a == "Space Cooling" => Map("clg" -> b.toDouble)
              case (a, b) if a == "Indoor Lighting" => Map("intLgt" -> b.toDouble)
              case (a, b) if a == "Other Lighting" => Map("extLgt" -> b.toDouble)
              case (a, b) if a == "Indoor Fans" => Map("fans" -> b.toDouble)
              case (a, b) if a == "Pumps & Misc." => Map("pumps" -> b.toDouble)
              case (a, b) if a == "Heat Rejection" => Map("heatRej" -> b.toDouble)
              case (a, b) if a == "Domestic Hot Water" => Map("swh" -> b.toDouble)
              case (a, b) if a == "TOTAL" => Map("net" -> b.toDouble)

              case (a, b) if a == "Batteries Discharge" => Map("discharge" -> b.toDouble)
              case (a, b) if a == "Batteries Charge" => Map("charge" -> b.toDouble)
              case (a, b) if a == "On-Site PV"=> Map("solar" -> b.toDouble)
              case (a, b) if a == "Net Energy" => Map("netenergy" -> b.toDouble)

              case (a, b) if a == "Receptacle" => Map("receptacle" -> b.toDouble)
              case (a, b) if a == "Process" => Map("process" -> b.toDouble)

              case (a, b) if a == "Interior" => Map("intEqp" -> b.toDouble) //interior Equipment
              case (a, b) if a == "Exterior" => Map("extEqp" -> b.toDouble) //exterior Equipment
              case (a, b) if a == "Heat Recovery" => Map("heatRec" -> b.toDouble) //heat recovery
              case (a, b) if a == "Refrigeration" => Map("refrg" -> b.toDouble) //refrigeration
              case (a, b) if a == "generator" => Map("gentor" -> b.toDouble) //generator

              case (a, b) if a == "COMPLIANCE TOTAL" => Map("compliance" -> b.toDouble)
              case (a, b) if a == "Energy Component" => Map("units" -> b)
              case (a, b)  => null

            }
          }

          metricsMap.flatten.toMap

        }




        val futures = Future.sequence(Seq(

          Future{
            annual.filter(_.contains("Proposed Design Site EUI"))
              .flatMap{
                case Vector(a,b,c,d,e) => Map(a->e)
              }
            }.map(mapEndUses(_)).map(api(_)).recover { case NonFatal(th) => apiRecover(th) },

          Future{
            annual.filter(_.contains("Proposed Design Source Energy"))
              .flatMap{
                case Vector(a,b,c,d,e) => Map(a->e)
              }
            }.map(mapEndUses(_)).map(api(_)).recover { case NonFatal(th) => apiRecover(th) },

          Future{
            annual.filter(_.contains("Proposed Design TDV"))
              .flatMap{
                case Vector(a,b,c,d,e) => Map(a->e)
              }
            }.map(mapEndUses(_)).map(api(_)).recover { case NonFatal(th) => apiRecover(th) },

          Future{
            annual.filter(_.contains("Proposed Design Emissions"))
              .flatMap {
                case Vector(a, b, c, d, e) => Map(a -> e)
              }
            }.map(mapEndUses(_)).map(api(_)).recover { case NonFatal(th) => apiRecover(th) }

        ))



        val fieldNames = Seq(
          "siteMetrics",
          "sourceMetrics",
          "tdvMetrics",
          "carbonMetrics"
        )



        futures.map(fieldNames.zip(_)).map { r =>
          val errors = r.collect {
            case (n, Left(s)) => Json.obj(n -> s)
          }
          val results = r.collect {
            case (n, Right(s)) => Json.obj(n -> s)
          }

//          println(Json.obj(
//            "values" -> results,
//            "errors" -> errors
//          ))

          Ok(Json.obj(
            "values" -> results,
            "errors" -> errors
          ))
        }


      }
    }.getOrElse(Future{Ok("File is Missing")})

  }
}

