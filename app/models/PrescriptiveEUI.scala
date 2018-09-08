package models

import java.io.InputStream

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



case class PrescriptiveValues {

  val lookupTable:Future[JsValue]={
    for {
      lookupTableName <- Future {
        "prescriptive_site_0.json"
      }
      prescriptiveEUITable <- loadLookupTable(lookupTableName)
    } yield prescriptiveEUITable

  }

  def getBuildingSize:Future[Double] = {
    for {
      validatedPropList <- getValidatedPropList
      building_size <- Future(validatedPropList.map(_.floor_area)
    } yield building_size
  }

  def getBuildingSize:Future[Double] = {
    for {
      validatedPropList <- getValidatedPropList
      building_size <- Future(validatedPropList.map(_.floor_area)
    } yield building_size
  }

  def lookupPrescriptiveTotalMetricIntensity(propDesc:ValidatedPropTypes): Future[Energy] = {
    for {
      endUseDistList <- lookupPrescriptiveEndUses(propDesc)
      totalEUI <- getPrescriptiveTotalEUI(endUseDistList)
    } yield KBtus(totalEUI)
  }


  def lookupPrescriptiveEndUsePercents(propDesc:ValidatedPropTypes): Future[EndUseDistribution] = {
    for {
      endUseDistList <- lookupPrescriptiveEndUses(propDesc)
      endUsePercents <- getEndUseDistPercents(endUseDistList)
    } yield endUsePercents
  }

  def lookupPrescriptiveEndUses(propDesc:ValidatedPropTypes): Future[EndUseDistribution] = {
    for {
      electric <- lookupPrescriptiveElectricity(propDesc)
      ng <- lookupPrescriptiveNG(propDesc)
      weightedEndUseDistList <- getWeightedEndUSeDistList(electric,ng)
    } yield weightedEndUseDistList
  }



  def lookupEndUses(propDesc:ValidatedPropTypes): Future[ElectricityDistribution] = {
    for {
      euiDist <-
        Future {
          (lookupTable \ propDesc.building_type \ lookupParams.climate_zone).toOption match {
            case Some(a) => a.head.validate[ElectricityDistribution] match {
              case JsSuccess(b: ElectricityDistribution, _) => b
              case JsError(err) => throw new Exception(JsError.toJson(err).value.toString())
            }
            case _ => throw new Exception("Could nort retrieve Prescriptive EUI (Electric) data!")
          }
        }
    } yield euiDist
  }


  def getPrescriptiveTotalEUI(EndUses:EndUseDistribution):Future[Double] = Future {
// End Uses are in KBtu and building size is in Square Feet

          EndUses.htg +
          EndUses.clg +
          EndUses.intLgt +
          EndUses.extLgt +
          EndUses.intEqp +
          EndUses.extEqp +
          EndUses.fans +
          EndUses.pumps +
          EndUses.heatRej +
          EndUses.humid +
          EndUses.heatRec +
          EndUses.swh +
          EndUses.refrg +
          EndUses.gentor

    }

  def getEndUseDistPercents(EndUses:EndUseDistribution):Future[EndUseDistribution] = Future {

        val sum = {
          EndUses.htg +
          EndUses.clg +
          EndUses.intLgt +
          EndUses.extLgt +
          EndUses.intEqp +
          EndUses.extEqp +
          EndUses.fans +
          EndUses.pumps +
          EndUses.heatRej +
          EndUses.humid +
          EndUses.heatRec +
          EndUses.swh +
          EndUses.refrg +
          EndUses.gentor
        }

       EndUseDistribution(
          EndUses.htg/sum,
          EndUses.clg/sum,
          EndUses.intLgt/sum,
          EndUses.extLgt/sum,
          EndUses.intEqp/sum,
          EndUses.extEqp/sum,
          EndUses.fans/sum,
          EndUses.pumps/sum,
          EndUses.heatRej/sum,
          EndUses.humid/sum,
          EndUses.heatRec/sum,
          EndUses.swh/sum,
          EndUses.refrg/sum,
          EndUses.gentor/sum,
          EndUses.net/sum
        )
    }

  def getWeightedEndUSeDistList(elec:ElectricityDistribution, ng:NaturalGasDistribution):Future[EndUseDistribution] = Future {

        EndUseDistribution(
          elec.total_htg + ng.ng_htg,
          elec.total_clg + ng.ng_clg,
          elec.total_intLgt + ng.ng_intLgt,
          elec.total_extLgt + ng.ng_extLgt,
          elec.total_intEqp + ng.ng_intEqp,
          elec.total_extEqp + ng.ng_extEqp,
          elec.total_fans + ng.ng_fans,
          elec.total_pumps + ng.ng_pumps,
          elec.total_heatRej + ng.ng_heatRej,
          elec.total_humid + ng.ng_humid,
          elec.total_heatRec + ng.ng_heatRec,
          elec.total_swh + ng.ng_swh,
          elec.total_refrg + ng.ng_refrg,
          elec.total_gentor + ng.ng_gentor,
          elec.total_net + ng.ng_net
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
          case i => throw new Exception("Prescriptive EUI Lookup - Could not open file: %s".format(i))
        }
      }
    } yield json
  }


  def getValidatedPropParams(propDesc: PropDesc): Future[ValidatedPropTypes] = Future {
    val propType:String = propDesc.building_type match {
      case Some(b: String) => b
      case _ => throw new Exception("Not a Proper Building Type")
    }
    val units:String = propDesc.floor_area_units match {
      case Some("mSQ") => "mSQ"
      case Some("ftSQ") => "ftSQ"
      case _ => throw new Exception("Floor Area Units must be either ftSQ or mSQ")
    }

    val floorArea:Double = propDesc.floor_area match {
      case Some(a: Double) => {
        units match {
          case "mSQ" => SquareMeters(a) to SquareFeet
          case "ftSQ" => SquareFeet(a).value
          case _ => throw new Exception("Floor Area Units Must be mSQ or ftSQ! ")
        }
      }
      case _ => throw new Exception("No Floor Area Found! ")
    }
    ValidatedPropTypes(propType,floorArea,"ftSQ")
  }


  def getValidatedPropList(parameters:JsValue): Future[List[ValidatedPropTypes]] =  {

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




case class EndUseDistribution(htg:Double,clg:Double,intLgt:Double = 0.0,extLgt:Double = 0.0,intEqp:Double = 0.0,
                                   extEqp:Double = 0.0, fans:Double = 0.0,pumps:Double = 0.0,heatRej:Double = 0.0,
                                   humid:Double = 0.0, heatRec:Double = 0.0,swh:Double = 0.0,refrg:Double = 0.0,
                                   gentor:Double = 0.0,net:Double = 0.0)


case class ElectricityDistribution(total_htg:Double,total_clg:Double,total_intLgt:Double = 0.0,total_extLgt:Double = 0.0,total_intEqp:Double = 0.0,
                                   total_extEqp:Double = 0.0, total_fans:Double = 0.0,total_pumps:Double = 0.0,total_heatRej:Double = 0.0,
                                   total_humid:Double = 0.0, total_heatRec:Double = 0.0,total_swh:Double = 0.0,total_refrg:Double = 0.0,
                                   total_gentor:Double = 0.0,total_net:Double = 0.0)

object ElectricityDistribution {
  implicit val ElectricityDistributionReads: Reads[ElectricityDistribution] = Json.reads[ElectricityDistribution]
}
case class NaturalGasDistribution(ng_htg:Double = 0.0,ng_clg:Double = 0.0,ng_intLgt:Double = 0.0,ng_extLgt:Double = 0.0,
                                  ng_intEqp:Double = 0.0,ng_extEqp:Double = 0.0,ng_fans:Double = 0.0,ng_pumps:Double = 0.0,
                                  ng_heatRej:Double = 0.0,ng_humid:Double = 0.0,ng_heatRec:Double = 0.0, ng_swh:Double = 0.0,
                                  ng_refrg:Double = 0.0,ng_gentor:Double = 0.0,ng_net:Double = 0.0)

object NaturalGasDistribution {
  implicit val NaturalGasDistributionReads: Reads[NaturalGasDistribution] = Json.reads[NaturalGasDistribution]
}







case class ValidatedPropList(prop_types: List[ValidatedPropTypes])

object ValidatedPropList {
  implicit val ValidatedPropListReads: Reads[ValidatedPropList] = Json.reads[ValidatedPropList]
}

case class ValidatedPropTypes(building_type: String,floor_area: Double, floor_area_units: String)

object ValidatedPropTypes {
  implicit val ValidatedPropTypesReads: Reads[ValidatedPropTypes] = Json.reads[ValidatedPropTypes]
}




case class PropList(prop_types: List[PropDesc])

object PropList {
  implicit val PropListReads: Reads[PropList] = Json.reads[PropList]
}

case class PropDesc(building_type: Option[String],floor_area: Option[Double], floor_area_units: Option[String])

object PropDesc {
  implicit val PropDescReads: Reads[PropDesc] = Json.reads[PropDesc]
}