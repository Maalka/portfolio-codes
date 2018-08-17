
package models


import squants.energy._
import squants.space._

import scala.concurrent.Future
import scala.language._
import scala.math._
import play.api.libs.json._
import play.api.Play

import scala.concurrent.ExecutionContext.Implicits.global
import java.io.InputStream

import play.api.libs.json.Reads.min
import play.api.libs.ws.WSResponse

import scala.util.control.NonFatal


case class EUIMetrics(parameters: JsValue, nrel_client: NREL_Client) {


  val result = parameters.as[List[JsValue]]

  val pvSystems: SolarProperties = SolarProperties(result.head)
  val prescriptiveEUI = PrescriptiveValues(result.head)

  def getPV = pvSystems.setPVDefaults
  def pVWattsResponse: Future[JsValue] = nrel_client.makeWsRequest(Seq.empty[(String, String)])

  def getBuildingData: Future[List[ValidatedPropTypes]] = {

    for {
      propList <- prescriptiveEUI.getValidatedPropList
      convertedProps <- Future.sequence(propList.map(convertPropType(_)))
    } yield convertedProps
  }
  val metricType: String = {
    (result.head \ "metric" \ "metric_type").validate[String] match {
      case s: JsSuccess[String] => s.get
      case e: JsError => "site"
    }
  }

  def getPVarea:Future[Double] = {
    for {
      systems <- getPV
      convertedSize <- convertSize(systems.map(_.pv_area).sum,"metric")
    } yield convertedSize
  }
  def getPVcapacity:Future[Double] = {
    for {
      systems <- getPV
      capacity <- Future(systems.map(_.system_capacity).sum)
    } yield capacity
  }

  def getPrescriptiveMetrics:Future[Map[String,Any]] = {

      for {
        buildingSize <- prescriptiveEUI.getBuildingSize
        convertedBuildingSize <- convertSize(buildingSize, "imperial")

        totalSite <- getPrescriptiveTotalMetric
        convertedTotalSite <- convertEnergy(totalSite)


        prescriptiveEndUses <- getPrescriptiveEndUses
        prescriptiveElectricity <- getPrescriptiveElectricity
        prescriptiveNG <- getPrescriptiveNG
        prescriptiveEndUsePercents <- getPrescriptiveEndUsePercents
        metricsMap <- Future{
          Map(
            "site_energy"->convertedTotalSite,
            "site_eui"->convertedTotalSite / convertedBuildingSize,
            "prescriptive_end_use_metric_data"->prescriptiveEndUses,
            "prescriptive_electricity_metric_data"->prescriptiveElectricity,
            "prescriptive_natural_gas_metric_data"->prescriptiveNG,
            "prescriptive_end_use_metric_percents"->prescriptiveEndUsePercents
          )
        }
      } yield metricsMap
  }


  def getPrescriptiveSourceMetrics:Future[Map[String,Any]] = {

      for {
        buildingSize <- prescriptiveEUI.getBuildingSize
        convertedBuildingSize <- convertSize(buildingSize, "imperial")

        totalSite <- getPrescriptiveTotalSource
        convertedTotalSite <- convertEnergy(totalSite)
        metricsMap <- Future{
          Map(
            "source_energy"->convertedTotalSite,
            "source_eui"->convertedTotalSite / convertedBuildingSize
          )
        }
      } yield metricsMap
  }


  def getPrescriptiveEndUsePercents: Future[EndUseDistribution] = {
    for {
      prescriptiveEndUSePercents <- prescriptiveEUI.lookupPrescriptiveEndUsePercents(None)
    } yield prescriptiveEndUSePercents
  }

  def getPrescriptiveEndUses: Future[EndUseDistribution] = {
    for {
      prescriptiveEndUses <- prescriptiveEUI.lookupPrescriptiveEndUses(None)
      converted <- convertPrescriptive(prescriptiveEndUses)
    } yield converted
  }

  def getPrescriptiveElectricity: Future[ElectricityDistribution] = {
    for {
      prescriptiveElectricityWeighted <- prescriptiveEUI.lookupPrescriptiveElectricityWeighted(None)
      converted <- convertPrescriptive(prescriptiveElectricityWeighted)
    } yield converted

  }

  def getPrescriptiveNG: Future[NaturalGasDistribution] = {
    for {
      prescriptiveNGWeighted <- prescriptiveEUI.lookupPrescriptiveNGWeighted(None)
      converted <- convertPrescriptive(prescriptiveNGWeighted)
    } yield converted
  }

  def getPrescriptiveMetricIntensity: Future[Energy] = {
    for {
      prescriptiveTotalEUI <- prescriptiveEUI.lookupPrescriptiveTotalMetricIntensity(None)
    } yield prescriptiveTotalEUI
  }

  def getPrescriptiveTotalMetric: Future[Energy] = {
    for {
      prescriptiveTotalEnergy <- getPrescriptiveMetricIntensity
      building_size <- prescriptiveEUI.getBuildingSize
    } yield prescriptiveTotalEnergy*building_size
  }


  def getPrescriptiveTotalSourceIntensity: Future[Energy] = {
    for {
      prescriptiveTotalEUI <- prescriptiveEUI.lookupPrescriptiveTotalMetricIntensity(Some("source"))
    } yield prescriptiveTotalEUI
  }

  def getPrescriptiveTotalSource: Future[Energy] = {
    for {
      prescriptiveTotalEnergy <- getPrescriptiveTotalSourceIntensity
      building_size <- prescriptiveEUI.getBuildingSize
    } yield prescriptiveTotalEnergy*building_size
  }



  //default reporting units are IMPERIAL (kbtu, square feet, ...)
  def reportingUnits: String = {
    result.head.asOpt[ReportingUnits] match {
      case Some(a) => a.reporting_units
      case _ => "imperial"
    }
  }


case class ReportingUnits(reporting_units:String)
  object ReportingUnits {
    implicit val ReportingUnitsReads: Reads[ReportingUnits] = Json.reads[ReportingUnits]
  }


  def convertPrescriptive[T](distribution: T):Future[T]  = Future {
    metricType match {
      case "carbon" => distribution.asInstanceOf[T]
      case _ => reportingUnits match {
        case ("metric") => {
          val c = energyMetricConstant / areaMetricConstant
          distribution match {
            case b:ElectricityDistribution => {
              ElectricityDistribution(
                b.elec_htg * c,
                b.elec_clg * c,
                b.elec_intLgt * c,
                b.elec_extLgt * c,
                b.elec_intEqp * c,
                b.elec_extEqp * c,
                b.elec_fans * c,
                b.elec_pumps * c,
                b.elec_heatRej * c,
                b.elec_humid * c,
                b.elec_heatRec * c,
                b.elec_swh * c,
                b.elec_refrg * c,
                b.elec_gentor * c,
                b.elec_net * c
              )
            }
            case b:NaturalGasDistribution => {
              NaturalGasDistribution(
                b.ng_htg * c,
                b.ng_clg * c,
                b.ng_intLgt * c,
                b.ng_extLgt * c,
                b.ng_intEqp * c,
                b.ng_extEqp * c,
                b.ng_fans * c,
                b.ng_pumps * c,
                b.ng_heatRej * c,
                b.ng_humid * c,
                b.ng_heatRec * c,
                b.ng_swh * c,
                b.ng_refrg * c,
                b.ng_gentor * c,
                b.ng_net * c
              )
            }
            case b:EndUseDistribution => {
              EndUseDistribution(
                b.htg * c,
                b.clg * c,
                b.intLgt * c,
                b.extLgt * c,
                b.intEqp * c,
                b.extEqp * c,
                b.fans * c,
                b.pumps * c,
                b.heatRej * c,
                b.humid * c,
                b.heatRec * c,
                b.swh * c,
                b.refrg * c,
                b.gentor * c,
                b.net * c
              )
            }
          }
        }.asInstanceOf[T]
        case _ => distribution.asInstanceOf[T]
      }
    }
  }

  def getPrescriptiveType:Future[String] = {
    for {
      prescriptiveParams <- prescriptiveEUI.getPrescriptiveParams
      prescriptiveType <- Future {
        prescriptiveParams.prescriptive_resource match {
          case 0 => "site"
          case 1 => "source"
          case 2 => "TDV"
          case 3 => "carbon"
        }
      }
    } yield prescriptiveType
  }

  def getSolarConversionConstant(conversionType:String, generationType:String): Future[Double] = {
    for {
      prescriptiveParams <- prescriptiveEUI.getPrescriptiveParams
      constant <- solarConversions(prescriptiveParams.climate_zone, generationType, conversionType)
    } yield constant
  }

  def solarConversions(cz:String, resource:String, conversionType:String): Future[Double] = Future{
    conversionType match {
      case "site" => 1.0
      case "source" => { // source-site multiplier
        resource match {
          case "solar" => {
            cz match {
              case "1" => 4768.0 / 3412
              case "2" =>	4768.0 / 3412
              case "3" =>	4768.0 / 3412
              case "4" =>	4768.0 / 3412
              case "5" =>	4768.0 / 3412
              case "6" =>	4703.0 / 3412
              case "7" =>	4703.0 / 3412
              case "8" =>	4703.0 / 3412
              case "9" =>	4703.0 / 3412
              case "10" =>	4703.0 / 3412
              case "11" =>	4768.0 / 3412
              case "12" =>	4768.0 / 3412
              case "13" =>	4768.0 / 3412
              case "14" =>	4703.0 / 3412
              case "15" =>	4703.0 / 3412
              case "16" =>	4703.0 / 3412
              case _ =>  throw new Exception ("Could not identify climate zone!")
            }
          }
          case "wind" => {
            cz match {
              case "1" => 2435.0 / 3412
              case "2" =>	2435.0 / 3412
              case "3" =>	2435.0 / 3412
              case "4" =>	2435.0 / 3412
              case "5" =>	2435.0 / 3412
              case "6" =>	2764.0 / 3412
              case "7" =>	2764.0 / 3412
              case "8" =>	2764.0 / 3412
              case "9" =>	2764.0 / 3412
              case "10" =>	2764.0 / 3412
              case "11" =>	2435.0 / 3412
              case "12" =>	2435.0 / 3412
              case "13" =>	2435.0 / 3412
              case "14" =>	2764.0 / 3412
              case "15" =>	2764.0 / 3412
              case "16" =>	2764.0 / 3412
              case _ =>  throw new Exception ("Could not identify climate zone!")
            }
          }
          case _ =>  throw new Exception ("Could not identify resource type (wind/solar)!")
        }
      }
      case "TDV" => { // source-site multiplier
        resource match {
          case "solar" => {
            cz match {
              case "1" => 24.62 / 3.412
              case "2" =>	27.34 / 3.412
              case "3" =>	25.41 / 3.412
              case "4" =>	27.05 / 3.412
              case "5" =>	25.33 / 3.412
              case "6" =>	28.97 / 3.412
              case "7" =>	29.74 / 3.412
              case "8" =>	30.47 / 3.412
              case "9" =>	29.41 / 3.412
              case "10" =>	28.88 / 3.412
              case "11" =>	27.99 / 3.412
              case "12" =>	27.71 / 3.412
              case "13" =>	27.5 / 3.412
              case "14" =>	30.09 / 3.412
              case "15" =>	29.01 / 3.412
              case "16" =>	24.79 / 3.412
              case _ =>  throw new Exception ("Could not identify climate zone!")
            }
          }
          case "wind" => {
            cz match {
              case "1" => 27.44 / 3.412
              case "2" =>	29.11 / 3.412
              case "3" =>	28.9 / 3.412
              case "4" =>	28.64 / 3.412
              case "5" =>	28.21 / 3.412
              case "6" =>	27.37 / 3.412
              case "7" =>	27.11 / 3.412
              case "8" =>	26.81 / 3.412
              case "9" =>	26.73 / 3.412
              case "10" =>	26.78 / 3.412
              case "11" =>	29.23 / 3.412
              case "12" =>	29.22 / 3.412
              case "13" =>	29.58 / 3.412
              case "14" =>	27.43 / 3.412
              case "15" =>	28.02 / 3.412
              case "16" =>	28.33 / 3.412
              case _ =>  throw new Exception ("Could not identify climate zone!")
            }
          }
          case _ =>  throw new Exception ("Could not identify resource type (wind/solar)!")
        }
      }
      case "carbon" => { // lb / Kbtu
        resource match {
          case "solar" => {
            cz match {
              case "1" => 623.0 / 3412
              case "2" =>	623.0 / 3412
              case "3" =>	623.0 / 3412
              case "4" =>	623.0 / 3412
              case "5" =>	623.0 / 3412
              case "6" =>	607.0 / 3412
              case "7" =>	607.0 / 3412
              case "8" =>	607.0 / 3412
              case "9" =>	607.0 / 3412
              case "10" =>	607.0 / 3412
              case "11" =>	623.0 / 3412
              case "12" =>	623.0 / 3412
              case "13" =>	623.0 / 3412
              case "14" =>	607.0 / 3412
              case "15" =>	607.0 / 3412
              case "16" =>	607.0 / 3412
              case _ =>  throw new Exception ("Could not identify climate zone!")
            }
          }
          case "wind" => {
            cz match {
              case "1" => 314.0 / 3412
              case "2" =>	314.0 / 3412
              case "3" =>	314.0 / 3412
              case "4" =>	314.0 / 3412
              case "5" =>	314.0 / 3412
              case "6" =>	357.0 / 3412
              case "7" =>	357.0 / 3412
              case "8" =>	357.0 / 3412
              case "9" =>	357.0 / 3412
              case "10" =>	357.0 / 3412
              case "11" =>	314.0 / 3412
              case "12" =>	314.0 / 3412
              case "13" =>	314.0 / 3412
              case "14" =>	357.0 / 3412
              case "15" =>	357.0 / 3412
              case "16" =>	357.0 / 3412
              case _ =>  throw new Exception ("Could not identify climate zone!")
            }
          }
          case _ =>  throw new Exception ("Could not identify resource type (wind/solar)!")
        }
      }

      case _ =>  throw new Exception ("Could not identify conversion type (TDV/carbon/source)!")
    }

  }


// final output conversions

  def energyMetricUnit(energyEntry:Energy):Energy = energyEntry in KilowattHours
  def energyMetricConstant:Double = KBtus(1) to KilowattHours //interpret as kwh per kbtu

  def areaMetricUnit(areaEntry:Double):Double = SquareFeet(areaEntry) to SquareMeters
  def areaImperialUnit(areaEntry:Double):Double = SquareMeters(areaEntry) to SquareFeet
  def areaMetricConstant:Double = SquareFeet(1) to SquareMeters//interpret as sq meters per sq ft

  def solarConversionEnergy: Future[Double] = Future{
    result.head.asOpt[ReportingUnits] match {
      case Some(a) => a.reporting_units match {
        case "metric" => 1.0
        case _ => 1.0 / energyMetricConstant
      }
      case _ => 1.0 / energyMetricConstant
    }
  }
  def solarConversionIntensity: Future[Double] = Future{
    result.head.asOpt[ReportingUnits] match {
      case Some(a) => a.reporting_units match {
        case "metric" => 1.0
        case _ => 1.0 / energyMetricConstant * areaMetricConstant
      }
      case _ => 1.0 / energyMetricConstant * areaMetricConstant
    }
  }

  def convertEnergy(energyEntry:Energy):Future[Energy] = Future{
    //input should always be KBtus
    reportingUnits match {
      case "imperial" => energyEntry
      case "metric" => energyMetricUnit(energyEntry)
      case _ =>  throw new Exception ("Reporting Units not Identified!")
    }
  }

  def convertEUI(energyEntry:Energy,areaEntry:Double):Future[Energy] = Future{
    reportingUnits match {
      case "imperial" => energyEntry / areaEntry
      case "metric" => energyMetricUnit(energyEntry) / areaMetricUnit(areaEntry)
    }
  }

  def convertSize(areaEntry:Double, startingUnits:String):Future[Double] = Future{
    startingUnits match {
      case "imperial" => {
        reportingUnits match {
          case "imperial" => areaEntry
          case "metric" => areaMetricUnit(areaEntry)
        }
      }
      case "metric" => {
        reportingUnits match {
          case "imperial" => areaImperialUnit(areaEntry)
          case "metric" => areaEntry
        }
      }
    }
  }


  def convertPropType(prop:ValidatedPropTypes):Future[ValidatedPropTypes] = Future{

    var floorArea = {
      prop.floor_area_units match {
        case "ftSQ" => {
          reportingUnits match {
            case "imperial" => prop.floor_area
            case "metric" => areaMetricUnit(prop.floor_area)
          }
        }
        case "mSQ" => {
          reportingUnits match {
            case "imperial" => areaImperialUnit(prop.floor_area)
            case "metric" => prop.floor_area
          }
        }
      }
    }

    var floorAreaUnits = {
      reportingUnits match {
        case "imperial" => "ftSQ"
        case "metric" => "mSQ"
      }
    }

  ValidatedPropTypes(prop.building_type, floorArea,floorAreaUnits)
  }

}





// These classes represent data that have been populated with defaults
case class BuildingData(
                           building_type: Option[String],
                           solar_file_id: Option[String],
                           climate_zone: Option[String],
                           floor_area: Option[Double],
                           floor_area_units: Option[String],
                           stories: Option[Double])

object BuildingData {
  implicit val BuildingDataReads: Reads[BuildingData] = Json.reads[BuildingData]
}

case class ValidatedBuildingData(
                           building_type: String,
                           solar_file_id: String,
                           climate_zone: String,
                           floor_area: Double,
                           floor_area_units: String,
                           stories: Double)






