package models

import java.io.InputStream

import akka.actor.Status.Success
import play.{Environment, api}
import play.api.{Environment, Play}
import play.api.libs.json._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import play.api.libs.functional.syntax._
import play.api.libs.functional.syntax._
import play.api.libs.json.Reads._
import play.api.libs.json._
import squants.Energy
import squants.energy.{Energy, KBtus}
import squants.space.{Area, SquareFeet, SquareMeters}



case class ModelValues(parameters:JsValue) {

  val lookupTable:Future[JsValue]={
    for {
      modelEUITable <- loadLookupTable("prescriptive_site_0.json")
    } yield modelEUITable

  }



  def lookupModelTotalMetricIntensity(propDesc:ValidatedPropTypes): Future[Energy] = {
    for {
      endUseDistList <- lookupEndUses(propDesc)
      totalEUI <- getModelTotalEUI(endUseDistList)
    } yield KBtus(totalEUI)
  }


  def lookupModelEndUsePercents(propDesc:ValidatedPropTypes): Future[TotalDistribution] = {
    for {
      endUseDistList <- lookupEndUses(propDesc)
      sum <- getModelTotalEUI(endUseDistList)
      endUsePercents <- getEndUseDistPercents(sum,endUseDistList)
    } yield endUsePercents
  }

  def lookupEndUses(propDesc:ValidatedPropTypes): Future[TotalDistribution] = {
    for {
      table <- lookupTable
      euiDist <-
        Future {
          (table \ propDesc.building_type \ propDesc.climate_zone.toString).head.toOption match {
            case Some(a) => {
              a.validate[TotalDistribution] match {
                case JsSuccess(b: TotalDistribution, _) => b
                case JsError(err) => throw new Exception(JsError.toJson(err).value.toString())
              }
            }
            case _ => throw new Exception("Could not retrieve Model EUI (Electric) data!")
          }
        }
    } yield euiDist

  }



  def getModelTotalEUI(Total:TotalDistribution):Future[Double] = Future {

          Total.total_htg +
          Total.total_clg +
          Total.total_intLgt +
          Total.total_extLgt +
          Total.total_intEqp +
          Total.total_extEqp +
          Total.total_fans +
          Total.total_pumps +
          Total.total_heatRej +
          Total.total_humid +
          Total.total_heatRec +
          Total.total_swh +
          Total.total_refrg +
          Total.total_gentor

    }

  def getEndUseDistPercents(sum:Double,Total:TotalDistribution):Future[TotalDistribution] = Future {

    TotalDistribution(
          Total.total_htg/sum,
          Total.total_clg/sum,
          Total.total_intLgt/sum,
          Total.total_extLgt/sum,
          Total.total_intEqp/sum,
          Total.total_extEqp/sum,
          Total.total_fans/sum,
          Total.total_pumps/sum,
          Total.total_heatRej/sum,
          Total.total_humid/sum,
          Total.total_heatRec/sum,
          Total.total_swh/sum,
          Total.total_refrg/sum,
          Total.total_gentor/sum,
          Total.total_net/sum
        )
    }




  def loadLookupTable(filename:String): Future[JsValue] = {
    for {
      is <- Future(play.api.Environment.simple().resourceAsStream(filename))
      json <- Future {
        is match {
          case Some(is: InputStream) => {
            Json.parse(is)
          }
          case i => throw new Exception("Model EUI Lookup - Could not open file: %s".format(i))
        }
      }
    } yield json
  }


  def getValidatedPropParams(propDesc: PropDesc): Future[ValidatedPropTypes] = Future {

    val climate_zone:String =
      (parameters \ "climate_zone").validate[String] match {
        case b:JsSuccess[String] => b.get
        case _ => throw new Exception("No Climate Zone")
      }

    val propName:String = propDesc.building_name match {
      case Some(b: String) => b
      case _ => throw new Exception("Not a Proper Building Type")
    }
    val propType:String = propDesc.building_type match {
      case Some(b: String) => b
      case _ => throw new Exception("Not a Proper Building Type")
    }
    val units:String = propDesc.floor_area_units match {
      case Some("mSQ") => "mSQ"
      case Some("ftSQ") => "ftSQ"
      case _ => throw new Exception("Floor Area Units must be either ftSQ or mSQ")
    }

    val floorArea:Area = propDesc.floor_area match {
      case Some(a: Double) => {
        units match {
          case "mSQ" => SquareMeters(a) in SquareFeet
          case "ftSQ" => SquareFeet(a)
          case _ => throw new Exception("Floor Area Units Must be mSQ or ftSQ! ")
        }
      }
      case _ => throw new Exception("No Floor Area Found! ")
    }
    ValidatedPropTypes(propType,propName, floorArea, climate_zone)
  }


  def getValidatedPropList: Future[List[ValidatedPropTypes]] =  {

    for {
      props:PropList <-
        Future {
          parameters.validate[PropList] match {
              case JsSuccess(b: PropList, _) => b
              case JsError(err) => throw new Exception("Problem with submitted Prop List!")
          }
        }
      validatedProps <- {
        props.prop_types.isEmpty match {
          case true => throw new Exception("Prop List is Empty!")
          case _ => Future.sequence(props.prop_types.map(getValidatedPropParams(_)))
        }
      }
    } yield validatedProps
  }
}





case class TotalDistribution(
                              total_htg:Double,
                              total_clg:Double,
                              total_intLgt:Double = 0.0,
                              total_extLgt:Double = 0.0,
                              total_intEqp:Double = 0.0,
                              total_extEqp:Double = 0.0,
                              total_fans:Double = 0.0,
                              total_pumps:Double = 0.0,
                              total_heatRej:Double = 0.0,
                              total_humid:Double = 0.0,
                              total_heatRec:Double = 0.0,
                              total_swh:Double = 0.0,
                              total_refrg:Double = 0.0,
                              total_gentor:Double = 0.0,
                              total_net:Double = 0.0)

object TotalDistribution {
  implicit val TotalDistributionReads: Reads[TotalDistribution] = Json.reads[TotalDistribution]
}




case class ValidatedPropList(prop_types: List[ValidatedPropTypes])

case class ValidatedPropTypes(building_type: String, building_name:String, floor_area: Area, climate_zone:String)




case class PropList(prop_types: List[PropDesc])

object PropList {
  implicit val PropListReads: Reads[PropList] = Json.reads[PropList]
}

case class PropDesc(building_type: Option[String], building_name: Option[String],floor_area: Option[Double], floor_area_units: Option[String])

object PropDesc {
  implicit val PropDescReads: Reads[PropDesc] = Json.reads[PropDesc]
}