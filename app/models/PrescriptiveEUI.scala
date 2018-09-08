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



  def lookupPrescriptiveElectricity(propDesc:ValidatedPropTypes): Future[ElectricityDistribution] = {
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
  def lookupPrescriptiveNG(propDesc:ValidatedPropTypes): Future[NaturalGasDistribution] = {
    for {
      euiDist <-
        Future {
          (lookupTable \ propDesc.building_type \ lookupParams.climate_zone).toOption match {
            case Some(a) => a.head.validate[NaturalGasDistribution] match {
              case JsSuccess(b: NaturalGasDistribution, _) => b
              case JsError(err) => throw new Exception(JsError.toJson(err).value.toString())
            }
            case _ => throw new Exception("Could not retrieve Prescriptive EUI (NG) data!")
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
          elec.elec_htg + ng.ng_htg,
          elec.elec_clg + ng.ng_clg,
          elec.elec_intLgt + ng.ng_intLgt,
          elec.elec_extLgt + ng.ng_extLgt,
          elec.elec_intEqp + ng.ng_intEqp,
          elec.elec_extEqp + ng.ng_extEqp,
          elec.elec_fans + ng.ng_fans,
          elec.elec_pumps + ng.ng_pumps,
          elec.elec_heatRej + ng.ng_heatRej,
          elec.elec_humid + ng.ng_humid,
          elec.elec_heatRec + ng.ng_heatRec,
          elec.elec_swh + ng.ng_swh,
          elec.elec_refrg + ng.ng_refrg,
          elec.elec_gentor + ng.ng_gentor,
          elec.elec_net + ng.ng_net
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


case class ElectricityDistribution(elec_htg:Double,elec_clg:Double,elec_intLgt:Double = 0.0,elec_extLgt:Double = 0.0,elec_intEqp:Double = 0.0,
                                   elec_extEqp:Double = 0.0, elec_fans:Double = 0.0,elec_pumps:Double = 0.0,elec_heatRej:Double = 0.0,
                                   elec_humid:Double = 0.0, elec_heatRec:Double = 0.0,elec_swh:Double = 0.0,elec_refrg:Double = 0.0,
                                   elec_gentor:Double = 0.0,elec_net:Double = 0.0)

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