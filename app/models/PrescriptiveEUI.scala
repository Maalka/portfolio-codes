package models

import java.io.InputStream

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import play.api.libs.json.Reads._
import play.api.libs.json._
import squants.energy.{Energy, KBtus}
import squants.space.{Area, SquareFeet, SquareMeters}

import scala.concurrent



case class ModelValues(parameters:JsValue) {

  val lookupTable:Future[JsValue]={
    for {
      modelEUITable <- loadLookupTable("modelEndUses.json")
    } yield modelEUITable
  }


  def lookupModelTotalBaseIntensity(propDesc:ValidatedPropTypes): Future[Energy] = {
    for {
      endUseDistList <- lookupEndUses(propDesc, Some("base"))
      totalEUI <- getModelTotalEUI(endUseDistList)
    } yield KBtus(totalEUI)
  }

  def lookupModelTotalMetricIntensity(propDesc:ValidatedPropTypes): Future[Energy] = {
    for {
      endUseDistList <- lookupEndUses(propDesc, None)
      totalEUI <- getModelTotalEUI(endUseDistList)
    } yield KBtus(totalEUI)
  }


  def lookupModelEndUseEnergies(propDesc:ValidatedPropTypes): Future[TotalDistribution] = {
    for {
      endUseDistList <- lookupEndUses(propDesc, None)
      endUsePercents <- transformEndUses(1/propDesc.floor_area.value,endUseDistList)
    } yield endUsePercents
  }

  def lookupModelEndUsePercents(propDesc:ValidatedPropTypes): Future[TotalDistribution] = {
    for {
      endUseDistList <- lookupEndUses(propDesc, None)
      sum <- getModelTotalEUI(endUseDistList)
      endUsePercents <- transformEndUses(sum,endUseDistList)
    } yield endUsePercents
  }

  def getBuildingLookupDetails(propID:String):Future[Map[String,String]] = concurrent.Future{
    propID match {
      case "SecSchl" => Map("name"->"K-12 School","id" -> "SecSchl")
      case "Admin" => Map("name"->"City Hall/Administration","id" -> "Admin")
      case "Lib" => Map("name"->"Public Library","id" -> "Lib")
      case "fire_station" => Map("name"->"Fire Station","id" -> "fire_station")
      case "police_station" => Map("name"->"Police Station","id" -> "police_station")
    }
  }
  def getLookupString(propDesc:ValidatedPropTypes, scen:Option[String]):Future[Map[String,String]] = concurrent.Future {

    val cz: String = propDesc.climate_zone.toString
    val scenario:String = scen match {
      case Some(a) => a
      case _ => {
        (parameters \ "scenario").validate[String] match {
          case b:JsSuccess[String] => b.get
          case _ => "base"
        }
      }
    }


    val retobj = propDesc.building_type match {
      case "SecSchl" => Map("type" -> "K-12 School",
        "key" -> cz.concat("_SecSchl_" + scenario))
      case "Admin" => Map("type" -> "City Hall/Administration",
        "key" -> cz.concat("_Admin_" + scenario))
      case "Lib" => Map("type" -> "Public Library",
        "key" -> cz.concat("_Lib_" + scenario))
      case "fire_station" => Map("type" -> "Fire Station",
        "key" -> cz.concat("_fire_station_" + scenario))
      case "police_station" => Map("type" -> "Police Station",
        "key" -> cz.concat("_police_station_" + scenario))
    }

    retobj
  }

  def lookupEndUses(propDesc:ValidatedPropTypes,scenario:Option[String]): Future[TotalDistribution] = {
    for {
      table <- lookupTable
      building <- getLookupString(propDesc, scenario)
      euiDist <-
        Future {
          (table \ building("type") \ building("key")).head.toOption match {
            case Some(a) => {
              a.validate[TotalDistribution] match {
                case JsSuccess(b: TotalDistribution, _) => b
                case JsError(err) => throw new Exception(JsError.toJson(err).value.toString())
              }
            }
            case _ => throw new Exception("Could not retrieve Model EUI data!")
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

  def transformEndUses(factor:Double,Total:TotalDistribution):Future[TotalDistribution] = Future {
    TotalDistribution(
          Total.total_htg/factor,
          Total.total_clg/factor,
          Total.total_intLgt/factor,
          Total.total_extLgt/factor,
          Total.total_intEqp/factor,
          Total.total_extEqp/factor,
          Total.total_fans/factor,
          Total.total_pumps/factor,
          Total.total_heatRej/factor,
          Total.total_humid/factor,
          Total.total_heatRec/factor,
          Total.total_swh/factor,
          Total.total_refrg/factor,
          Total.total_gentor/factor,
          Total.total_net/factor
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
                              total_net:Double = 0.0
                            )

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
