/**
 * Created by rimukas on 10/12/15.
 */


package controllers
import com.eclipsesource.schema._
import com.eclipsesource.schema.internal.validation.VA
import models._
import com.google.inject.Inject
import play.api.Logger
import play.api.cache.{AsyncCacheApi, SyncCacheApi}
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json.Reads.min
import play.api.libs.json._
import play.api.mvc._

import scala.concurrent.{Await, Future}
import squants.energy.{Energy, MegawattHours}

import scala.util.control.NonFatal
import scala.concurrent.ExecutionContext.Implicits.global
import scala.language.implicitConversions
import scala.concurrent.duration._

class BaselineController @Inject() (val cache: AsyncCacheApi, cc: ControllerComponents) extends AbstractController(cc) with Logging {

  implicit def doubleToJSValue(d: Double): JsValue = Json.toJson(d)

  implicit def energyToJSValue(b: Energy): JsValue = Json.toJson(b.value)

  implicit def listEnergyToJSValue(v: List[Energy]): JsValue = Json.toJson(v.map {
    case e: Energy => e.value
  })

   def electricityDistributionToJSValue(a: ElectricityDistribution): JsValue = {
     JsObject(Seq(
       "htg" -> JsNumber(a.total_htg),
       "clg" -> JsNumber(a.total_clg),
       "intLgt" -> JsNumber(a.total_intLgt),
       "extLgt" -> JsNumber(a.total_extLgt),
       "intEqp" -> JsNumber(a.total_intEqp),
       "extEqp" -> JsNumber(a.total_extEqp),
       "fans" -> JsNumber(a.total_fans),
       "pumps" -> JsNumber(a.total_pumps),
       "heatRej" -> JsNumber(a.total_heatRej),
       "humid" -> JsNumber(a.total_humid),
       "heatRec" -> JsNumber(a.total_heatRec),
       "swh" -> JsNumber(a.total_swh),
       "refrg" -> JsNumber(a.total_refrg),
       "gentor" -> JsNumber(a.total_gentor),
       "net" -> JsNumber(a.total_net)
     ))
   }

   def ngDistributionToJSValue(a: NaturalGasDistribution): JsValue = {
     JsObject(Seq(
       "htg" -> JsNumber(a.ng_htg),
       "clg" -> JsNumber(a.ng_clg),
       "intLgt" -> JsNumber(a.ng_intLgt),
       "extLgt" -> JsNumber(a.ng_extLgt),
       "intEqp" -> JsNumber(a.ng_intEqp),
       "extEqp" -> JsNumber(a.ng_extEqp),
       "fans" -> JsNumber(a.ng_fans),
       "pumps" -> JsNumber(a.ng_pumps),
       "heatRej" -> JsNumber(a.ng_heatRej),
       "humid" -> JsNumber(a.ng_humid),
       "heatRec" -> JsNumber(a.ng_heatRec),
       "swh" -> JsNumber(a.ng_swh),
       "refrg" -> JsNumber(a.ng_refrg),
       "gentor" -> JsNumber(a.ng_gentor),
       "net" -> JsNumber(a.ng_net)
     ))
   }

   def endUseDistributionToJSValue(a: EndUseDistribution): JsValue = {
     JsObject(Seq(
       "htg" -> JsNumber(a.htg),
       "clg" -> JsNumber(a.clg),
       "intLgt" -> JsNumber(a.intLgt),
       "extLgt" -> JsNumber(a.extLgt),
       "intEqp" -> JsNumber(a.intEqp),
       "extEqp" -> JsNumber(a.extEqp),
       "fans" -> JsNumber(a.fans),
       "pumps" -> JsNumber(a.pumps),
       "heatRej" -> JsNumber(a.heatRej),
       "humid" -> JsNumber(a.humid),
       "heatRec" -> JsNumber(a.heatRec),
       "swh" -> JsNumber(a.swh),
       "refrg" -> JsNumber(a.refrg),
       "gentor" -> JsNumber(a.gentor),
       "net" -> JsNumber(a.net)
     ))
   }


  def roundAt(p: Int)(n: Double): Double = {
    val s = math pow(10, p);
    (math round n * s) / s
  }

  def apiRecover(throwable: Throwable): Either[String, JsValue] = {
    throwable match {
      case NonFatal(th) => Left(th.getMessage)
    }
  }

  def api[T](response: T): Either[String, JsValue] = {

    response match {
      case v: Energy => Right(v)
      case v: Double => Right(v)
      case v: Int => Right(Json.toJson(v))
      case v: Map[String,Any] => Right(
        JsObject(v.map {
          case (a,b) => {
            val ret: (String, JsValue) = b match {
              case _: String => a.toString -> JsString(b.asInstanceOf[String])
              case _: Double => a.toString -> JsNumber(b.asInstanceOf[Double])
              case _: Energy => a.toString -> energyToJSValue(b.asInstanceOf[Energy])
              case _: ElectricityDistribution => a.toString -> electricityDistributionToJSValue(b.asInstanceOf[ElectricityDistribution])
              case _: NaturalGasDistribution => a.toString -> ngDistributionToJSValue(b.asInstanceOf[NaturalGasDistribution])
              case _: EndUseDistribution => a.toString -> endUseDistributionToJSValue(b.asInstanceOf[EndUseDistribution])
            }
            ret
          }
        })
      )
      case v: List[Any] => Right {
        Json.toJson(v.map {
          case a: Energy => energyToJSValue(a)
          case a: ValidatedPropTypes => JsObject(Seq(
            "prop_types" -> JsString(a.building_type),
            "floor_area" -> JsNumber(a.floor_area),
            "floor_area_units" -> JsString(a.floor_area_units)
          ))
        })
        }
      case v: String => Right(Json.toJson(v))
      case None => Left("Could not recognize input type")
    }
  }



  val validator = new SchemaValidator()

  val schema = Json.fromJson[SchemaType](Json.parse(
    """{
        "type": "array",
        "id": "http://znc.maalka.com/znc",
        "items": [
          {
          "id": "/items",
          "type": "object",
          "properties": {
            "prop_types": {
               "id": "/items/properties/prop_types",
               "type": "array",
               "required":true,
               "items": {
                   "type": "object",
                   "minItems": 1,
                   "properties": {
                     "building_type": {
                     "type": "string",
                     "enum": ["OfficeLarge", "OfficeMedium", "OfficeSmall", "RetailStandalone", "RetailStripmall",
                             "SchoolPrimary", "SchoolSecondary", "Hospital", "OutPatientHealthCare",
                             "RestaurantSitDown", "RestaurantFastFood", "HotelLarge", "HotelSmall",
                             "Warehouse", "ApartmentHighRise", "ApartmentMidRise", "Office", "Retail", "School",
                             "Healthcare", "Restaurant", "Hotel", "Apartment", "Warehouse", "AllOthers"]
                     },
                     "building_name": {
                       "type": "string"
                     },
                     "floor_area": {
                      "type": "number",
                      "minimum": 0
                     },
                     "floor_area_units": {
                       "type": "string",
                       "enum": ["mSQ", "ftSQ"]
                     }
                   },
                   "required": [
                     "building_name",
                     "building_type",
                     "floor_area",
                     "floor_area_units"
                   ]
               }
             },
            "reporting_units": {
              "type": "string",
              "enum": ["imperial", "metric"]
            },
            "climate_zone": {
              "type": "string",
              "enum": ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"],
              "required": true
            }
          }
          }
        ]
      }""".stripMargin)).get

  def getEnergyMetrics() = Action.async(parse.json) { implicit request =>

    val json: JsValue = request.body
    val result = validator.validate(schema, json)

    result.fold(
      invalid = { errors =>
        Future {
          BadRequest(errors.toJson)
        }
      },
      valid = { post =>

        val Baseline: EUIMetrics = EUIMetrics(json)



        val futures = Future.sequence(Seq(

          Baseline.getPrescriptiveMetrics.map(api(_)).recover { case NonFatal(th) => apiRecover(th) },
          Baseline.getBuildingData.map(api(_)).recover { case NonFatal(th) => apiRecover(th) }

        ))

        val fieldNames = Seq(


          "prescriptive_metrics",
          "buildings"

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
    )
  }
}