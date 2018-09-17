
package models


import squants.energy._
import squants.space._
import scala.concurrent.Future
import scala.language._
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import squants.Energy



case class EUIMetrics(parameters: JsValue) {


  val result = parameters.as[List[JsValue]]


  val modelEUI = ModelValues(result.head)


  def getTotalEUIBreakdownList:Future[Seq[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      propNames <- Future{propList.map(_.building_name)}
      modelBreakdowns <- Future.sequence(propList.map{modelEUI.lookupEndUses(_)})
    } yield {
      (propNames,modelBreakdowns)
        .zipped.map{
        case (a,b) => Map(
          "building_name" -> a,
          "eui_breakdown" -> b
        )
      }
    }
  }


  def getTotalEnergyBreakdownList:Future[Seq[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      propNames <- Future{propList.map(_.building_name)}
      modelBreakdowns <- Future.sequence(propList.map{modelEUI.lookupModelEndUseEnergies(_)})
    } yield {
      (propNames,modelBreakdowns).zipped.map{
        case (a,b) => Map(
          "building_name" -> a,
          "energy_breakdown" -> b
        )
      }
    }
  }

  def getTotalEUIPercentsList:Future[Seq[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      propNames <- Future {
        propList.map(_.building_name)
      }
      modelBreakdowns <- Future.sequence(propList.map {
        modelEUI.lookupModelEndUsePercents(_)
      })
    } yield {
      (propNames, modelBreakdowns).zipped.map {
        case (a,b) => Map(
          "building_name" -> a,
          "eui" -> b
        )
      }
    }
  }


  def getTotalEUIList:Future[List[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      propNames <- Future{propList.map(_.building_name)}
      modelTotalEUI <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})
    } yield {
      (propNames,modelTotalEUI).zipped.map{
        case (a,b) => Map(
          "building_name" -> a,
          "eui" -> b
        )
      }
    }
  }

  def getTotalEnergyList(): Future[List[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      propNames <- Future{propList.map(_.building_name)}
      areaList:List[Double] <- Future{propList.map(_.floor_area.value)}
      energyList:List[Energy] <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})
      energyList:List[Energy] <- Future{(areaList,energyList).zipped.map(_*_)}

    } yield {
      (propNames,energyList).zipped.map{
        case (a,b) => Map(
          "building_name" -> a,
          "energy" -> b
        )
      }
    }
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





// final output conversions

  def energyMetricUnit(energyEntry:Energy):Energy = energyEntry in KilowattHours
  def energyMetricConstant:Double = KBtus(1) to KilowattHours //interpret as kwh per kbtu

  def areaMetricUnit(areaEntry:Double):Double = SquareFeet(areaEntry) to SquareMeters
  def areaImperialUnit(areaEntry:Double):Double = SquareMeters(areaEntry) to SquareFeet
  def areaMetricConstant:Double = SquareFeet(1) to SquareMeters//interpret as sq meters per sq ft


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


}





// These classes represent data that have been populated with defaults
case class BuildingData(
                           building_type: Option[String],
                           climate_zone: Option[String],
                           floor_area: Option[Double],
                           floor_area_units: Option[String])

object BuildingData {
  implicit val BuildingDataReads: Reads[BuildingData] = Json.reads[BuildingData]
}

case class ValidatedBuildingData(
                           building_type: String,
                           climate_zone: String,
                           floor_area: Double,
                           floor_area_units: String)







